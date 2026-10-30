using DealZone.Domain.Catalog;
using DealZone.Domain.Common;

namespace DealZone.Domain.Rfqs;

public class RfqItem : BaseEntity
{
    public Guid RfqId { get; set; }
    public Rfq Rfq { get; set; } = null!;

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

