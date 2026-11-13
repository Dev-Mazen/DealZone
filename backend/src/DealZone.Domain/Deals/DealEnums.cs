namespace DealZone.Domain.Deals;

public enum DealStatus
{
    AwaitingConfirmation = 0,
    PendingConfirmation = 0,
    Confirmed = 1,
    InProgress = 2,
    Disputed = 3,
    Completed = 4,
    Cancelled = 5
}

public enum DisputeStatus
{
    Open = 0,
    UnderReview = 1,
    Resolved = 2,
    Dismissed = 3
}

public enum DisputeCategory
{
    QualityDefect = 1,
    QuantityMismatch = 2,
    LateDelivery = 3,
    DamagedGoods = 4,
    NonDelivery = 5,
    TermsViolation = 6,
    Other = 99
}

public enum DisputeResolutionAction
{
    ResumeDeal = 1,
    CancelDeal = 2
}

public enum DealSource
{
    Rfq = 1,
    Tender = 2,
    DirectPurchase = 3,
    ProductNegotiation = 4
}
