using System.Net;
using System.Net.Mail;
using DealZone.Application.Common.Interfaces;
using DealZone.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DealZone.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<SmtpSettings> settings, ILogger<SmtpEmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendEmailConfirmationAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        var subject = "Confirm your DealZone account";
        var body = $"""
            Hello,

            Thank you for registering on DealZone.
            Please use the following token to confirm your email address:
            {token}

            If you did not register for this account, please ignore this email.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailSafeAsync(email, subject, body, "EmailConfirmation", cancellationToken);
    }

    public async Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        var subject = "Reset your DealZone password";
        var body = $"""
            Hello,

            We received a request to reset your DealZone password.
            Use the following token to complete the password reset:
            {token}

            This token is valid for 1 hour. If you did not request this, please contact support immediately.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailSafeAsync(email, subject, body, "PasswordReset", cancellationToken);
    }

    public async Task SendVerificationDecisionAsync(
        string email,
        string companyName,
        string decision,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Company Verification Status: {decision} - DealZone";
        var reasonLine = string.IsNullOrWhiteSpace(reason) ? string.Empty : $"\nReason/Notes: {reason}\n";
        var body = $"""
            Hello,

            The verification status for company '{companyName}' has been updated to: {decision}.
            {reasonLine}
            Please sign in to DealZone to view your company details.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailSafeAsync(email, subject, body, $"VerificationDecision:{decision}", cancellationToken);
    }

    public async Task SendOfferAcceptedAsync(
        string email,
        string companyName,
        string rfqNumber,
        string offerNumber,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Offer Accepted - RFQ {rfqNumber} on DealZone";
        var body = $"""
            Hello {companyName},

            Great news! Your offer {offerNumber} for RFQ {rfqNumber} has been accepted by the buyer.
            A binding Deal has been created and is awaiting confirmation.

            Please log into DealZone to review and confirm the Deal terms.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailSafeAsync(email, subject, body, "OfferAccepted", cancellationToken);
    }

    public async Task SendOfferRejectedAsync(
        string email,
        string companyName,
        string rfqNumber,
        string offerNumber,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Offer Update - RFQ {rfqNumber} on DealZone";
        var reasonLine = string.IsNullOrWhiteSpace(reason) ? string.Empty : $"\nReason: {reason}\n";
        var body = $"""
            Hello {companyName},

            Your offer {offerNumber} for RFQ {rfqNumber} was not accepted by the buyer.
            {reasonLine}
            Thank you for participating on DealZone.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailSafeAsync(email, subject, body, "OfferRejected", cancellationToken);
    }

    public async Task SendDealConfirmationAsync(
        string email,
        string companyName,
        string dealNumber,
        string roleDescription,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Deal Confirmed - {dealNumber} on DealZone";
        var body = $"""
            Hello {companyName},

            Deal {dealNumber} has received mutual confirmation from both parties ({roleDescription}).
            The deal is now formally Confirmed and ready for fulfillment.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailSafeAsync(email, subject, body, "DealConfirmation", cancellationToken);
    }

    public async Task SendDisputeResolutionAsync(
        string email,
        string companyName,
        string dealNumber,
        string disputeNumber,
        string resolutionAction,
        string? adminNotes,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Dispute Resolved - Deal {dealNumber} on DealZone";
        var notesLine = string.IsNullOrWhiteSpace(adminNotes) ? string.Empty : $"\nAdmin Notes: {adminNotes}\n";
        var body = $"""
            Hello {companyName},

            Dispute {disputeNumber} on Deal {dealNumber} has been reviewed and resolved by platform administrators.
            Resolution: {resolutionAction}
            {notesLine}
            Please sign in to DealZone to review the updated status.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailSafeAsync(email, subject, body, $"DisputeResolution:{resolutionAction}", cancellationToken);
    }

    private async Task SendEmailSafeAsync(
        string recipientEmail,
        string subject,
        string body,
        string purpose,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_settings.Host))
        {
            _logger.LogWarning(
                "SMTP host is not configured. Email for purpose {Purpose} to recipient {Recipient} skipped.",
                purpose,
                recipientEmail);
            return;
        }

        try
        {
            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                EnableSsl = _settings.EnableSsl,
                Timeout = 3000
            };

            if (!string.IsNullOrWhiteSpace(_settings.Username) && !string.IsNullOrWhiteSpace(_settings.Password))
            {
                client.Credentials = new NetworkCredential(_settings.Username, _settings.Password);
            }

            using var message = new MailMessage
            {
                From = new MailAddress(_settings.FromEmail, _settings.FromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };
            message.To.Add(recipientEmail);

            await client.SendMailAsync(message, cancellationToken);

            _logger.LogInformation(
                "Successfully dispatched email for purpose {Purpose} to recipient {Recipient}.",
                purpose,
                recipientEmail);
        }
        catch (Exception ex)
        {
            // Never rethrow: email failures must be logged safely and must not break business operations
            _logger.LogError(
                ex,
                "Failed to send email for purpose {Purpose} to recipient {Recipient}. Business operation continues.",
                purpose,
                recipientEmail);
        }
    }
}

