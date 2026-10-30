namespace DealZone.Domain.Shipping;

public enum ShippingArrangement
{
    SupplierArranged = 1,
    DealZoneArranged = 2
}

public enum ShipmentStatus
{
    Pending = 0,
    Draft = 0,
    Assigned = 1,
    ReadyForPickup = 1,
    PickedUp = 2,
    InTransit = 3,
    OutForDelivery = 4,
    Delivered = 5,
    Failed = 6,
    DeliveryFailed = 6,
    Cancelled = 7
}
