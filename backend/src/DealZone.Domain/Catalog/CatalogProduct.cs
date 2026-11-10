using DealZone.Domain.Common;
using DealZone.Domain.Companies;

namespace DealZone.Domain.Catalog;

/// <summary>
/// Represents an eligible industrial raw-material product offered by a verified supplier
/// for direct catalog purchasing with guaranteed pricing, available quantity, and MOQ.
/// </summary>
public class CatalogProduct : AuditableEntity, IConcurrencyToken
{
    public Guid MaterialId { get; set; }
    public Material Material { get; set; } = null!;

    public Guid SupplierCompanyId { get; set; }
    public Company SupplierCompany { get; set; } = null!;

    public string Sku { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }

    /// <summary>Fixed unit price snapshot in EGP for direct catalog purchase.</summary>
    public decimal UnitPrice { get; set; }
    public string Currency { get; set; } = "EGP";

    /// <summary>Current available inventory / capacity for immediate procurement.</summary>
    public decimal AvailableQuantity { get; set; }

    /// <summary>Minimum Order Quantity required for direct purchasing.</summary>
    public decimal MinimumOrderQuantity { get; set; } = 1;

    /// <summary>Estimated delivery lead time in days.</summary>
    public int DeliveryLeadTimeDays { get; set; } = 7;

    public bool IsActive { get; set; } = true;
    public bool IsArchived { get; set; } = false;

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];
}

