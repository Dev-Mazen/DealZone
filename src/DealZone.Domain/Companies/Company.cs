using DealZone.Domain.Common;
using DealZone.Domain.Identity;

namespace DealZone.Domain.Companies;

public class Company : AuditableEntity, ISoftDelete, IConcurrencyToken
{
    public string LegalName { get; set; } = string.Empty;
    public string TradeName { get; set; } = string.Empty;
    public string IndustrySector { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Governorate { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Website { get; set; }

    public CompanyVerificationStatus VerificationStatus { get; set; } = CompanyVerificationStatus.Pending;
    public DateTimeOffset? VerifiedAtUtc { get; set; }
    public Guid? VerifiedByUserId { get; set; }
    public User? VerifiedByUser { get; set; }
    public string? RejectionReason { get; set; }

    public Guid PrimaryContactUserId { get; set; }
    public User PrimaryContactUser { get; set; } = null!;

    public bool IsActive { get; set; } = true;

    // ISoftDelete
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];

    // Navigations
    public CompanyContactDetails? ContactDetails { get; set; }
    public ICollection<CompanyMember> Members { get; set; } = [];
    public ICollection<VerificationDocument> VerificationDocuments { get; set; } = [];
    public ICollection<VerificationDecision> VerificationDecisions { get; set; } = [];

    public bool CanPerformCommercialActivities => IsActive && !IsDeleted && VerificationStatus == CompanyVerificationStatus.Approved;
}

