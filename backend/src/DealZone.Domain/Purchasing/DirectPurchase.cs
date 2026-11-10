using DealZone.Domain.Catalog;
using DealZone.Domain.Common;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Identity;

namespace DealZone.Domain.Purchasing;

/// <summary>
/// Direct purchase order placed by an eligible buyer for a catalog product.
/// Atomically creates a commercial Deal in AwaitingConfirmation to integrate with
/// DealZone's mutual confirmation, shipment tracking, and review workflows.
/// </summary>
public class DirectPurchase : AuditableEntity, IConcurrencyToken
{
    public string PurchaseNumber { get; set; } = string.Empty;

    public Guid BuyerCompanyId { get; set; }
    public Company BuyerCompany { get; set; } = null!;

    public Guid BuyerUserId { get; set; }
    public User BuyerUser { get; set; } = null!;

    public Guid SupplierCompanyId { get; set; }
    public Company SupplierCompany { get; set; } = null!;

    public Guid CatalogProductId { get; set; }
    public CatalogProduct CatalogProduct { get; set; } = null!;

    public decimal Quantity { get; set; }

    /// <summary>Frozen unit price at the exact moment of purchase.</summary>
    public decimal UnitPrice { get; set; }

    /// <summary>Server-calculated total (Quantity * UnitPrice).</summary>
    public decimal TotalPrice { get; set; }

    public string Currency { get; set; } = "EGP";

    public int DeliveryLeadTimeDays { get; set; }
    public DateTimeOffset? EstimatedDeliveryDateUtc { get; set; }

    public string? DeliveryAddress { get; set; }
    public string? Notes { get; set; }

    /// <summary>
    /// Frozen snapshot of product, material, specifications, and trading unit.
    /// Ensures subsequent edits to the catalog product do not mutate historical purchase records.
    /// </summary>
    public string ProductSnapshotJson { get; set; } = string.Empty;

    public DirectPurchaseStatus Status { get; set; } = DirectPurchaseStatus.Submitted;

    // Associated Deal (Deal owns foreign key DirectPurchaseId)
    public Deal? Deal { get; set; }

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];
}
