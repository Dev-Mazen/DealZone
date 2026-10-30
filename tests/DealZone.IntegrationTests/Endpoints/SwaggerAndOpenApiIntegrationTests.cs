using System.Net;
using System.Text.Json;
using DealZone.IntegrationTests.Infrastructure;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class SwaggerAndOpenApiIntegrationTests
{
    [Fact]
    public async Task SwaggerUI_Endpoint_ShouldReturn200AndHtml()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/swagger/index.html");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Contains("text/html", response.Content.Headers.ContentType.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("swagger-ui", content, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task OpenApi_V1Endpoint_ShouldReturnValidJsonWithBearerAuthAndPaths()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Contains("application/json", response.Content.Headers.ContentType.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        // Info assertions
        Assert.True(root.TryGetProperty("info", out var info));
        Assert.Equal("DealZone Marketplace Web API", info.GetProperty("title").GetString());
        Assert.Equal("v1", info.GetProperty("version").GetString());

        // Security schemes assertions
        Assert.True(root.TryGetProperty("components", out var components));
        Assert.True(components.TryGetProperty("securitySchemes", out var schemes));
        Assert.True(schemes.TryGetProperty("Bearer", out var bearerScheme));
        Assert.Equal("http", bearerScheme.GetProperty("type").GetString());
        Assert.Equal("bearer", bearerScheme.GetProperty("scheme").GetString());

        // Paths assertions
        Assert.True(root.TryGetProperty("paths", out var paths));
        var pathKeys = paths.EnumerateObject().Select(p => p.Name).ToList();
        Assert.True(pathKeys.Count >= 20, $"Expected at least 20 API paths, found {pathKeys.Count}. Paths: {string.Join(", ", pathKeys)}");

        // Verify key endpoints exist in the document
        Assert.Contains(pathKeys, p => p.Contains("auth/login", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(pathKeys, p => p.Contains("rfqs", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(pathKeys, p => p.Contains("deals", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(pathKeys, p => p.Contains("notifications", StringComparison.OrdinalIgnoreCase));
    }
}

