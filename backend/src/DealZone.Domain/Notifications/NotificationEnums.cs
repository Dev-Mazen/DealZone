namespace DealZone.Domain.Notifications;

public enum NotificationType
{
    System = 0,
    CompanyVerificationSubmitted = 1,
    CompanyVerificationApproved = 2,
    CompanyVerificationRejected = 3,
    CompanyVerificationChangesRequested = 4,

    RfqPublished = 10,
    OfferSubmitted = 11,
    OfferAccepted = 12,
    OfferRejected = 13,
    OfferRevisionSubmitted = 14,
    RfqClosed = 15,
    RfqCancelled = 16,
    OfferWithdrawn = 17,
    OfferExpired = 18,

    DealCreated = 20,
    DealConfirmationReceived = 21,
    DealConfirmed = 22,
    DealStarted = 23,
    DealCompleted = 24,
    DealCancellationRequested = 25,
    DealCancelled = 26,
    DealDisputeOpened = 27,
    DealDisputeResolved = 28,

    ShipmentCreated = 30,
    ShipmentTrackingUpdated = 31,
    ShipmentStatusChanged = 32,

    ReviewReceived = 40,

    TenderPublished = 50,
    BidSubmitted = 51,
    BidRevised = 52,
    BidWithdrawn = 53,
    TenderClosed = 54,
    TenderReopened = 55,
    TenderCancelled = 56,
    TenderNoAward = 57,
    TenderAwarded = 58,
    BidAwarded = 59,
    BidRejected = 60
}

