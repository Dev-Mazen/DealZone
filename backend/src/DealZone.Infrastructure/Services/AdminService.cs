using System.Text;
using DealZone.Domain.Rfqs;
using DealZone.Domain.Offers;
using DealZone.Domain.Deals;
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
            .OrderBy(c => c.CreatedAtUtc)
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

        if (company.VerificationStatus == CompanyVerificationStatus.Approved)
            throw new ConflictException("Company is already verified and approved.");

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

        if (company.VerificationStatus == CompanyVerificationStatus.Rejected)
            throw new ConflictException("Company is already rejected.");

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

        if (company.VerificationStatus == CompanyVerificationStatus.Approved)
            throw new ConflictException("Company is already approved. Cannot request changes.");

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

    // -------------------------------------------------------------------------
    // Analytics & Reports
    // -------------------------------------------------------------------------

    public async Task<AdminAnalyticsResponse> GetAnalyticsAsync(
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        CancellationToken cancellationToken = default)
    {
        // 1. Companies stats
        var companiesQuery = _context.Companies.AsNoTracking();
        if (fromDate.HasValue) companiesQuery = companiesQuery.Where(c => c.CreatedAtUtc >= fromDate.Value);
        if (toDate.HasValue) companiesQuery = companiesQuery.Where(c => c.CreatedAtUtc <= toDate.Value);

        var totalCompanies = await companiesQuery.CountAsync(cancellationToken);
        var verifiedCompanies = await companiesQuery.CountAsync(c => c.VerificationStatus == CompanyVerificationStatus.Approved, cancellationToken);
        var pendingCompanies = await companiesQuery.CountAsync(c => c.VerificationStatus == CompanyVerificationStatus.Pending, cancellationToken);
        var changesRequiredCompanies = await companiesQuery.CountAsync(c => c.VerificationStatus == CompanyVerificationStatus.ChangesRequired, cancellationToken);
        var rejectedCompanies = await companiesQuery.CountAsync(c => c.VerificationStatus == CompanyVerificationStatus.Rejected, cancellationToken);

        // Buyer vs Supplier companies
        var buyerCompaniesCount = await _context.Rfqs.AsNoTracking()
            .Select(r => r.BuyerCompanyId)
            .Distinct()
            .CountAsync(cancellationToken);

        var supplierCompaniesCount = await _context.Offers.AsNoTracking()
            .Select(o => o.SupplierCompanyId)
            .Distinct()
            .CountAsync(cancellationToken);

        // 2. RFQ stats
        var rfqsQuery = _context.Rfqs.AsNoTracking().Where(r => !r.IsDeleted);
        if (fromDate.HasValue) rfqsQuery = rfqsQuery.Where(r => r.CreatedAtUtc >= fromDate.Value);
        if (toDate.HasValue) rfqsQuery = rfqsQuery.Where(r => r.CreatedAtUtc <= toDate.Value);

        var totalRfqs = await rfqsQuery.CountAsync(cancellationToken);
        var openRfqs = await rfqsQuery.CountAsync(r => r.Status == RfqStatus.Published, cancellationToken);
        var closedRfqs = await rfqsQuery.CountAsync(r => r.Status == RfqStatus.Closed, cancellationToken);
        var draftRfqs = await rfqsQuery.CountAsync(r => r.Status == RfqStatus.Draft, cancellationToken);

        // 3. Offers stats
        var offersQuery = _context.Offers.AsNoTracking();
        if (fromDate.HasValue) offersQuery = offersQuery.Where(o => o.SubmittedAtUtc >= fromDate.Value);
        if (toDate.HasValue) offersQuery = offersQuery.Where(o => o.SubmittedAtUtc <= toDate.Value);

        var totalOffers = await offersQuery.CountAsync(cancellationToken);
        var submittedOffers = await offersQuery.CountAsync(o => o.Status == OfferStatus.Submitted || o.Status == OfferStatus.UnderReview, cancellationToken);
        var acceptedOffers = await _context.Offers.AsNoTracking().CountAsync(o => o.Status == OfferStatus.Accepted, cancellationToken);
        var rejectedOffers = await _context.Offers.AsNoTracking().CountAsync(o => o.Status == OfferStatus.Rejected, cancellationToken);

        // 4. Deals stats
        var dealsQuery = _context.Deals.AsNoTracking();
        if (fromDate.HasValue) dealsQuery = dealsQuery.Where(d => d.CreatedAtUtc >= fromDate.Value);
        if (toDate.HasValue) dealsQuery = dealsQuery.Where(d => d.CreatedAtUtc <= toDate.Value);

        var totalDeals = await dealsQuery.CountAsync(cancellationToken);
        var awaitingDeals = await dealsQuery.CountAsync(d => d.Status == DealStatus.AwaitingConfirmation, cancellationToken);
        var confirmedDeals = await dealsQuery.CountAsync(d => d.Status == DealStatus.Confirmed, cancellationToken);
        var inProgressDeals = await dealsQuery.CountAsync(d => d.Status == DealStatus.InProgress, cancellationToken);
        var completedDeals = await dealsQuery.CountAsync(d => d.Status == DealStatus.Completed, cancellationToken);
        var cancelledDeals = await dealsQuery.CountAsync(d => d.Status == DealStatus.Cancelled, cancellationToken);
        var disputedDeals = await dealsQuery.CountAsync(d => d.Status == DealStatus.Disputed, cancellationToken);

        var totalVolume = await dealsQuery
            .Where(d => d.Status == DealStatus.Confirmed || d.Status == DealStatus.InProgress || d.Status == DealStatus.Completed)
            .SumAsync(d => (decimal?)d.AgreedPrice, cancellationToken) ?? 0m;

        // 5. Disputes stats
        var disputesQuery = _context.DealDisputes.AsNoTracking();
        var totalDisputes = await disputesQuery.CountAsync(cancellationToken);
        var openDisputes = await disputesQuery.CountAsync(d => d.Status == DisputeStatus.Open || d.Status == DisputeStatus.UnderReview, cancellationToken);
        var resolvedDisputes = await disputesQuery.CountAsync(d => d.Status == DisputeStatus.Resolved, cancellationToken);

        var kpis = new PlatformOverviewKpiDto(
            totalCompanies,
            verifiedCompanies,
            pendingCompanies,
            changesRequiredCompanies,
            rejectedCompanies,
            buyerCompaniesCount,
            supplierCompaniesCount,
            totalRfqs,
            openRfqs,
            closedRfqs,
            draftRfqs,
            totalOffers,
            submittedOffers,
            acceptedOffers,
            rejectedOffers,
            totalDeals,
            awaitingDeals,
            confirmedDeals,
            inProgressDeals,
            completedDeals,
            cancelledDeals,
            disputedDeals,
            totalVolume,
            totalDisputes,
            openDisputes,
            resolvedDisputes);

        // 6. Sector distribution
        var sectorGroups = await _context.Companies.AsNoTracking()
            .GroupBy(c => c.IndustrySector)
            .Select(g => new { Sector = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var rfqSectorGroups = await _context.Rfqs.AsNoTracking()
            .Where(r => !r.IsDeleted && r.BuyerCompany != null)
            .GroupBy(r => r.BuyerCompany!.IndustrySector)
            .Select(g => new { Sector = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var allSectors = sectorGroups.Select(s => s.Sector)
            .Union(rfqSectorGroups.Select(r => r.Sector))
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct()
            .ToList();

        var sectors = allSectors.Select(s => new SectorDistributionDto(
            s,
            sectorGroups.FirstOrDefault(x => x.Sector == s)?.Count ?? 0,
            rfqSectorGroups.FirstOrDefault(x => x.Sector == s)?.Count ?? 0
        )).ToList();

        // 7. Recent activity (last 6 months)
        var activity = new List<ActivityTimelineDto>();
        var now = DateTimeOffset.UtcNow;
        for (int i = 5; i >= 0; i--)
        {
            var start = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero).AddMonths(-i);
            var end = start.AddMonths(1);
            var label = start.ToString("MMM yyyy");

            var cCount = await _context.Companies.AsNoTracking()
                .CountAsync(c => c.CreatedAtUtc >= start && c.CreatedAtUtc < end, cancellationToken);
            var rCount = await _context.Rfqs.AsNoTracking()
                .CountAsync(r => !r.IsDeleted && r.CreatedAtUtc >= start && r.CreatedAtUtc < end, cancellationToken);
            var dCount = await _context.Deals.AsNoTracking()
                .CountAsync(d => d.CreatedAtUtc >= start && d.CreatedAtUtc < end, cancellationToken);
            var vol = await _context.Deals.AsNoTracking()
                .Where(d => d.CreatedAtUtc >= start && d.CreatedAtUtc < end)
                .SumAsync(d => (decimal?)d.AgreedPrice, cancellationToken) ?? 0m;

            activity.Add(new ActivityTimelineDto(label, cCount, rCount, dCount, vol));
        }

        return new AdminAnalyticsResponse(kpis, sectors, activity, DateTimeOffset.UtcNow);
    }

        public async Task<byte[]> ExportCompaniesCsvAsync(CancellationToken cancellationToken = default)
    {
        var companies = await _context.Companies
            .AsNoTracking()
            .Include(c => c.ContactDetails)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.Append('\uFEFF');
        sb.AppendLine("ID,LegalName,TradeName,IndustrySector,City,Governorate,TaxId,CommercialReg,Status,CanTrade,CreatedAt");

        foreach (var c in companies)
        {
            sb.Append('"').Append(c.Id).Append('"').Append(',')
              .Append('"').Append(EscapeCsv(c.LegalName)).Append('"').Append(',')
              .Append('"').Append(EscapeCsv(c.TradeName)).Append('"').Append(',')
              .Append('"').Append(EscapeCsv(c.IndustrySector)).Append('"').Append(',')
              .Append('"').Append(EscapeCsv(c.City)).Append('"').Append(',')
              .Append('"').Append(EscapeCsv(c.Governorate)).Append('"').Append(',')
              .Append('"').Append(EscapeCsv(c.ContactDetails?.TaxIdNumber ?? "")).Append('"').Append(',')
              .Append('"').Append(EscapeCsv(c.ContactDetails?.CommercialRegistrationNumber ?? "")).Append('"').Append(',')
              .Append('"').Append(c.VerificationStatus).Append('"').Append(',')
              .Append('"').Append(c.CanPerformCommercialActivities).Append('"').Append(',')
              .Append('"').Append(c.CreatedAtUtc.ToString("yyyy-MM-dd HH:mm")).Append('"').AppendLine();
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportDealsCsvAsync(CancellationToken cancellationToken = default)
    {
        var deals = await _context.Deals
            .AsNoTracking()
            .Include(d => d.BuyerCompany)
            .Include(d => d.SupplierCompany)
            .OrderByDescending(d => d.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.Append('\uFEFF');
        sb.AppendLine("DealNumber,Buyer,Supplier,AgreedPrice,Currency,Status,CreatedAt,ConfirmedAt,CompletedAt");

        foreach (var d in deals)
        {
            var buyerName = d.BuyerCompany?.TradeName ?? d.BuyerCompany?.LegalName ?? string.Empty;
            var supplierName = d.SupplierCompany?.TradeName ?? d.SupplierCompany?.LegalName ?? string.Empty;

            sb.Append('"').Append(d.DealNumber).Append('"').Append(',')
              .Append('"').Append(EscapeCsv(buyerName)).Append('"').Append(',')
              .Append('"').Append(EscapeCsv(supplierName)).Append('"').Append(',')
              .Append('"').Append(d.AgreedPrice).Append('"').Append(',')
              .Append('"').Append(d.Currency).Append('"').Append(',')
              .Append('"').Append(d.Status).Append('"').Append(',')
              .Append('"').Append(d.CreatedAtUtc.ToString("yyyy-MM-dd HH:mm")).Append('"').Append(',')
              .Append('"').Append(d.ConfirmedAtUtc?.ToString("yyyy-MM-dd HH:mm") ?? string.Empty).Append('"').Append(',')
              .Append('"').Append(d.CompletedAtUtc?.ToString("yyyy-MM-dd HH:mm") ?? string.Empty).Append('"').AppendLine();
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        return value.Replace(new string('"', 1), new string('"', 2));
    }
}
