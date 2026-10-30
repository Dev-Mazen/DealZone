using DealZone.Domain.Common;

namespace DealZone.Domain.Catalog;

public class Material : AuditableEntity
{
    public Guid CategoryId { get; set; }
    public MaterialCategory Category { get; set; } = null!;

    public Guid DefaultUnitId { get; set; }
    public UnitOfMeasure DefaultUnit { get; set; } = null!;

    public string Code { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }

    /// <summary>
    /// Flexible JSON string representing material attributes/specifications
    /// (e.g. grade, standard, dimensions, form, chemical purity).
    /// Allows different industrial raw-material categories to define domain-specific attributes.
    /// </summary>
    public string? AttributesJson { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsArchived { get; set; } = false;
}

