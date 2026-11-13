using DealZone.Domain.Catalog;
using DealZone.Domain.Common;
using DealZone.Domain.Companies;
using DealZone.Domain.Offers;

namespace DealZone.Domain.Rfqs;

public class Rfq : AuditableEntity, ISoftDelete, IConcurrencyToken
{
    public string RfqNumber { get; set; } = string.Empty;

    public Guid BuyerCompanyId { get; set; }
    public Company? BuyerCompany { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public RfqStatus Status { get; set; } = RfqStatus.Draft;

    public string DeliveryGovernorate { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;

    public Guid? TargetCategoryId { get; set; }
    public MaterialCategory? TargetCategory { get; set; }

    public DateTimeOffset? RequiredDeliveryDateUtc { get; set; }
    public DateTimeOffset ClosingDateUtc { get; set; }
    public DateTimeOffset? PublishedAtUtc { get; set; }

    public decimal? TargetBudget { get; set; }
    public string Currency { get; set; } = "EGP";
    public string? Notes { get; set; }

    // Awarding / Resolution
    public Guid? AwardedOfferId { get; set; }
    public Offer? AwardedOffer { get; set; }
    public DateTimeOffset? AwardedAtUtc { get; set; }
    public Guid? AwardedByUserId { get; set; }
    public string? AwardRationale { get; set; }

    public DateTimeOffset? ReopenedAtUtc { get; set; }
    public int ReopenedCount { get; set; }
    public string? CancellationReason { get; set; }

    // ISoftDelete
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];

    // Line items
    public ICollection<RfqItem> Items { get; set; } = [];

    // Offers
    public ICollection<Offer> Offers { get; set; } = [];
}
