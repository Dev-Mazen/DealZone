using DealZone.Domain.Catalog;
using DealZone.Domain.Common;
using DealZone.Domain.Rfqs;

namespace DealZone.Domain.Tenders;

public class TenderItem : BaseEntity
{
    public Guid TenderId { get; set; }
    public Tender Tender { get; set; } = null!;

    public Guid CategoryId { get; set; }
    public MaterialCategory Category { get; set; } = null!;

    public Guid? MaterialId { get; set; }
    public Material? Material { get; set; }

    public string MaterialName { get; set; } = string.Empty;
    public string Specifications { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public MaterialUnit Unit { get; set; }
    public Guid? UnitOfMeasureId { get; set; }
    public UnitOfMeasure? UnitOfMeasure { get; set; }
    public decimal? TargetPricePerUnit { get; set; }
    public string? Notes { get; set; }
    public int LineNumber { get; set; }
}
