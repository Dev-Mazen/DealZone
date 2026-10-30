using DealZone.Application.Common.Exceptions;
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
/// Handles company-side verification-document operations:
/// upload, status query, delete, and submission for admin review.
/// </summary>
public class VerificationService : IVerificationService
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".pdf", ".jpg", ".jpeg", ".png" };

    // Magic-byte signatures: (offset, bytes)
    private static readonly (int offset, byte[] signature)[] FileSignatures =
    [
        (0, [0x25, 0x50, 0x44, 0x46]),                         // PDF  %PDF
        (0, [0xFF, 0xD8, 0xFF]),                                 // JPEG
        (0, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) // PNG
    ];

    private static readonly Dictionary<string, string[]> ExtensionToMime = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".pdf",  ["application/pdf"] },
        { ".jpg",  ["image/jpeg"] },
        { ".jpeg", ["image/jpeg"] },
        { ".png",  ["image/png"] }
    };

    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IFileStorageService _fileStorage;
    private readonly INotificationService _notificationService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<VerificationService> _logger;

    public VerificationService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        IFileStorageService fileStorage,
        INotificationService notificationService,
        IDateTimeProvider dateTimeProvider,
        ILogger<VerificationService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _fileStorage = fileStorage;
        _notificationService = notificationService;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // Upload
    // -------------------------------------------------------------------------

    public async Task<UploadDocumentResponse> UploadDocumentAsync(
        int documentType,
        Stream stream,
        string fileName,
        string contentType,
        long length,
        CancellationToken cancellationToken = default)
    {
        var companyId = await RequireCompanyIdAsync(cancellationToken);
        var userId = RequireUserId();

        var company = await GetCompanyAsync(companyId, cancellationToken);

        GuardUploadAllowed(company);

        // Validate document type
        if (!Enum.IsDefined(typeof(VerificationDocumentType), documentType))
            throw new ValidationException(
                "DocumentType", $"Invalid document type: {documentType}.");

        var docType = (VerificationDocumentType)documentType;

        // Validate file
        ValidateFile(stream, fileName, length);

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var resolvedMime = ResolveMime(extension);

        var storageKey = await _fileStorage.StoreAsync(
            companyId, docType.ToString(), extension, stream, cancellationToken);

        // Upsert: one document per type per company (replace if already exists in editable state)
        var existing = await _context.VerificationDocuments
            .FirstOrDefaultAsync(d => d.CompanyId == companyId && d.DocumentType == docType, cancellationToken);

        if (existing is not null)
        {
            // Delete old file from storage (fire-and-forget — do not block on it)
            _ = _fileStorage.DeleteAsync(existing.StorageKey, CancellationToken.None);

            existing.FileName = fileName;
            existing.StorageKey = storageKey;
            existing.ContentType = resolvedMime;
            existing.FileSizeBytes = length;
            existing.UploadedAtUtc = _dateTimeProvider.UtcNow;
            existing.UploadedByUserId = userId;
            existing.Status = VerificationDocumentStatus.Pending;
            existing.RejectionReason = null;
            existing.ReviewedAtUtc = null;
            existing.ReviewedByUserId = null;
        }
        else
        {
            var doc = new VerificationDocument
            {
                CompanyId = companyId,
                DocumentType = docType,
                FileName = fileName,
                StorageKey = storageKey,
                ContentType = resolvedMime,
                FileSizeBytes = length,
                UploadedAtUtc = _dateTimeProvider.UtcNow,
                UploadedByUserId = userId,
                Status = VerificationDocumentStatus.Pending
            };
            _context.VerificationDocuments.Add(doc);
            existing = doc;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Company {CompanyId} uploaded verification document type {DocType}", companyId, docType);

        return new UploadDocumentResponse(
            existing.Id,
            existing.DocumentType.ToString(),
            existing.FileName,
            existing.FileSizeBytes,
            existing.Status.ToString(),
            existing.UploadedAtUtc);
    }

    // -------------------------------------------------------------------------
    // Status
    // -------------------------------------------------------------------------

    public async Task<VerificationStatusResponse> GetVerificationStatusAsync(
        CancellationToken cancellationToken = default)
    {
        var companyId = await RequireCompanyIdAsync(cancellationToken);

        var company = await _context.Companies
            .AsNoTracking()
            .Include(c => c.VerificationDocuments)
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

        return new VerificationStatusResponse(company.VerificationStatus.ToString(), docs);
    }

    // -------------------------------------------------------------------------
    // Delete
    // -------------------------------------------------------------------------

    public async Task DeleteDocumentAsync(Guid documentId, CancellationToken cancellationToken = default)
    {
        var companyId = await RequireCompanyIdAsync(cancellationToken);

        var doc = await _context.VerificationDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId && d.CompanyId == companyId, cancellationToken)
            ?? throw new NotFoundException($"Document {documentId} not found.");

        var company = await GetCompanyAsync(companyId, cancellationToken);

        if (company.VerificationStatus is
            CompanyVerificationStatus.UnderReview or
            CompanyVerificationStatus.Approved or
            CompanyVerificationStatus.Rejected)
        {
            throw new ConflictException(
                $"Documents cannot be deleted while verification status is {company.VerificationStatus}.");
        }

        var storageKey = doc.StorageKey;
        _context.VerificationDocuments.Remove(doc);
        await _context.SaveChangesAsync(cancellationToken);

        await _fileStorage.DeleteAsync(storageKey, cancellationToken);

        _logger.LogInformation(
            "Company {CompanyId} deleted verification document {DocumentId}", companyId, documentId);
    }

    // -------------------------------------------------------------------------
    // Submit for review
    // -------------------------------------------------------------------------

    public async Task SubmitForReviewAsync(CancellationToken cancellationToken = default)
    {
        var companyId = await RequireCompanyIdAsync(cancellationToken);
        var company = await GetCompanyAsync(companyId, cancellationToken);

        if (company.VerificationStatus is not (CompanyVerificationStatus.Pending or CompanyVerificationStatus.ChangesRequired))
        {
            throw new ConflictException(
                $"Cannot submit for review. Current status: {company.VerificationStatus}.");
        }

        // Require CommercialRegister and TaxCard
        var docs = await _context.VerificationDocuments
            .Where(d => d.CompanyId == companyId)
            .ToListAsync(cancellationToken);

        var hasCommercialRegister = docs.Any(d => d.DocumentType == VerificationDocumentType.CommercialRegister);
        var hasTaxCard = docs.Any(d => d.DocumentType == VerificationDocumentType.TaxCard);

        if (!hasCommercialRegister || !hasTaxCard)
        {
            throw new ValidationException(
                "Documents",
                "Both CommercialRegister and TaxCard documents are required before submission.");
        }

        company.VerificationStatus = CompanyVerificationStatus.UnderReview;
        await _context.SaveChangesAsync(cancellationToken);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            companyId,
            [CompanyRole.Owner, CompanyRole.Admin],
            NotificationType.CompanyVerificationSubmitted,
            "Verification Application Submitted",
            $"Verification documents for '{company.LegalName}' were submitted and are now under review.",
            "Company",
            companyId,
            $"verification_submitted_{companyId}_{_dateTimeProvider.UtcNow.Ticks}",
            cancellationToken);

        _logger.LogInformation("Company {CompanyId} submitted verification for review.", companyId);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private async Task<Guid> RequireCompanyIdAsync(CancellationToken cancellationToken)
    {
        if (_currentUser.CompanyId.HasValue)
            return _currentUser.CompanyId.Value;

        var userId = RequireUserId();
        var member = await _context.CompanyMembers
            .FirstOrDefaultAsync(m => m.UserId == userId && m.IsActive, cancellationToken);

        if (member is null)
            throw new UnauthorizedException("No company associated with this user.");

        return member.CompanyId;
    }

    private Guid RequireUserId() =>
        _currentUser.Id ?? throw new UnauthorizedException("User not authenticated.");

    private async Task<Company> GetCompanyAsync(Guid companyId, CancellationToken ct) =>
        await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId, ct)
        ?? throw new NotFoundException($"Company {companyId} not found.");

    private static void GuardUploadAllowed(Company company)
    {
        if (company.VerificationStatus is
            CompanyVerificationStatus.UnderReview or
            CompanyVerificationStatus.Approved or
            CompanyVerificationStatus.Rejected)
        {
            throw new ConflictException(
                $"Document upload is not permitted while verification status is {company.VerificationStatus}.");
        }
    }

    private static void ValidateFile(Stream stream, string fileName, long length)
    {
        if (length == 0)
            throw new ValidationException("File", "Uploaded file is empty.");

        if (length > MaxFileSizeBytes)
            throw new ValidationException("File", $"File size must not exceed {MaxFileSizeBytes / 1024 / 1024} MB.");

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            throw new ValidationException("File", $"File extension '{extension}' is not allowed.");

        if (!stream.CanSeek)
            throw new ValidationException("File", "File stream must be seekable.");

        stream.Position = 0;
        var buffer = new byte[8];
        var read = stream.Read(buffer, 0, buffer.Length);
        stream.Position = 0;

        if (!IsValidSignature(buffer, read))
            throw new ValidationException("File", "File content does not match a recognised document type (PDF, JPEG, or PNG).");
    }

    private static bool IsValidSignature(byte[] buffer, int availableBytes)
    {
        foreach (var (offset, signature) in FileSignatures)
        {
            if (availableBytes < offset + signature.Length) continue;

            var matches = true;
            for (var i = 0; i < signature.Length; i++)
            {
                if (buffer[offset + i] != signature[i]) { matches = false; break; }
            }
            if (matches) return true;
        }
        return false;
    }

    private static string ResolveMime(string extension) =>
        ExtensionToMime.TryGetValue(extension, out var mimes) ? mimes[0] : "application/octet-stream";
}
