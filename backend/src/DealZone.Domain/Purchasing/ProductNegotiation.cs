using DealZone.Domain.Catalog;
using DealZone.Domain.Common;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Identity;

namespace DealZone.Domain.Purchasing;

/// <summary>
/// Represents a structured price negotiation between a buyer and a supplier
/// for a specific marketplace catalog product.
/// </summary>
public class ProductNegotiation : AuditableEntity, IConcurrencyToken
{
    public string NegotiationNumber { get; set; } = string.Empty;

    public Guid CatalogProductId { get; set; }
    public CatalogProduct CatalogProduct { get; set; } = null!;

    public Guid BuyerCompanyId { get; set; }
    public Company BuyerCompany { get; set; } = null!;

    public Guid BuyerUserId { get; set; }
    public User BuyerUser { get; set; } = null!;

    public Guid SupplierCompanyId { get; set; }
    public Company SupplierCompany { get; set; } = null!;

    public decimal CurrentUnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal CurrentTotalPrice { get; set; }
    public string Currency { get; set; } = "EGP";

    public int DeliveryLeadTimeDays { get; set; } = 7;
    public string? DeliveryAddress { get; set; }
    public string? Notes { get; set; }

    public ProductNegotiationStatus Status { get; set; } = ProductNegotiationStatus.PendingSupplierResponse;
    public Guid LastActionByCompanyId { get; set; }
    public Guid LastActionByUserId { get; set; }

    public DateTimeOffset? RespondedAtUtc { get; set; }
    public string? RejectionReason { get; set; }

    // Downstream Deal once accepted
    public Guid? DealId { get; set; }
    public Deal? Deal { get; set; }

    // Revision history
    public ICollection<ProductNegotiationRevision> Revisions { get; set; } = [];

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];
}

public class ProductNegotiationRevision : BaseEntity
{
    public Guid NegotiationId { get; set; }
    public ProductNegotiation Negotiation { get; set; } = null!;

    public int RevisionNumber { get; set; }
    public Guid ProposedByCompanyId { get; set; }
    public Guid ProposedByUserId { get; set; }

    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public int DeliveryLeadTimeDays { get; set; }
    public string? Notes { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}

