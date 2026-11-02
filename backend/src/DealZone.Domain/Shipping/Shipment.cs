using DealZone.Domain.Common;
using DealZone.Domain.Deals;

namespace DealZone.Domain.Shipping;

public class Shipment : AuditableEntity, IConcurrencyToken
{
    public string ShipmentNumber { get; set; } = string.Empty;

    public Guid DealId { get; set; }
    public Deal Deal { get; set; } = null!;

    public ShippingArrangement Arrangement { get; set; } = ShippingArrangement.SupplierArranged;

    public Guid? ShippingProviderId { get; set; }
    public ShippingProvider? ShippingProvider { get; set; }

    public string? TrackingNumber { get; set; }
    public string? CarrierName { get; set; }
    public string PickupAddress { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;

    public ShipmentStatus Status { get; set; } = ShipmentStatus.Pending;

    public DateTimeOffset? PickupDateUtc { get; set; }
    public DateTimeOffset? EstimatedDeliveryDateUtc { get; set; }
    public DateTimeOffset? ActualDeliveryDateUtc { get; set; }
    public string? Notes { get; set; }

    // Serialized JSON tracking event log
    public string TrackingEventsJson { get; set; } = "[]";

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];
}
