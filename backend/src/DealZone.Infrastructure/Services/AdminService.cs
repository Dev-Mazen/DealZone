using DealZone.Application.Admin.DTOs;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Verification.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Notifications;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Services;

/// <summary>
/// Admin-only operations: company verification review workflow.
/// </summary>
public class AdminService : IAdminService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorage;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<AdminService> _logger;

    public AdminService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        IFileStorageService fileStorage,
        IEmailService emailService,
        INotificationService notificationService,
        IDateTimeProvider dateTimeProvider,
        ILogger<AdminService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _fileStorage = fileStorage;
        _emailService = emailService;
        _notificationService = notificationService;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // Queries
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<PendingCompanyDto>> GetPendingCompaniesAsync(
        CancellationToken cancellationToken = default)
    {
        var statuses = new[]
        {
            CompanyVerificationStatus.UnderReview,
            CompanyVerificationStatus.ChangesRequired
        };

        var companies = await _context.Companies
            .AsNoTracking()
            .Where(c => statuses.Contains(c.VerificationStatus))
            .Select(c => new PendingCompanyDto(
                c.Id,
                c.LegalName,
                c.TradeName,
                c.IndustrySector,
                c.Governorate,
                c.City,
                c.VerificationStatus.ToString(),
                c.VerificationDocuments.Count,
                c.CreatedAtUtc))
            .OrderBy(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return companies;
    }

    public async Task<CompanyVerificationDetailDto> GetCompanyVerificationAsync(
        Guid companyId,
        CancellationToken cancellationToken = default)
    {
        var company = await _context.Companies
            .AsNoTracking()
            .Include(c => c.VerificationDocuments)
            .Include(c => c.VerificationDecisions)
                .ThenInclude(d => d.ReviewedByUser)
            .FirstOrDefaultAsync(c => c.Id == companyId, cancellationToken)
            ?? throw new NotFoundException($"Company {companyId} not found.");

        var docs = company.VerificationDocuments
            .Select(d => new VerificationDocumentDto(
                d.Id,
                d.DocumentType.ToString(),
                d.FileName,
                d.FileSizeBytes,
                d.ContentType,
                d.Status.ToString(),
                d.RejectionReason,
                d.UploadedAtUtc))
            .ToList();

        var decisions = company.VerificationDecisions
            .OrderBy(d => d.DecidedAtUtc)
            .Select(d => new VerificationDecisionDto(
                d.Id,
                d.Decision.ToString(),
                d.Reason,
                d.ReviewedByUser.Email,
                d.DecidedAtUtc))
            .ToList();

        return new CompanyVerificationDetailDto(
            company.Id,
            company.LegalName,
            company.TradeName,
            company.VerificationStatus.ToString(),
            company.RejectionReason,
            docs,
            decisions);
    }

    // -------------------------------------------------------------------------
    // Decisions
    // -------------------------------------------------------------------------

    public async Task ApproveCompanyAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var adminId = RequireAdminId();
        var company = await GetCompanyWithDocumentsAsync(companyId, cancellationToken);

        if (company.VerificationStatus != CompanyVerificationStatus.UnderReview)
            throw new ConflictException(
                $"Company must be in UnderReview status to approve. Current: {company.VerificationStatus}.");

        // Require both mandatory documents
        var hasCommercialRegister = company.VerificationDocuments
            .Any(d => d.DocumentType == VerificationDocumentType.CommercialRegister);
        var hasTaxCard = company.VerificationDocuments
            .Any(d => d.DocumentType == VerificationDocumentType.TaxCard);

        if (!hasCommercialRegister || !hasTaxCard)
            throw new ConflictException("Cannot approve: CommercialRegister and TaxCard documents are required.");

        var now = _dateTimeProvider.UtcNow;
        company.VerificationStatus = CompanyVerificationStatus.Approved;
        company.VerifiedAtUtc = now;
        company.VerifiedByUserId = adminId;
        company.RejectionReason = null;

        foreach (var doc in company.VerificationDocuments)
            doc.Status = VerificationDocumentStatus.Approved;

        AppendDecision(company, adminId, CompanyVerificationStatus.Approved, reason: null, now);

        await _context.SaveChangesAsync(cancellationToken);

        // Notify company members
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            company.Id,
            null,
            NotificationType.CompanyVerificationApproved,
            "Company Verification Approved",
            $"Your company '{company.LegalName}' has been verified and approved on DealZone.",
            "Company",
            company.Id,
            $"verification_approved_{company.Id}_{now.Ticks}",
            cancellationToken);

        // Notify company owner
        await NotifyOwnerAsync(company, "Approved", reason: null, cancellationToken);

        _logger.LogInformation("Admin {AdminId} approved company {CompanyId}.", adminId, companyId);
    }

    public async Task RejectCompanyAsync(
        Guid companyId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var adminId = RequireAdminId();
        var company = await GetCompanyWithDocumentsAsync(companyId, cancellationToken);

        if (company.VerificationStatus != CompanyVerificationStatus.UnderReview)
            throw new ConflictException(
                $"Company must be in UnderReview status to reject. Current: {company.VerificationStatus}.");

        var now = _dateTimeProvider.UtcNow;
        company.VerificationStatus = CompanyVerificationStatus.Rejected;
        company.RejectionReason = reason;
        company.VerifiedByUserId = adminId;

        foreach (var doc in company.VerificationDocuments)
            doc.Status = VerificationDocumentStatus.Rejected;

        AppendDecision(company, adminId, CompanyVerificationStatus.Rejected, reason, now);

        await _context.SaveChangesAsync(cancellationToken);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            company.Id,
            null,
            NotificationType.CompanyVerificationRejected,
            "Company Verification Rejected",
            $"Your company '{company.LegalName}' verification was rejected. Reason: {reason}",
            "Company",
            company.Id,
            $"verification_rejected_{company.Id}_{now.Ticks}",
            cancellationToken);

        await NotifyOwnerAsync(company, "Rejected", reason, cancellationToken);

        _logger.LogInformation("Admin {AdminId} rejected company {CompanyId}.", adminId, companyId);
    }

    public async Task RequestChangesAsync(
        Guid companyId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var adminId = RequireAdminId();
        var company = await GetCompanyWithDocumentsAsync(companyId, cancellationToken);

        if (company.VerificationStatus != CompanyVerificationStatus.UnderReview)
            throw new ConflictException(
                $"Company must be in UnderReview status. Current: {company.VerificationStatus}.");

        var now = _dateTimeProvider.UtcNow;
        company.VerificationStatus = CompanyVerificationStatus.ChangesRequired;
        company.RejectionReason = reason;

        AppendDecision(company, adminId, CompanyVerificationStatus.ChangesRequired, reason, now);

        await _context.SaveChangesAsync(cancellationToken);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            company.Id,
            null,
            NotificationType.CompanyVerificationChangesRequested,
            "Company Verification Changes Requested",
            $"Changes are required for your company '{company.LegalName}' verification. Reason: {reason}",
            "Company",
            company.Id,
            $"verification_changes_{company.Id}_{now.Ticks}",
            cancellationToken);

        await NotifyOwnerAsync(company, "ChangesRequired", reason, cancellationToken);

        _logger.LogInformation(
            "Admin {AdminId} requested changes for company {CompanyId}.", adminId, companyId);
    }

    // -------------------------------------------------------------------------
    // Document streaming
    // -------------------------------------------------------------------------

    public async Task<(Stream stream, string contentType, string fileName)> GetDocumentStreamAsync(
        Guid companyId,
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var doc = await _context.VerificationDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == documentId && d.CompanyId == companyId, cancellationToken)
            ?? throw new NotFoundException($"Document {documentId} not found for company {companyId}.");

        var stream = await _fileStorage.RetrieveAsync(doc.StorageKey, cancellationToken);

        return (stream, doc.ContentType, doc.FileName);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Guid RequireAdminId() =>
        _currentUser.Id ?? throw new UnauthorizedAccessException("Admin user not authenticated.");

    private async Task<Company> GetCompanyWithDocumentsAsync(Guid companyId, CancellationToken ct) =>
        await _context.Companies
            .Include(c => c.VerificationDocuments)
            .Include(c => c.PrimaryContactUser)
            .FirstOrDefaultAsync(c => c.Id == companyId, ct)
        ?? throw new NotFoundException($"Company {companyId} not found.");

    private void AppendDecision(
        Company company,
        Guid adminId,
        CompanyVerificationStatus decision,
        string? reason,
        DateTimeOffset now)
    {
        var record = new VerificationDecision
        {
            CompanyId = company.Id,
            ReviewedByUserId = adminId,
            Decision = decision,
            Reason = reason,
            DecidedAtUtc = now
        };
        _context.VerificationDecisions.Add(record);
    }

    private async Task NotifyOwnerAsync(
        Company company,
        string decision,
        string? reason,
        CancellationToken ct)
    {
        try
        {
            await _emailService.SendVerificationDecisionAsync(
                company.PrimaryContactUser.Email,
                company.LegalName,
                decision,
                reason,
                ct);
        }
        catch (Exception ex)
        {
            // Email delivery failure must not roll back the decision
            _logger.LogWarning(ex,
                "Failed to send verification decision email to {Email}", company.PrimaryContactUser.Email);
        }
    }
}

