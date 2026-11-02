using System.Net;
using System.Text.Json;
using DealZone.IntegrationTests.Infrastructure;

namespace DealZone.IntegrationTests.Endpoints;

public class HealthCheckEndpointTests : IClassFixture<DealZoneWebApplicationFactory>
{
    private readonly HttpClient _client;

    public HealthCheckEndpointTests(DealZoneWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Theory]
    [InlineData("/health")]
    [InlineData("/api/v1/health")]
    public async Task HealthEndpoint_ShouldReturnHealthyStatus(string endpoint)
    {
        var response = await _client.GetAsync(endpoint);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);
        var status = jsonDoc.RootElement.GetProperty("status").GetString();

        Assert.Equal("Healthy", status);
    }
}

