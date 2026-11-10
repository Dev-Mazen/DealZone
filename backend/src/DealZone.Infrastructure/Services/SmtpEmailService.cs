using System.Net;
using System.Net.Mail;
using DealZone.Application.Common.Interfaces;
using DealZone.Domain.Exceptions;
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
        var frontendUrl = string.IsNullOrWhiteSpace(_settings.FrontendBaseUrl)
            ? "http://localhost:5173"
            : _settings.FrontendBaseUrl.TrimEnd('/');

        var confirmationLink = $"{frontendUrl}/confirm-email?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

        var subject = "Confirm your DealZone account | تأكيد حساب ديل زون";
        var textBody = $"""
            Hello,

            Thank you for registering on DealZone — Egypt's Industrial Raw Materials Marketplace.

            Please confirm your email address by clicking the link below:
            {confirmationLink}

            Or copy and paste this verification code into the confirmation page:
            {token}

            This code is valid for 24 hours.
            If you did not register for this account, please ignore this email.

            Regards,
            DealZone Marketplace Team
            ---
            مرحباً بك في ديل زون،
            يرجى تأكيد بريدك الإلكتروني بالنقر على الرابط أعلاه أو إدخال رمز التحقق في صفحة التأكيد.
            """;

        var htmlBody = $"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background: #ffffff;">
                <h2 style="color: #06245B; margin-bottom: 4px;">Welcome to DealZone</h2>
                <p style="color: #64748B; font-size: 14px; margin-top: 0;">Egypt's Industrial Raw Materials Marketplace</p>
                <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 16px 0;" />
                <p style="color: #1E293B; font-size: 15px; line-height: 1.6;">
                    Thank you for registering. Please confirm your email address to activate your account and start trading:
                </p>
                <div style="text-align: center; margin: 28px 0;">
                    <a href="{confirmationLink}" style="background-color: #06245B; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Confirm My Email Address
                    </a>
                </div>
                <p style="color: #475569; font-size: 13px;">Or copy and paste this link into your browser:</p>
                <p style="color: #1266D6; font-size: 12px; word-break: break-all; background: #F8FAFC; padding: 10px; border-radius: 6px; border: 1px solid #E2E8F0;">
                    {confirmationLink}
                </p>
                <p style="color: #475569; font-size: 13px; margin-top: 20px;">Or enter this confirmation code on the verification page:</p>
                <p style="font-family: monospace; font-size: 14px; background: #EAF4FF; color: #06245B; padding: 10px 14px; border-radius: 6px; font-weight: bold; word-break: break-all;">
                    {token}
                </p>
                <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">This confirmation link and code are valid for 24 hours.</p>
            </div>
            """;

        await SendEmailAsync(email, subject, textBody, htmlBody, "EmailConfirmation", isCritical: true, cancellationToken);
    }

    public async Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        var frontendUrl = string.IsNullOrWhiteSpace(_settings.FrontendBaseUrl)
            ? "http://localhost:5173"
            : _settings.FrontendBaseUrl.TrimEnd('/');

        var resetLink = $"{frontendUrl}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

        var subject = "Reset your DealZone password | إعادة تعيين كلمة المرور";
        var textBody = $"""
            Hello,

            We received a request to reset your DealZone password.
            Use the following link to complete the password reset:
            {resetLink}

            Or copy and paste this token:
            {token}

            This token is valid for 1 hour. If you did not request this, please contact support immediately.

            Regards,
            DealZone Marketplace Team
            """;

        var htmlBody = $"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background: #ffffff;">
                <h2 style="color: #06245B; margin-bottom: 4px;">Reset Your Password</h2>
                <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 16px 0;" />
                <p style="color: #1E293B; font-size: 15px;">We received a request to reset your password on DealZone.</p>
                <div style="text-align: center; margin: 28px 0;">
                    <a href="{resetLink}" style="background-color: #06245B; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #475569; font-size: 13px;">Or copy and paste this reset token:</p>
                <p style="font-family: monospace; font-size: 14px; background: #EAF4FF; color: #06245B; padding: 8px 12px; border-radius: 6px; word-break: break-all;">
                    {token}
                </p>
                <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">This link and token are valid for 1 hour.</p>
            </div>
            """;

        await SendEmailAsync(email, subject, textBody, htmlBody, "PasswordReset", isCritical: true, cancellationToken);
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
        var textBody = $"""
            Hello,

            The verification status for company '{companyName}' has been updated to: {decision}.
            {reasonLine}
            Please sign in to DealZone to view your company details.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailAsync(email, subject, textBody, null, $"VerificationDecision:{decision}", isCritical: false, cancellationToken);
    }

    public async Task SendOfferAcceptedAsync(
        string email,
        string companyName,
        string rfqNumber,
        string offerNumber,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Offer Accepted - RFQ {rfqNumber} on DealZone";
        var textBody = $"""
            Hello {companyName},

            Great news! Your offer {offerNumber} for RFQ {rfqNumber} has been accepted by the buyer.
            A binding Deal has been created and is awaiting confirmation.

            Please log into DealZone to review and confirm the Deal terms.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailAsync(email, subject, textBody, null, "OfferAccepted", isCritical: false, cancellationToken);
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
        var textBody = $"""
            Hello {companyName},

            Your offer {offerNumber} for RFQ {rfqNumber} was not accepted by the buyer.
            {reasonLine}
            Thank you for participating on DealZone.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailAsync(email, subject, textBody, null, "OfferRejected", isCritical: false, cancellationToken);
    }

    public async Task SendDealConfirmationAsync(
        string email,
        string companyName,
        string dealNumber,
        string roleDescription,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Deal Confirmed - {dealNumber} on DealZone";
        var textBody = $"""
            Hello {companyName},

            Deal {dealNumber} has received mutual confirmation from both parties ({roleDescription}).
            The deal is now formally Confirmed and ready for fulfillment.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailAsync(email, subject, textBody, null, "DealConfirmation", isCritical: false, cancellationToken);
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
        var textBody = $"""
            Hello {companyName},

            Dispute {disputeNumber} on Deal {dealNumber} has been reviewed and resolved by platform administrators.
            Resolution: {resolutionAction}
            {notesLine}
            Please sign in to DealZone to review the updated status.

            Regards,
            DealZone Marketplace Team
            """;

        await SendEmailAsync(email, subject, textBody, null, $"DisputeResolution:{resolutionAction}", isCritical: false, cancellationToken);
    }

    private async Task SendEmailAsync(
        string recipientEmail,
        string subject,
        string textBody,
        string? htmlBody,
        string purpose,
        bool isCritical,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_settings.Host))
        {
            var msg = $"SMTP host is not configured. Email for purpose '{purpose}' to recipient '{recipientEmail}' cannot be sent. Please configure SmtpSettings:Host, Username, and Password.";
            _logger.LogError("{Message}", msg);
            if (isCritical)
            {
                throw new EmailDeliveryException(msg);
            }
            return;
        }

        var timeoutMs = Math.Max(5000, _settings.TimeoutSeconds * 1000);
        var maxRetries = Math.Max(1, _settings.MaxRetries);
        var attempt = 0;

        while (true)
        {
            attempt++;
            try
            {
                using var client = new SmtpClient(_settings.Host, _settings.Port)
                {
                    EnableSsl = _settings.EnableSsl,
                    Timeout = timeoutMs
                };

                if (!string.IsNullOrWhiteSpace(_settings.Username) && !string.IsNullOrWhiteSpace(_settings.Password))
                {
                    client.Credentials = new NetworkCredential(_settings.Username, _settings.Password);
                }

                using var message = new MailMessage
                {
                    From = new MailAddress(_settings.FromEmail, _settings.FromName),
                    Subject = subject,
                    Body = string.IsNullOrWhiteSpace(htmlBody) ? textBody : htmlBody,
                    IsBodyHtml = !string.IsNullOrWhiteSpace(htmlBody)
                };
                message.To.Add(recipientEmail);

                await client.SendMailAsync(message, cancellationToken);

                _logger.LogInformation(
                    "Successfully dispatched email for purpose {Purpose} to recipient {Recipient}.",
                    purpose,
                    recipientEmail);
                return;
            }
            catch (Exception ex) when (attempt < maxRetries && !cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(
                    ex,
                    "Transient failure sending email for purpose {Purpose} to recipient {Recipient} on attempt {Attempt}/{MaxRetries}. Retrying...",
                    purpose,
                    recipientEmail,
                    attempt,
                    maxRetries);

                await Task.Delay(TimeSpan.FromMilliseconds(500 * attempt), cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send email for purpose {Purpose} to recipient {Recipient} after {Attempt} attempt(s). Error: {Message}",
                    purpose,
                    recipientEmail,
                    attempt,
                    ex.Message);

                if (isCritical)
                {
                    throw new EmailDeliveryException($"Email delivery to '{recipientEmail}' failed: {ex.Message}", ex);
                }
                return;
            }
        }
    }
}
