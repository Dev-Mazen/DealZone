using DealZone.Domain.Common;
using DealZone.Domain.Companies;

namespace DealZone.Domain.Tenders;

public class Bid : AuditableEntity, IConcurrencyToken
{
    public string BidNumber { get; set; } = string.Empty;

    public Guid TenderId { get; set; }
    public Tender? Tender { get; set; }

    public Guid SupplierCompanyId { get; set; }
    public Company? SupplierCompany { get; set; }

    // Revision lineage
    public Guid? OriginalBidId { get; set; }
    public Bid? OriginalBid { get; set; }
    public ICollection<Bid> Revisions { get; set; } = [];
    public int RevisionNumber { get; set; } = 1;

    public BidStatus Status { get; set; } = BidStatus.Submitted;

    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "EGP";

    public DateTimeOffset ValidityDateUtc { get; set; }
    public int DeliveryLeadTimeDays { get; set; }
    public bool ShippingIncluded { get; set; }
    public string PaymentTerms { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? ChangeSummary { get; set; }
    public DateTimeOffset SubmittedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    // Decision metadata
    public DateTimeOffset? AcceptedAtUtc { get; set; }
    public Guid? AcceptedByUserId { get; set; }
    public DateTimeOffset? RejectedAtUtc { get; set; }
    public Guid? RejectedByUserId { get; set; }
    public string? RejectionReason { get; set; }

    // Withdrawal metadata
    public DateTimeOffset? WithdrawnAtUtc { get; set; }
    public Guid? WithdrawnByUserId { get; set; }
    public string? WithdrawalReason { get; set; }

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];

    // Line items
    public ICollection<BidItem> Items { get; set; } = [];
}
