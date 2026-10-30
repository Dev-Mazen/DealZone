using System.Net;
using DealZone.IntegrationTests.Infrastructure;

namespace DealZone.IntegrationTests.Endpoints;

public class CorsIntegrationTests : IClassFixture<DealZoneWebApplicationFactory>
{
    private readonly HttpClient _client;

    public CorsIntegrationTests(DealZoneWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Request_WithAllowedOrigin_ShouldReturnAllowOriginHeader()
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/health");
        request.Headers.Add("Origin", "http://localhost:3000");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await _client.SendAsync(request);

        Assert.True(
            response.Headers.Contains("Access-Control-Allow-Origin"),
            "Expected Access-Control-Allow-Origin header for allowed origin.");

        var allowedOrigin = response.Headers.GetValues("Access-Control-Allow-Origin").FirstOrDefault();
        Assert.Equal("http://localhost:3000", allowedOrigin);
    }

    [Fact]
    public async Task Request_WithUnauthorizedOrigin_ShouldNotReturnAllowOriginHeader()
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/health");
        request.Headers.Add("Origin", "http://unauthorized-domain.com");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await _client.SendAsync(request);

        Assert.False(
            response.Headers.Contains("Access-Control-Allow-Origin"),
            "Unauthorized origin should not receive Access-Control-Allow-Origin header.");
    }
}

