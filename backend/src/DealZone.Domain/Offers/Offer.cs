using DealZone.Domain.Common;
using DealZone.Domain.Companies;
using DealZone.Domain.Rfqs;

namespace DealZone.Domain.Offers;

public class Offer : AuditableEntity, IConcurrencyToken
{
    public string OfferNumber { get; set; } = string.Empty;

    public Guid RfqId { get; set; }
    public Rfq? Rfq { get; set; }

    public Guid SupplierCompanyId { get; set; }
    public Company? SupplierCompany { get; set; }

    // Revision lineage
    public Guid? OriginalOfferId { get; set; }
    public Offer? OriginalOffer { get; set; }
    public ICollection<Offer> Revisions { get; set; } = [];
    public int RevisionNumber { get; set; } = 1;

    public OfferStatus Status { get; set; } = OfferStatus.Submitted;

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

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];

    // Line items
    public ICollection<OfferItem> Items { get; set; } = [];
}
