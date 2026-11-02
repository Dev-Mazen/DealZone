using System.Net;
using System.Text.Json;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace DealZone.IntegrationTests.Endpoints;

public class ErrorHandlingIntegrationTests
{
    [Fact]
    public async Task ValidationException_ShouldReturn400WithProblemDetailsAndErrors()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/test-exceptions/validation");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.Equal(400, root.GetProperty("status").GetInt32());
        Assert.Equal("Validation Error", root.GetProperty("title").GetString());
        Assert.True(root.TryGetProperty("traceId", out var traceId) && !string.IsNullOrWhiteSpace(traceId.GetString()));

        Assert.True(root.TryGetProperty("errors", out var errors));
        Assert.True(errors.TryGetProperty("CommercialRegistrationNumber", out var crnErrors));
        Assert.Contains("Must be 10 digits.", crnErrors[0].GetString());
    }

    [Fact]
    public async Task NotFoundException_ShouldReturn404WithProblemDetails()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/test-exceptions/not-found");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.Equal(404, root.GetProperty("status").GetInt32());
        Assert.Equal("Not Found", root.GetProperty("title").GetString());
        Assert.True(root.TryGetProperty("traceId", out var traceId) && !string.IsNullOrWhiteSpace(traceId.GetString()));
    }

    [Fact]
    public async Task ConflictException_ShouldReturn409WithProblemDetails()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/test-exceptions/conflict");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.Equal(409, root.GetProperty("status").GetInt32());
        Assert.Equal("Conflict", root.GetProperty("title").GetString());
        Assert.True(root.TryGetProperty("traceId", out var traceId) && !string.IsNullOrWhiteSpace(traceId.GetString()));
    }

    [Fact]
    public async Task UnauthorizedException_ShouldReturn401WithProblemDetails()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/test-exceptions/unauthorized");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.Equal(401, root.GetProperty("status").GetInt32());
        Assert.Equal("Unauthorized", root.GetProperty("title").GetString());
        Assert.True(root.TryGetProperty("traceId", out var traceId) && !string.IsNullOrWhiteSpace(traceId.GetString()));
    }

    [Fact]
    public async Task ForbiddenException_ShouldReturn403WithProblemDetails()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/test-exceptions/forbidden");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.Equal(403, root.GetProperty("status").GetInt32());
        Assert.Equal("Forbidden", root.GetProperty("title").GetString());
        Assert.True(root.TryGetProperty("traceId", out var traceId) && !string.IsNullOrWhiteSpace(traceId.GetString()));
    }

    [Fact]
    public async Task UnhandledException_InProduction_ShouldNeverLeakSensitiveDetailsOrStackTrace()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("JwtSettings:SecretKey", "ProductionSecretKeyForIntegrationTestingOnlyMustBe32BytesLong!");
        }).CreateClient();

        var response = await client.GetAsync("/api/v1/test-exceptions/unhandled");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.Equal(500, root.GetProperty("status").GetInt32());
        Assert.Equal("Internal Server Error", root.GetProperty("title").GetString());
        Assert.Equal("An unexpected error occurred while processing your request.", root.GetProperty("detail").GetString());

        // Verify sensitive message and stack trace are completely absent
        Assert.DoesNotContain("Sensitive internal database connection string failed", content);
        Assert.DoesNotContain("StackTrace", content, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at DealZone", content, StringComparison.OrdinalIgnoreCase);

        // Verify trace ID is still provided for server-side diagnosis
        Assert.True(root.TryGetProperty("traceId", out var traceId) && !string.IsNullOrWhiteSpace(traceId.GetString()));
    }
}
