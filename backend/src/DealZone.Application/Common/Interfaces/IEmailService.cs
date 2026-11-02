namespace DealZone.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(
        string email,
        string token,
        CancellationToken cancellationToken = default);

    Task SendPasswordResetAsync(
        string email,
        string token,
        CancellationToken cancellationToken = default);

    Task SendVerificationDecisionAsync(
        string email,
        string companyName,
        string decision,
        string? reason,
        CancellationToken cancellationToken = default);

    Task SendOfferAcceptedAsync(
        string email,
        string companyName,
        string rfqNumber,
        string offerNumber,
        CancellationToken cancellationToken = default);

    Task SendOfferRejectedAsync(
        string email,
        string companyName,
        string rfqNumber,
        string offerNumber,
        string? reason,
        CancellationToken cancellationToken = default);

    Task SendDealConfirmationAsync(
        string email,
        string companyName,
        string dealNumber,
        string roleDescription,
        CancellationToken cancellationToken = default);

    Task SendDisputeResolutionAsync(
        string email,
        string companyName,
        string dealNumber,
        string disputeNumber,
        string resolutionAction,
        string? adminNotes,
        CancellationToken cancellationToken = default);
}
