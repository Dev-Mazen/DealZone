using DealZone.Domain.Common;
using DealZone.Domain.Companies;

namespace DealZone.Domain.Catalog;

/// <summary>
/// Represents an eligible industrial raw-material product offered by a verified supplier
/// on DealZone with support for fixed price direct purchase and price negotiation.
/// </summary>
public class CatalogProduct : AuditableEntity, IConcurrencyToken
{
    public Guid? MaterialId { get; set; }
    public Material? Material { get; set; }

    public Guid CategoryId { get; set; }
    public MaterialCategory Category { get; set; } = null!;

    public Guid SupplierCompanyId { get; set; }
    public Company SupplierCompany { get; set; } = null!;

    public Guid UnitId { get; set; }
    public UnitOfMeasure Unit { get; set; } = null!;

    public string? Sku { get; set; }
    public string NameAr { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }
    public string? Specifications { get; set; }

    /// <summary>Pricing mode: Fixed (Buy Now + Offer) or Negotiable (Offer only).</summary>
    public ProductPricingMode PricingMode { get; set; } = ProductPricingMode.Fixed;

    /// <summary>Unit price in EGP for direct marketplace purchase or reference (null for Negotiable products).</summary>
    public decimal? UnitPrice { get; set; }
    public string Currency { get; set; } = "EGP";

    /// <summary>Current available inventory / capacity (optional).</summary>
    public decimal? AvailableQuantity { get; set; }

    /// <summary>Minimum Order Quantity (required, > 0).</summary>
    public decimal MinimumOrderQuantity { get; set; } = 1;

    /// <summary>Estimated delivery lead time in days (required, 1..365).</summary>
    public int DeliveryLeadTimeDays { get; set; } = 7;

    public string? ImageUrlsJson { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsArchived { get; set; } = false;

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];
}
