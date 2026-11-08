using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Application.Notifications.DTOs;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Notifications;
using DealZone.Infrastructure.Options;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class NotificationIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static async Task<(string Token, Guid UserId)> RegisterAndLoginAsync(HttpClient client, string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var reg = new RegisterRequest(normalizedEmail, "StrongPassword2026!", "Notification User", "+201099988877");
        var regRes = await client.PostAsJsonAsync("/api/v1/auth/register", reg);
        Assert.Equal(HttpStatusCode.Created, regRes.StatusCode);
        var regData = await regRes.Content.ReadFromJsonAsync<RegisterResponse>(JsonOptions);
        var userId = regData!.UserId;

        var confirm = DevelopmentEmailService.SentEmails.Last(e =>
            string.Equals(e.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase) &&
            e.Purpose == "EmailConfirmation");
        var confirmRes = await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(normalizedEmail, confirm.Token));
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);

        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(normalizedEmail, "StrongPassword2026!"));
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return (auth!.AccessToken, userId);
    }

    [Fact]
    public async Task GetNotifications_ReturnsOnlyCurrentUserNotifications_WithCorrectUnreadCount()
    {
        var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var emailA = $"userA_{Guid.NewGuid():N}@test.com";
        var emailB = $"userB_{Guid.NewGuid():N}@test.com";

        var (tokenA, userAId) = await RegisterAndLoginAsync(client, emailA);
        var (tokenB, userBId) = await RegisterAndLoginAsync(client, emailB);

        // Seed notifications directly via NotificationService
        using (var scope = factory.Services.CreateScope())
        {
            var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            await notifService.CreateNotificationAsync(userAId, NotificationType.OfferSubmitted, "Offer 1", "Message 1");
            await notifService.CreateNotificationAsync(userAId, NotificationType.OfferAccepted, "Offer 2", "Message 2");
            await notifService.CreateNotificationAsync(userBId, NotificationType.DealConfirmed, "Deal 1", "Message B");
        }

        // Query user A's notifications
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenA);

        var resA = await client.GetAsync("/api/v1/notifications");
        Assert.Equal(HttpStatusCode.OK, resA.StatusCode);

        var pagedA = await resA.Content.ReadFromJsonAsync<PagedResult<NotificationResponse>>(JsonOptions);
        Assert.NotNull(pagedA);
        Assert.Equal(2, pagedA.TotalCount);
        Assert.All(pagedA.Items, n => Assert.Equal(userAId, n.UserId));

        // Query user A's unread count
        var unreadRes = await client.GetAsync("/api/v1/notifications/unread-count");
        Assert.Equal(HttpStatusCode.OK, unreadRes.StatusCode);
        var unreadCount = await unreadRes.Content.ReadFromJsonAsync<UnreadCountResponse>(JsonOptions);
        Assert.Equal(2, unreadCount!.UnreadCount);

        // Query user B's notifications
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenB);
        var resB = await client.GetAsync("/api/v1/notifications");
        var pagedB = await resB.Content.ReadFromJsonAsync<PagedResult<NotificationResponse>>(JsonOptions);
        Assert.NotNull(pagedB);
        Assert.Equal(1, pagedB.TotalCount);
        Assert.Equal(userBId, pagedB.Items[0].UserId);
    }

    [Fact]
    public async Task MarkAsRead_WhenNotificationBelongsToAnotherUser_ReturnsNotFound()
    {
        var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var emailA = $"idorA_{Guid.NewGuid():N}@test.com";
        var emailB = $"idorB_{Guid.NewGuid():N}@test.com";

        var (tokenA, userAId) = await RegisterAndLoginAsync(client, emailA);
        var (tokenB, userBId) = await RegisterAndLoginAsync(client, emailB);

        Guid notificationBId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var notif = Notification.Create(userBId, NotificationType.DealStarted, "Title", "Message");
            db.Notifications.Add(notif);
            await db.SaveChangesAsync();
            notificationBId = notif.Id;
        }

        // User A attempts to mark User B's notification as read
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenA);
        var response = await client.PostAsync($"/api/v1/notifications/{notificationBId}/read", null);

        // IDOR prevention: must return 404 NotFound
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // Verify User B's notification is still unread
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var notif = await db.Notifications.FindAsync(notificationBId);
            Assert.NotNull(notif);
            Assert.False(notif.IsRead);
        }
    }

    [Fact]
    public async Task MarkAllAsRead_MarksOnlyCurrentUserNotifications()
    {
        var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var emailA = $"readAllA_{Guid.NewGuid():N}@test.com";
        var emailB = $"readAllB_{Guid.NewGuid():N}@test.com";

        var (tokenA, userAId) = await RegisterAndLoginAsync(client, emailA);
        var (tokenB, userBId) = await RegisterAndLoginAsync(client, emailB);

        using (var scope = factory.Services.CreateScope())
        {
            var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            await notifService.CreateNotificationAsync(userAId, NotificationType.ShipmentCreated, "Shipment 1", "Msg 1");
            await notifService.CreateNotificationAsync(userAId, NotificationType.ShipmentTrackingUpdated, "Shipment 2", "Msg 2");
            await notifService.CreateNotificationAsync(userBId, NotificationType.ShipmentCreated, "Shipment B", "Msg B");
        }

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenA);
        var res = await client.PostAsync("/api/v1/notifications/read-all", null);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        // Check user A unread count is 0
        var unreadA = await client.GetAsync("/api/v1/notifications/unread-count");
        var unreadACount = await unreadA.Content.ReadFromJsonAsync<UnreadCountResponse>(JsonOptions);
        Assert.Equal(0, unreadACount!.UnreadCount);

        // Check user B unread count is still 1
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenB);
        var unreadB = await client.GetAsync("/api/v1/notifications/unread-count");
        var unreadBCount = await unreadB.Content.ReadFromJsonAsync<UnreadCountResponse>(JsonOptions);
        Assert.Equal(1, unreadBCount!.UnreadCount);
    }

    [Fact]
    public async Task CreateNotification_WithIdempotencyKey_PreventsDuplicateCreation()
    {
        var factory = new DealZoneWebApplicationFactory();
        using var scope = factory.Services.CreateScope();

        var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();

        var userId = Guid.NewGuid();
        var key = $"idemp-key-{Guid.NewGuid():N}";

        // Call twice with the same idempotency key
        await notifService.CreateNotificationAsync(userId, NotificationType.DealConfirmed, "Title", "Msg", "Deal", Guid.NewGuid(), key);
        await notifService.CreateNotificationAsync(userId, NotificationType.DealConfirmed, "Title", "Msg", "Deal", Guid.NewGuid(), key);

        var count = await db.Notifications.CountAsync(n => n.UserId == userId && n.IdempotencyKey == key);
        Assert.Equal(1, count);
    }

    [Fact]
    public void DependencyInjection_InProductionEnvironment_RegistersSmtpEmailService()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "ProductionSecretKeyForIntegrationTestingOnlyMustBe32BytesLong!"
            })
            .Build();
        var envMock = new TestHostEnvironment { EnvironmentName = Environments.Production };

        DealZone.Infrastructure.DependencyInjection.AddInfrastructureServices(services, config, envMock);
        var provider = services.BuildServiceProvider();

        var emailService = provider.GetService<IEmailService>();
        Assert.NotNull(emailService);
        Assert.IsType<SmtpEmailService>(emailService);
    }

    [Fact]
    public void DependencyInjection_InDevelopmentEnvironment_RegistersDevelopmentEmailService()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder().Build();
        var envMock = new TestHostEnvironment { EnvironmentName = Environments.Development };

        DealZone.Infrastructure.DependencyInjection.AddInfrastructureServices(services, config, envMock);
        var provider = services.BuildServiceProvider();

        var emailService = provider.GetService<IEmailService>();
        Assert.NotNull(emailService);
        Assert.IsType<DevelopmentEmailService>(emailService);
    }

    [Fact]
    public void DependencyInjection_InProductionEnvironment_WithDefaultJwtSecret_ThrowsInvalidOperationException()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder().Build();
        var envMock = new TestHostEnvironment { EnvironmentName = Environments.Production };

        var ex = Assert.Throws<InvalidOperationException>(() =>
            DealZone.Infrastructure.DependencyInjection.AddInfrastructureServices(services, config, envMock));

        Assert.Contains("JwtSettings:SecretKey", ex.Message);
    }

    [Fact]
    public async Task SmtpEmailService_WhenHostUnreachable_ThrowsEmailDeliveryException()
    {
        // Critical emails (e.g. confirmation) must surface SMTP failures.
        var options = Microsoft.Extensions.Options.Options.Create(new SmtpSettings
        {
            Host = "127.0.0.1",
            Port = 65432,
            FromEmail = "noreply@dealzone.eg",
            FromName = "DealZone"
        });

        var service = new SmtpEmailService(options, NullLogger<SmtpEmailService>.Instance);

        var ex = await Assert.ThrowsAsync<EmailDeliveryException>(() =>
            service.SendEmailConfirmationAsync("test@example.com", "token-123"));

        Assert.Contains("failed", ex.Message.ToLowerInvariant());
    }

    [Fact]
    public async Task SmtpEmailService_WhenHostUnreachable_NonCriticalEmailsDoNotThrow()
    {
        // Non-critical emails (e.g. verification decisions) are swallowed on SMTP failure.
        var options = Microsoft.Extensions.Options.Options.Create(new SmtpSettings
        {
            Host = "127.0.0.1",
            Port = 65432,
            FromEmail = "noreply@dealzone.eg",
            FromName = "DealZone"
        });

        var service = new SmtpEmailService(options, NullLogger<SmtpEmailService>.Instance);

        var exception = await Record.ExceptionAsync(() =>
            service.SendVerificationDecisionAsync("test@example.com", "Cairo Fabrics", "Approved", null));

        Assert.Null(exception);
    }

    private class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "DealZone.IntegrationTests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
