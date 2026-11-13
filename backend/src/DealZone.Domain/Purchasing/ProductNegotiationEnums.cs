namespace DealZone.Domain.Purchasing;

public enum ProductNegotiationStatus
{
    PendingSupplierResponse = 0,
    CounterofferPendingBuyerResponse = 1,
    Accepted = 2,
    Rejected = 3,
    Expired = 4,
    Cancelled = 5
}

