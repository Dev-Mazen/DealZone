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
            var verifications = db.EmailVerifications.Where(v => v.UserId == user.Id).ToList();
            foreach (var v in verifications)
            {
                v.ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(-1);
                v.CodeExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(-1);
            }
            await db.SaveChangesAsync();
        }

        var confirmRes = await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(
            Email: email,
            Token: token));

        Assert.Equal(HttpStatusCode.BadRequest, confirmRes.StatusCode);
    }

    [Fact]
    public async Task ResendConfirmation_Within60Seconds_ReturnsBadRequestDueToCooldown()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var email = $"cooldown_test_{Guid.NewGuid():N}@dealzone.eg";
        var registerRes = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest(
            Email: email,
            Password: "StrongPassword2026!",
            FullName: "Cooldown User"));
        Assert.Equal(HttpStatusCode.Created, registerRes.StatusCode);

        // Immediate resend should fail with 400 (60s cooldown)
        var resendRes = await client.PostAsJsonAsync("/api/v1/auth/resend-confirmation", new ResendConfirmationRequest(email));
        Assert.Equal(HttpStatusCode.BadRequest, resendRes.StatusCode);
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

        // Bypass cooldown by setting CreatedAtUtc 65s into the past
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var verifications = db.EmailVerifications.Where(v => v.User.Email == email).ToList();
            foreach (var v in verifications)
            {
                v.CreatedAtUtc = DateTimeOffset.UtcNow.AddSeconds(-65);
            }
            await db.SaveChangesAsync();
        }

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

    [Fact]
    public async Task ConfirmEmailCode_WithValid6DigitCode_Succeeds()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var email = $"code_confirm_{Guid.NewGuid():N}@dealzone.eg";
        var registerRes = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest(
            Email: email,
            Password: "StrongPassword2026!",
            FullName: "Code Confirm User"));
        Assert.Equal(HttpStatusCode.Created, registerRes.StatusCode);

        var emailRecord = DevelopmentEmailService.SentEmails.First(e => e.Email == email);
        Assert.NotNull(emailRecord.Code);
        Assert.Equal(6, emailRecord.Code.Length);

        var confirmRes = await client.PostAsJsonAsync("/api/v1/auth/confirm-email-code", new ConfirmEmailCodeRequest(
            Email: email,
            Code: emailRecord.Code));
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);

        // User should now be able to login
        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
    }

    [Fact]
    public async Task ConfirmEmailCode_WithWrongCode_DecrementsAttemptsAndLocksAfter5()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var email = $"code_lock_{Guid.NewGuid():N}@dealzone.eg";
        var registerRes = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest(
            Email: email,
            Password: "StrongPassword2026!",
            FullName: "Code Lock User"));
        Assert.Equal(HttpStatusCode.Created, registerRes.StatusCode);

        var emailRecord = DevelopmentEmailService.SentEmails.First(e => e.Email == email);
        var correctCode = emailRecord.Code!;
        var wrongCode = correctCode == "123456" ? "654321" : "123456";

        // Try 5 wrong attempts
        for (int i = 1; i <= 5; i++)
        {
            var failRes = await client.PostAsJsonAsync("/api/v1/auth/confirm-email-code", new ConfirmEmailCodeRequest(
                Email: email,
                Code: wrongCode));
            Assert.Equal(HttpStatusCode.BadRequest, failRes.StatusCode);
        }

        // Even with the CORRECT code, it should now fail because it is locked
        var lockedRes = await client.PostAsJsonAsync("/api/v1/auth/confirm-email-code", new ConfirmEmailCodeRequest(
            Email: email,
            Code: correctCode));
        Assert.Equal(HttpStatusCode.BadRequest, lockedRes.StatusCode);
    }

    [Fact]
    public async Task ConfirmEmailLink_WithValid32ByteToken_Succeeds()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var email = $"link_confirm_{Guid.NewGuid():N}@dealzone.eg";
        var registerRes = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest(
            Email: email,
            Password: "StrongPassword2026!",
            FullName: "Link Confirm User"));
        Assert.Equal(HttpStatusCode.Created, registerRes.StatusCode);

        var emailRecord = DevelopmentEmailService.SentEmails.First(e => e.Email == email);
        Assert.NotNull(emailRecord.LinkToken);

        var confirmRes = await client.PostAsJsonAsync("/api/v1/auth/confirm-email-link", new ConfirmEmailLinkRequest(
            Token: emailRecord.LinkToken));
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);

        // User should now be able to login
        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
    }
}
