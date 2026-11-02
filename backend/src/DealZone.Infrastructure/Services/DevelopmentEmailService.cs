using System.Collections.Concurrent;
using DealZone.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Services;

public class SentEmailRecord
{
    public string Email { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset SentAtUtc { get; set; } = DateTimeOffset.UtcNow;
}

public class DevelopmentEmailService : IEmailService
{
    private readonly ILogger<DevelopmentEmailService> _logger;
    private static readonly ConcurrentBag<SentEmailRecord> _sentEmails = new();

    public DevelopmentEmailService(ILogger<DevelopmentEmailService> logger)
    {
        _logger = logger;
    }

    public static IReadOnlyCollection<SentEmailRecord> SentEmails => _sentEmails.ToArray();

    public static void Clear() => _sentEmails.Clear();

    public Task SendEmailConfirmationAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        _sentEmails.Add(new SentEmailRecord
        {
            Email = email,
            Purpose = "EmailConfirmation",
            Token = token
        });

        _logger.LogInformation("Dispatched confirmation email to recipient: {Email}", email);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        _sentEmails.Add(new SentEmailRecord
        {
            Email = email,
            Purpose = "PasswordReset",
            Token = token
        });

        _logger.LogInformation("Dispatched password reset email to recipient: {Email}", email);
        return Task.CompletedTask;
    }

    public Task SendVerificationDecisionAsync(
        string email,
        string companyName,
        string decision,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        _sentEmails.Add(new SentEmailRecord
        {
            Email = email,
            Purpose = $"VerificationDecision:{decision}",
            Token = reason ?? string.Empty
        });

        _logger.LogInformation(
            "Dispatched verification decision '{Decision}' email to {Email} for company '{CompanyName}'.",
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
        _sentEmails.Add(new SentEmailRecord
        {
            Email = email,
            Purpose = "OfferAccepted",
            Token = $"{rfqNumber}:{offerNumber}"
        });

        _logger.LogInformation(
            "Dispatched offer accepted email to {Email} ({CompanyName}) for RFQ {RfqNumber}, Offer {OfferNumber}.",
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
        _sentEmails.Add(new SentEmailRecord
        {
            Email = email,
            Purpose = "OfferRejected",
            Token = reason ?? string.Empty
        });

        _logger.LogInformation(
            "Dispatched offer rejected email to {Email} ({CompanyName}) for RFQ {RfqNumber}, Offer {OfferNumber}.",
            email, companyName, rfqNumber, offerNumber);

        return Task.CompletedTask;
    }

    public Task SendDealConfirmationAsync(
        string email,
        string companyName,
        string dealNumber,
        string roleDescription,
        CancellationToken cancellationToken = default)
    {
        _sentEmails.Add(new SentEmailRecord
        {
            Email = email,
            Purpose = "DealConfirmation",
            Token = $"{dealNumber}:{roleDescription}"
        });

        _logger.LogInformation(
            "Dispatched deal confirmation email to {Email} ({CompanyName}) for Deal {DealNumber} as {RoleDescription}.",
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
        _sentEmails.Add(new SentEmailRecord
        {
            Email = email,
            Purpose = $"DisputeResolution:{resolutionAction}",
            Token = adminNotes ?? string.Empty
        });

        _logger.LogInformation(
            "Dispatched dispute resolution email to {Email} ({CompanyName}) for Deal {DealNumber}, Dispute {DisputeNumber}, Action {Action}.",
            email, companyName, dealNumber, disputeNumber, resolutionAction);

        return Task.CompletedTask;
    }
}
