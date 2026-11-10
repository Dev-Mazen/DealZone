using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;

namespace DealZone.IntegrationTests.Endpoints;

public class AuthIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task CompleteAuthenticationLifecycle_ShouldSucceedWithReplayProtection()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        // 1. Register a new user
        var registerRequest = new RegisterRequest(
            Email: "supplier@cairofabrics.eg",
            Password: "StrongPassword2026!",
            FullName: "Tarek Nour",
            PhoneNumber: "+201012345678");

        var registerRes = await client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        Assert.Equal(HttpStatusCode.Created, registerRes.StatusCode);

        // 2. Attempt login before confirming email -> should fail
        var loginRequest = new LoginRequest("supplier@cairofabrics.eg", "StrongPassword2026!");
        var prematureLoginRes = await client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        Assert.Equal(HttpStatusCode.Unauthorized, prematureLoginRes.StatusCode);

        // 3. Retrieve email confirmation token from mock email service
        var emailRecord = DevelopmentEmailService.SentEmails.FirstOrDefault(e =>
            e.Email == "supplier@cairofabrics.eg" && e.Purpose == "EmailConfirmation");
        Assert.NotNull(emailRecord);
        var confirmationToken = emailRecord.Token;

        // 4. Confirm email
        var confirmReq = new ConfirmEmailRequest("supplier@cairofabrics.eg", confirmationToken);
        var confirmRes = await client.PostAsJsonAsync("/api/v1/auth/confirm-email", confirmReq);
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);

        // 5. Login successfully
        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);

        var authPayload = await loginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        Assert.NotNull(authPayload);
        Assert.False(string.IsNullOrWhiteSpace(authPayload.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(authPayload.RefreshToken));

        // 6. Access protected /api/v1/auth/me endpoint
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authPayload.AccessToken);
        var meRes = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.OK, meRes.StatusCode);

        var profile = await meRes.Content.ReadFromJsonAsync<UserProfileResponse>(JsonOptions);
        Assert.NotNull(profile);
        Assert.Equal("supplier@cairofabrics.eg", profile.Email);
        Assert.Equal("Tarek Nour", profile.FullName);
        Assert.True(profile.IsEmailConfirmed);

        // 7. Refresh token rotation: exchange old refresh token for a new pair
        var refreshReq = new RefreshTokenRequest(authPayload.RefreshToken);
        var refreshRes = await client.PostAsJsonAsync("/api/v1/auth/refresh", refreshReq);
        Assert.Equal(HttpStatusCode.OK, refreshRes.StatusCode);

        var refreshedPayload = await refreshRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        Assert.NotNull(refreshedPayload);
        Assert.NotEqual(authPayload.AccessToken, refreshedPayload.AccessToken);
        Assert.NotEqual(authPayload.RefreshToken, refreshedPayload.RefreshToken);

        // 8. REPLAY ATTACK DETECTION:
        // Attempt to replay the old already-rotated refresh token!
        var replayRes = await client.PostAsJsonAsync("/api/v1/auth/refresh", refreshReq);
        Assert.Equal(HttpStatusCode.Unauthorized, replayRes.StatusCode);

        // Invariant: replay revokes the entire compromised session lineage
        // Thus, the new token should also now be rejected!
        var invalidatedReq = new RefreshTokenRequest(refreshedPayload.RefreshToken);
        var invalidatedRes = await client.PostAsJsonAsync("/api/v1/auth/refresh", invalidatedReq);
        Assert.Equal(HttpStatusCode.Unauthorized, invalidatedRes.StatusCode);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ShouldReturn409Conflict()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var request = new RegisterRequest(
            Email: "duplicate@dealzone.eg",
            Password: "StrongPassword2026!",
            FullName: "Duplicate User");

        var firstRes = await client.PostAsJsonAsync("/api/v1/auth/register", request);
        Assert.Equal(HttpStatusCode.Created, firstRes.StatusCode);

        var duplicateRes = await client.PostAsJsonAsync("/api/v1/auth/register", request);
        Assert.Equal(HttpStatusCode.Conflict, duplicateRes.StatusCode);
    }

    [Fact]
    public async Task PasswordResetFlow_ShouldEnforceSingleUseToken()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        // Register and confirm
        var reg = new RegisterRequest("user.reset@dealzone.eg", "InitialPassword2026!", "Reset User");
        await client.PostAsJsonAsync("/api/v1/auth/register", reg);

        var confirmation = DevelopmentEmailService.SentEmails.First(e => e.Email == "user.reset@dealzone.eg" && e.Purpose == "EmailConfirmation");
        await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest("user.reset@dealzone.eg", confirmation.Token));

        // Request password reset
        var forgotRes = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", new ForgotPasswordRequest("user.reset@dealzone.eg"));
        Assert.Equal(HttpStatusCode.OK, forgotRes.StatusCode);

        var resetRecord = DevelopmentEmailService.SentEmails.First(e => e.Email == "user.reset@dealzone.eg" && e.Purpose == "PasswordReset");
        Assert.NotNull(resetRecord);

        // Reset password
        var resetReq = new ResetPasswordRequest("user.reset@dealzone.eg", resetRecord.Token, "NewStrongPassword2026!");
        var resetRes = await client.PostAsJsonAsync("/api/v1/auth/reset-password", resetReq);
        Assert.Equal(HttpStatusCode.OK, resetRes.StatusCode);

        // Old password fails
        var oldLogin = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest("user.reset@dealzone.eg", "InitialPassword2026!"));
        Assert.Equal(HttpStatusCode.Unauthorized, oldLogin.StatusCode);

        // New password succeeds
        var newLogin = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest("user.reset@dealzone.eg", "NewStrongPassword2026!"));
        Assert.Equal(HttpStatusCode.OK, newLogin.StatusCode);

        // Reusing the token must fail (single-use!)
        var reuseRes = await client.PostAsJsonAsync("/api/v1/auth/reset-password", resetReq);
        Assert.Equal(HttpStatusCode.BadRequest, reuseRes.StatusCode);
    }

    [Fact]
    public async Task GetCurrentUser_Unauthenticated_ShouldReturn401()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ─── UpdateProfile ────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateProfile_ValidData_ShouldUpdateFullNameAndPhone()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var email = "profile.test@dealzone.eg";
        var reg = new RegisterRequest(email, "StrongPassword2026!", "Original Name", "+201099988877");
        await client.PostAsJsonAsync("/api/v1/auth/register", reg);

        var confirm = DevelopmentEmailService.SentEmails.Last(e => e.Email == email && e.Purpose == "EmailConfirmation");
        await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(email, confirm.Token));

        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var updateRes = await client.PutAsJsonAsync("/api/v1/auth/profile", new UpdateProfileRequest("Updated Name", "+201011122233"));
        Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);

        var profile = await updateRes.Content.ReadFromJsonAsync<UserProfileResponse>(JsonOptions);
        Assert.NotNull(profile);
        Assert.Equal("Updated Name", profile!.FullName);
        Assert.Equal("+201011122233", profile.PhoneNumber);
        Assert.Equal(email, profile.Email);
    }

    [Fact]
    public async Task UpdateProfile_Unauthenticated_ShouldReturn401()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/v1/auth/profile", new UpdateProfileRequest("Some Name", null));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task UpdateProfile_InvalidFullName_ShouldReturn400(string invalidName)
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var email = $"profile.invalid.{Guid.NewGuid():N}@dealzone.eg";
        var reg = new RegisterRequest(email, "StrongPassword2026!", "Valid Name", null);
        await client.PostAsJsonAsync("/api/v1/auth/register", reg);

        var confirm = DevelopmentEmailService.SentEmails.Last(e => e.Email == email && e.Purpose == "EmailConfirmation");
        await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(email, confirm.Token));

        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var response = await client.PutAsJsonAsync("/api/v1/auth/profile", new UpdateProfileRequest(invalidName, null));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}

