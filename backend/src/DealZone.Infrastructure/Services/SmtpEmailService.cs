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
        await SendEmailConfirmationAsync(email, token, token, "ar", cancellationToken);
    }

    public async Task SendEmailConfirmationAsync(
        string email,
        string code,
        string linkToken,
        string language = "ar",
        CancellationToken cancellationToken = default)
    {
        var frontendUrl = string.IsNullOrWhiteSpace(_settings.FrontendBaseUrl)
            ? "http://localhost:5173"
            : _settings.FrontendBaseUrl.TrimEnd('/');

        var confirmationLink = $"{frontendUrl}/confirm-email?token={Uri.EscapeDataString(linkToken)}";
        var isAr = language == "ar";

        var subject = isAr
            ? "أكّد حسابك على DealZone"
            : "Confirm your DealZone account";

        var preheader = isAr
            ? $"رمز تأكيد حسابك على DealZone هو: {code}"
            : $"Your DealZone verification code is: {code}";

        var textBody = isAr ? $"""
            {preheader}

            مرحباً بك في DealZone،

            شكراً لتسجيلك معنا. لتأكيد بريدك الإلكتروني وتفعيل حسابك، يرجى إدخال رمز التحقق التالي:
            {code}

            صلاحية هذا الرمز 15 دقيقة فقط.

            أو يمكنك النقر مباشرة على الرابط التالي لتأكيد حسابك:
            {confirmationLink}

            صلاحية الرابط 24 ساعة.
            إذا لم تكن قد طلبت إنشاء هذا الحساب، يرجى تجاهل هذه الرسالة.

            فريق عمل DealZone
            """ : $"""
            {preheader}

            Welcome to DealZone,

            Thank you for registering. To confirm your email address and activate your account, please enter the following verification code:
            {code}

            This code is valid for 15 minutes only.

            Or you can click the link below to confirm your account directly:
            {confirmationLink}

            This link is valid for 24 hours.
            If you did not create an account with DealZone, please disregard this email.

            DealZone Team
            """;

        var htmlBody = isAr ? $"""
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body style="margin: 0; padding: 20px; background-color: #F8FAFC; font-family: 'Cairo', Tahoma, Arial, sans-serif; direction: rtl; text-align: right;">
              <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; font-size: 1px;">
                {preheader}
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <tr>
                  <td style="padding: 28px 32px; background: #06245B; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">DealZone</h1>
                    <p style="color: #93C5FD; margin: 6px 0 0; font-size: 13px;">منصة التوريد والصفقات الصناعية</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 32px 24px;">
                    <h2 style="color: #0F172A; margin: 0 0 16px; font-size: 20px;">أكّد بريدك الإلكتروني</h2>
                    <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                      مرحباً بك في DealZone. يرجى استخدام رمز التحقق المكون من 6 أرقام لتأكيد حسابك وتفعيله:
                    </p>
                    <div style="background: #F1F5F9; border: 2px dashed #CBD5E1; border-radius: 8px; padding: 18px; text-align: center; margin: 0 0 20px;">
                      <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #06245B;">{code}</span>
                      <p style="color: #64748B; font-size: 12px; margin: 8px 0 0;">صلاحية هذا الرمز 15 دقيقة فقط</p>
                    </div>
                    <div style="text-align: center; margin: 28px 0 20px;">
                      <p style="color: #64748B; font-size: 14px; margin: 0 0 12px;">أو يمكنك تأكيد حسابك بنقرة واحدة:</p>
                      <a href="{confirmationLink}" style="background-color: #1266D6; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
                        تأكيد الحساب مباشرة
                      </a>
                    </div>
                    <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; line-height: 1.5;">
                      صلاحية رابط التأكيد 24 ساعة. إذا واجهت مشكلة في النقر على الزر، يمكنك نسخ الرابط التالي ولصقه في المتصفح:<br />
                      <span style="color: #1266D6; word-break: break-all;">{confirmationLink}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 32px; background: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
                    <p style="color: #64748B; font-size: 12px; margin: 0; line-height: 1.5;">
                      إذا لم تكن قد أنشأت حساباً في DealZone، يمكنك تجاهل هذه الرسالة بأمان وستنتهي صلاحيتها تلقائياً.
                    </p>
                    <p style="color: #94A3B8; font-size: 11px; margin: 8px 0 0;">
                      &copy; {DateTime.UtcNow.Year} DealZone. جميع الحقوق محفوظة.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """ : $"""
            <!DOCTYPE html>
            <html lang="en" dir="ltr">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body style="margin: 0; padding: 20px; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; direction: ltr; text-align: left;">
              <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; font-size: 1px;">
                {preheader}
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <tr>
                  <td style="padding: 28px 32px; background: #06245B; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">DealZone</h1>
                    <p style="color: #93C5FD; margin: 6px 0 0; font-size: 13px;">Industrial Procurement Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 32px 24px;">
                    <h2 style="color: #0F172A; margin: 0 0 16px; font-size: 20px;">Confirm your email address</h2>
                    <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                      Welcome to DealZone. Please use the following 6-digit verification code to confirm and activate your account:
                    </p>
                    <div style="background: #F1F5F9; border: 2px dashed #CBD5E1; border-radius: 8px; padding: 18px; text-align: center; margin: 0 0 20px;">
                      <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #06245B;">{code}</span>
                      <p style="color: #64748B; font-size: 12px; margin: 8px 0 0;">This code is valid for 15 minutes only</p>
                    </div>
                    <div style="text-align: center; margin: 28px 0 20px;">
                      <p style="color: #64748B; font-size: 14px; margin: 0 0 12px;">Or confirm with one click:</p>
                      <a href="{confirmationLink}" style="background-color: #1266D6; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
                        Confirm Account Directly
                      </a>
                    </div>
                    <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; line-height: 1.5;">
                      Link valid for 24 hours. If the button above doesn't work, copy and paste this link:<br />
                      <span style="color: #1266D6; word-break: break-all;">{confirmationLink}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 32px; background: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
                    <p style="color: #64748B; font-size: 12px; margin: 0; line-height: 1.5;">
                      If you did not create an account on DealZone, please disregard this email.
                    </p>
                    <p style="color: #94A3B8; font-size: 11px; margin: 8px 0 0;">
                      &copy; {DateTime.UtcNow.Year} DealZone. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;

        await SendEmailAsync(email, subject, textBody, htmlBody, "EmailConfirmation", isCritical: true, cancellationToken);
    }

    public async Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        var frontendUrl = string.IsNullOrWhiteSpace(_settings.FrontendBaseUrl)
            ? "http://localhost:5173"
            : _settings.FrontendBaseUrl.TrimEnd('/');

        var resetLink = $"{frontendUrl}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

        var subject = "إعادة تعيين كلمة المرور | Reset your DealZone password";
        var preheader = "طلب إعادة تعيين كلمة المرور لحسابك في DealZone";

        var textBody = $"""
            {preheader}

            مرحباً بك في DealZone،

            تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.
            يمكنك إعادة تعيين كلمة المرور عبر الرابط التالي:
            {resetLink}

            رمز إعادة التعيين (Token):
            {token}

            صلاحية هذا الرابط والرمز ساعة واحدة فقط.
            إذا لم تكن قد طلبت إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان.

            فريق عمل DealZone
            """;

        var htmlBody = $"""
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body style="margin: 0; padding: 20px; background-color: #F8FAFC; font-family: 'Cairo', Tahoma, Arial, sans-serif; direction: rtl; text-align: right;">
              <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; font-size: 1px;">
                {preheader}
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <tr>
                  <td style="padding: 28px 32px; background: #06245B; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">DealZone</h1>
                    <p style="color: #93C5FD; margin: 6px 0 0; font-size: 13px;">منصة التوريد والصفقات الصناعية</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 32px 24px;">
                    <h2 style="color: #0F172A; margin: 0 0 16px; font-size: 20px;">إعادة تعيين كلمة المرور</h2>
                    <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                      تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في DealZone. يرجى النقر على الزر أدناه لاختيار كلمة مرور جديدة:
                    </p>
                    <div style="text-align: center; margin: 28px 0 24px;">
                      <a href="{resetLink}" style="background-color: #1266D6; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
                        إعادة تعيين كلمة المرور
                      </a>
                    </div>
                    <p style="color: #64748B; font-size: 13px; margin-top: 20px;">أو يمكنك استخدام رمز إعادة التعيين مباشرة:</p>
                    <div style="font-family: monospace; font-size: 13px; background: #F1F5F9; color: #06245B; padding: 10px 14px; border-radius: 6px; word-break: break-all; border: 1px solid #CBD5E1;">
                      {token}
                    </div>
                    <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; line-height: 1.5;">
                      هذا الرابط والرمز صالحان لمدة ساعة واحدة فقط (1 hour).<br />
                      رابط الصفحة: <span style="color: #1266D6; word-break: break-all;">{resetLink}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 32px; background: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
                    <p style="color: #64748B; font-size: 12px; margin: 0; line-height: 1.5;">
                      إذا لم تكن قد طلبت إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني وسيبقى حسابك آمناً تماماً.
                    </p>
                    <p style="color: #94A3B8; font-size: 11px; margin: 8px 0 0;">
                      &copy; {DateTime.UtcNow.Year} DealZone. جميع الحقوق محفوظة.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
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
            DealZone Team
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
            DealZone Team
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
            DealZone Team
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
            DealZone Team
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
            DealZone Team
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
