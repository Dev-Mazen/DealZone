using DealZone.Domain.Common;
using DealZone.Domain.Identity;

namespace DealZone.Domain.Companies;

public class VerificationDocument : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public VerificationDocumentType DocumentType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTimeOffset UploadedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public Guid? UploadedByUserId { get; set; }
    public User? UploadedByUser { get; set; }

    public VerificationDocumentStatus Status { get; set; } = VerificationDocumentStatus.Pending;
    public string? RejectionReason { get; set; }

    public DateTimeOffset? ReviewedAtUtc { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }
}

