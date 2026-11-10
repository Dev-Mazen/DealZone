using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Api.Options;
using DealZone.Infrastructure;
using DealZone.Infrastructure.Options;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class SecurityAndProductionHardeningIntegrationTests : IClassFixture<DealZoneWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly DealZoneWebApplicationFactory _factory;

    public SecurityAndProductionHardeningIntegrationTests(DealZoneWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task SecurityHeaders_ArePresentOnResponses()
    {
        var response = await _client.GetAsync("/api/v1/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").First());

        Assert.True(response.Headers.Contains("X-Frame-Options"));
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").First());

        Assert.True(response.Headers.Contains("Referrer-Policy"));
        Assert.Equal("strict-origin-when-cross-origin", response.Headers.GetValues("Referrer-Policy").First());

        Assert.True(response.Headers.Contains("Permissions-Policy"));
        Assert.True(response.Headers.Contains("Content-Security-Policy"));
    }

    [Fact]
    public async Task AuthEndpoints_IncludeNoStoreCacheControlHeaders()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new { Email = "", Password = "" });

        Assert.True(response.Headers.Contains("Cache-Control"));
        var cacheControl = response.Headers.GetValues("Cache-Control").First();
        Assert.Contains("no-store", cacheControl);
    }

    [Fact]
    public async Task HealthCheck_ReportsDetailedSubsystemStatuses()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.Equal("Healthy", root.GetProperty("status").GetString());
        var checks = root.GetProperty("checks").EnumerateArray().ToList();

        var dbCheck = checks.FirstOrDefault(c => c.GetProperty("name").GetString() == "database");
        Assert.True(dbCheck.ValueKind == JsonValueKind.Object);
        Assert.Equal("Healthy", dbCheck.GetProperty("status").GetString());

        var storageCheck = checks.FirstOrDefault(c => c.GetProperty("name").GetString() == "file-storage");
        Assert.True(storageCheck.ValueKind == JsonValueKind.Object);
        Assert.Equal("Healthy", storageCheck.GetProperty("status").GetString());
    }

    [Fact]
    public void StartupValidation_ThrowsWhenNonDevSecretIsDevDefaultOrTooShort()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "DealZoneEnterpriseSecretKeyForJwtAuthenticationTokens2026!#EgyptRawMaterialMarketplace",
                ["JwtSettings:Issuer"] = "DealZone.Api",
                ["JwtSettings:Audience"] = "DealZone.Clients"
            })
            .Build();

        var services = new ServiceCollection();
        var mockEnv = new MockProductionEnvironment();

        var ex = Assert.Throws<InvalidOperationException>(() =>
            services.AddInfrastructureServices(configuration, mockEnv));

        Assert.Contains("must not use the development default key", ex.Message);
    }

    [Fact]
    public void StartupValidation_ThrowsWhenNonDevSecretIsMissingOrShort()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "too-short-secret",
                ["JwtSettings:Issuer"] = "DealZone.Api",
                ["JwtSettings:Audience"] = "DealZone.Clients"
            })
            .Build();

        var services = new ServiceCollection();
        var mockEnv = new MockProductionEnvironment();

        var ex = Assert.Throws<InvalidOperationException>(() =>
            services.AddInfrastructureServices(configuration, mockEnv));

        Assert.Contains("must be set to a custom cryptographically secure secret", ex.Message);
    }

    [Fact]
    public async Task RateLimiting_WhenEnabled_RejectsExcessiveRequestsWith429()
    {
        var rateLimitedFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["RateLimiting:Enabled"] = "true",
                    ["RateLimiting:LoginPermitLimit"] = "2",
                    ["RateLimiting:WindowSeconds"] = "60"
                });
            });
        });

        var client = rateLimitedFactory.CreateClient();

        // 1st request: passes to endpoint (fails validation 400, but consumed permit)
        var res1 = await client.PostAsJsonAsync("/api/v1/auth/login", new { Email = "", Password = "" });
        Assert.Equal(HttpStatusCode.BadRequest, res1.StatusCode);

        // 2nd request: passes to endpoint
        var res2 = await client.PostAsJsonAsync("/api/v1/auth/login", new { Email = "", Password = "" });
        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);

        // 3rd request: rate limit exceeded -> 429 Too Many Requests
        var res3 = await client.PostAsJsonAsync("/api/v1/auth/login", new { Email = "", Password = "" });
        Assert.Equal(HttpStatusCode.TooManyRequests, res3.StatusCode);
        Assert.Contains("json", res3.Content.Headers.ContentType?.MediaType ?? "");

        var body = await res3.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(body);
        Assert.Equal(429, jsonDoc.RootElement.GetProperty("status").GetInt32());
    }

    private class MockProductionEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = "DealZone.Api";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
