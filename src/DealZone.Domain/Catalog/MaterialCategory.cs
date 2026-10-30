using DealZone.Domain.Common;

namespace DealZone.Domain.Catalog;

public class MaterialCategory : BaseEntity
{
    public Guid? ParentCategoryId { get; set; }
    public MaterialCategory? ParentCategory { get; set; }

    public string Code { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }

    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsArchived { get; set; } = false;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<MaterialCategory> SubCategories { get; set; } = [];
    public ICollection<Material> Materials { get; set; } = [];
}

