using System.Collections.Concurrent;
using DealZone.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Services;

public class SentEmailRecord
{
    public string Email { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string? Link { get; set; }
    public DateTimeOffset SentAtUtc { get; set; } = DateTimeOffset.UtcNow;
}

public class DevelopmentEmailService : IEmailService
{
    private readonly ILogger<DevelopmentEmailService> _logger;
    private static readonly System.Collections.Concurrent.ConcurrentQueue<SentEmailRecord> _sentEmails = new();

    public DevelopmentEmailService(ILogger<DevelopmentEmailService> logger)
    {
        _logger = logger;
    }

    public static IReadOnlyCollection<SentEmailRecord> SentEmails => _sentEmails.ToArray();

    public static void Clear() => _sentEmails.Clear();

    public Task SendEmailConfirmationAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        var link = $"http://localhost:5173/confirm-email?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

        _sentEmails.Enqueue(new SentEmailRecord
        {
            Email = email,
            Purpose = "EmailConfirmation",
            Token = token,
            Link = link
        });

        _logger.LogInformation(
            "[DEV EMAIL] Confirmation link for {Email}: {ConfirmationLink}",
            email,
            link);

        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        var link = $"http://localhost:5173/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

        _sentEmails.Enqueue(new SentEmailRecord
        {
            Email = email,
            Purpose = "PasswordReset",
            Token = token,
            Link = link
        });

        _logger.LogInformation(
            "[DEV EMAIL] Password reset link for {Email}: {ResetLink}",
            email,
            link);

        return Task.CompletedTask;
    }

    public Task SendVerificationDecisionAsync(
        string email,
        string companyName,
        string decision,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        _sentEmails.Enqueue(new SentEmailRecord
        {
            Email = email,
            Purpose = $"VerificationDecision:{decision}",
            Token = reason ?? string.Empty
        });

        _logger.LogInformation(
            "[DEV EMAIL] Verification decision '{Decision}' for {Email} ({CompanyName}).",
            decision, email, companyName);

        return Task.CompletedTask;
    }

    public Task SendOfferAcceptedAsync(
        string email,
        string companyName,
        string rfqNumber,
        string offerNumber,
        CancellationToken cancellationToken = default)
    {
        _sentEmails.Enqueue(new SentEmailRecord
        {
            Email = email,
            Purpose = "OfferAccepted",
            Token = $"{rfqNumber}:{offerNumber}"
        });

        _logger.LogInformation(
            "[DEV EMAIL] Offer accepted email to {Email} ({CompanyName}) for RFQ {RfqNumber}, Offer {OfferNumber}.",
            email, companyName, rfqNumber, offerNumber);

        return Task.CompletedTask;
    }

    public Task SendOfferRejectedAsync(
        string email,
        string companyName,
        string rfqNumber,
        string offerNumber,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        _sentEmails.Enqueue(new SentEmailRecord
        {
            Email = email,
            Purpose = "OfferRejected",
            Token = $"{rfqNumber}:{offerNumber}"
        });

        _logger.LogInformation(
            "[DEV EMAIL] Offer rejected email to {Email} ({CompanyName}) for RFQ {RfqNumber}, Offer {OfferNumber}. Reason: {Reason}",
            email, companyName, rfqNumber, offerNumber, reason);

        return Task.CompletedTask;
    }

    public Task SendDealConfirmationAsync(
        string email,
        string companyName,
        string dealNumber,
        string roleDescription,
        CancellationToken cancellationToken = default)
    {
        _sentEmails.Enqueue(new SentEmailRecord
        {
            Email = email,
            Purpose = "DealConfirmation",
            Token = dealNumber
        });

        _logger.LogInformation(
            "[DEV EMAIL] Deal confirmation email to {Email} ({CompanyName}) for Deal {DealNumber} ({Role}).",
            email, companyName, dealNumber, roleDescription);

        return Task.CompletedTask;
    }

    public Task SendDisputeResolutionAsync(
        string email,
        string companyName,
        string dealNumber,
        string disputeNumber,
        string resolutionAction,
        string? adminNotes,
        CancellationToken cancellationToken = default)
    {
        _sentEmails.Enqueue(new SentEmailRecord
        {
            Email = email,
            Purpose = $"DisputeResolution:{resolutionAction}",
            Token = disputeNumber
        });

        _logger.LogInformation(
            "[DEV EMAIL] Dispute resolution '{Action}' email to {Email} ({CompanyName}) for Deal {DealNumber}, Dispute {DisputeNumber}.",
            resolutionAction, email, companyName, dealNumber, disputeNumber);

        return Task.CompletedTask;
    }
}
