using DealZone.Domain.Catalog;
using DealZone.Domain.Common;
using DealZone.Domain.Companies;

namespace DealZone.Domain.Tenders;

public class Tender : AuditableEntity, ISoftDelete, IConcurrencyToken
{
    public string TenderNumber { get; set; } = string.Empty;

    public Guid BuyerCompanyId { get; set; }
    public Company? BuyerCompany { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public TenderStatus Status { get; set; } = TenderStatus.Draft;

    public string DeliveryGovernorate { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;

    public Guid? TargetCategoryId { get; set; }
    public MaterialCategory? TargetCategory { get; set; }

    public DateTimeOffset? RequiredDeliveryDateUtc { get; set; }
    public DateTimeOffset ClosingDateUtc { get; set; }
    public DateTimeOffset? PublishedAtUtc { get; set; }

    public decimal? ReferencePrice { get; set; }
    public string Currency { get; set; } = "EGP";
    public string? Notes { get; set; }

    // Award details
    public Guid? AwardedBidId { get; set; }
    public Bid? AwardedBid { get; set; }
    public DateTimeOffset? AwardedAtUtc { get; set; }
    public Guid? AwardedByUserId { get; set; }
    public string? AwardRationale { get; set; }

    // Reopening details
    public DateTimeOffset? ReopenedAtUtc { get; set; }
    public int ReopenedCount { get; set; }

    // Cancellation details
    public DateTimeOffset? CancelledAtUtc { get; set; }
    public Guid? CancelledByUserId { get; set; }
    public string? CancellationReason { get; set; }

    // ISoftDelete
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];

    // Line items
    public ICollection<TenderItem> Items { get; set; } = [];

    // Bids
    public ICollection<Bid> Bids { get; set; } = [];
}
