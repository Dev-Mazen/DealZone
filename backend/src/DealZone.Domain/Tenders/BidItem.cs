using DealZone.Domain.Common;

namespace DealZone.Domain.Tenders;

public class BidItem : BaseEntity
{
    public Guid BidId { get; set; }
    public Bid Bid { get; set; } = null!;

    public Guid TenderItemId { get; set; }
    public TenderItem TenderItem { get; set; } = null!;

    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }
}
