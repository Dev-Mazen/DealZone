using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Domain.Exceptions;
using DealZone.Infrastructure.Options;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class EmailVerificationIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task SmtpEmailService_WhenHostNotConfigured_ThrowsEmailDeliveryException_ForCriticalEmails()
    {
        var settings = Options.Create(new SmtpSettings
        {
            Host = "", // unconfigured host
            Port = 587,
            FromEmail = "noreply@dealzone.eg"
        });

        var smtpService = new SmtpEmailService(settings, NullLogger<SmtpEmailService>.Instance);

        var ex = await Assert.ThrowsAsync<EmailDeliveryException>(() =>
            smtpService.SendEmailConfirmationAsync("user@example.com", "sample-raw-token"));

        Assert.Contains("SMTP host is not configured", ex.Message);
    }

    [Fact]
    public async Task Register_DispatchesDevelopmentEmailRecordWithValidLinkAndToken()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var email = $"verify_test_{Guid.NewGuid():N}@dealzone.eg";
        var registerRequest = new RegisterRequest(
            Email: email,
            Password: "StrongPassword2026!",
            FullName: "Test Recipient",
            PhoneNumber: "+201011112222");

        var registerRes = await client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        Assert.Equal(HttpStatusCode.Created, registerRes.StatusCode);

        var emailRecord = DevelopmentEmailService.SentEmails.FirstOrDefault(e =>
            e.Email == email && e.Purpose == "EmailConfirmation");
        Assert.NotNull(emailRecord);
        Assert.False(string.IsNullOrWhiteSpace(emailRecord.Token));
        Assert.Contains("confirm-email", emailRecord.Link);
        Assert.Contains(emailRecord.Token, emailRecord.Link);
    }

    [Fact]
    public async Task ConfirmEmail_WithInvalidToken_ReturnsBadRequest()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var email = $"invalid_token_{Guid.NewGuid():N}@dealzone.eg";
        var registerRes = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest(
            Email: email,
            Password: "StrongPassword2026!",
            FullName: "Test User"));
        Assert.Equal(HttpStatusCode.Created, registerRes.StatusCode);

        var confirmRes = await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(
            Email: email,
            Token: "completely-invalid-bogus-token-string"));

        Assert.Equal(HttpStatusCode.BadRequest, confirmRes.StatusCode);
    }

    [Fact]
    public async Task ConfirmEmail_WithExpiredToken_ReturnsBadRequest()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var email = $"expired_token_{Guid.NewGuid():N}@dealzone.eg";
        var registerRes = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest(
            Email: email,
            Password: "StrongPassword2026!",
            FullName: "Expired User"));
        Assert.Equal(HttpStatusCode.Created, registerRes.StatusCode);

        var emailRecord = DevelopmentEmailService.SentEmails.First(e => e.Email == email);
        var token = emailRecord.Token;

        // Manually expire the token in database
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var user = db.Users.First(u => u.Email == email);
            user.EmailConfirmationExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(-1); // Expired 1 hour ago
            await db.SaveChangesAsync();
        }

        var confirmRes = await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(
            Email: email,
            Token: token));

        Assert.Equal(HttpStatusCode.BadRequest, confirmRes.StatusCode);
    }

    [Fact]
    public async Task ResendConfirmation_GeneratesNewTokenAndDispatchesEmail()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var email = $"resend_test_{Guid.NewGuid():N}@dealzone.eg";
        var registerRes = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest(
            Email: email,
            Password: "StrongPassword2026!",
            FullName: "Resend User"));
        Assert.Equal(HttpStatusCode.Created, registerRes.StatusCode);

        var recordsBefore = DevelopmentEmailService.SentEmails.Where(e => e.Email == email).ToList();
        Assert.Single(recordsBefore);
        var initialToken = recordsBefore[0].Token;

        // Request Resend
        var resendRes = await client.PostAsJsonAsync("/api/v1/auth/resend-confirmation", new ResendConfirmationRequest(email));
        Assert.Equal(HttpStatusCode.OK, resendRes.StatusCode);

        var recordsAfter = DevelopmentEmailService.SentEmails.Where(e => e.Email == email).ToList();
        Assert.Equal(2, recordsAfter.Count);

        var newToken = recordsAfter.First(r => r.Token != initialToken).Token;
        Assert.NotEqual(initialToken, newToken);

        // Verify that the NEW token succeeds
        var confirmRes = await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(email, newToken));
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);

        // Verify that user can now log in
        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
    }
}
