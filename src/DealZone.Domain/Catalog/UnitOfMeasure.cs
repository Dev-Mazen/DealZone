using DealZone.Domain.Common;

namespace DealZone.Domain.Catalog;

public class UnitOfMeasure : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string SymbolAr { get; set; } = string.Empty;
    public string SymbolEn { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}

