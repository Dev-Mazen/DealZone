using DealZone.Domain.Common;
using DealZone.Domain.Companies;

namespace DealZone.Domain.Catalog;

/// <summary>
/// Represents an eligible industrial raw-material product offered by a verified supplier
/// on the DealZone Marketplace with support for fixed price direct purchase and price negotiation.
/// </summary>
public class CatalogProduct : AuditableEntity, IConcurrencyToken
{
    public Guid? MaterialId { get; set; }
    public Material? Material { get; set; }

    public Guid CategoryId { get; set; }
    public MaterialCategory Category { get; set; } = null!;

    public Guid SupplierCompanyId { get; set; }
    public Company SupplierCompany { get; set; } = null!;

    public string Sku { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }
    public string? Specifications { get; set; }

    /// <summary>Pricing mode: Fixed (Buy Now + Offer) or Negotiable (Offer only).</summary>
    public ProductPricingMode PricingMode { get; set; } = ProductPricingMode.Fixed;

    /// <summary>Unit price in EGP for direct marketplace purchase or reference.</summary>
    public decimal UnitPrice { get; set; }
    public string Currency { get; set; } = "EGP";
    public string Unit { get; set; } = "ton";

    /// <summary>Current available inventory / capacity.</summary>
    public decimal AvailableQuantity { get; set; }

    /// <summary>Minimum Order Quantity.</summary>
    public decimal MinimumOrderQuantity { get; set; } = 1;

    /// <summary>Estimated delivery lead time in days.</summary>
    public int DeliveryLeadTimeDays { get; set; } = 7;

    public string? ImageUrlsJson { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsArchived { get; set; } = false;

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];
}
