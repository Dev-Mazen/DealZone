using DealZone.Domain.Common;
using DealZone.Domain.Rfqs;

namespace DealZone.Domain.Offers;

public class OfferItem : BaseEntity
{
    public Guid OfferId { get; set; }
    public Offer Offer { get; set; } = null!;

    public Guid RfqItemId { get; set; }
    public RfqItem? RfqItem { get; set; }

    public decimal UnitPrice { get; set; }
    public decimal OfferedQuantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string? MaterialSpecifications { get; set; }
    public string? Notes { get; set; }
}
