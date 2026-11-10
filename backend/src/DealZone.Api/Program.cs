using DealZone.Api;
using DealZone.Api.Infrastructure;
using DealZone.Api.Options;
using DealZone.Application;
using DealZone.Infrastructure;
using DealZone.Infrastructure.Seeding;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext();
});

// Add application layers to DI
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration, builder.Environment);
builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

// Seed admin user, baseline catalog, and controlled demo data in Development
if (app.Environment.IsDevelopment())
{
    await AdminUserSeeder.SeedAsync(app.Services);
    await CatalogSeeder.SeedAsync(app.Services);
    await DemoDataSeeder.SeedAsync(app.Services);
}

// Centralized error handling
app.UseExceptionHandler();

// Forwarded headers for reverse proxy compatibility
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor |
                       Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

// Security HTTP headers
app.UseSecurityHeaders();

// Structured HTTP request logging
app.UseSerilogRequestLogging();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// OpenAPI documentation & Swagger UI (development or explicit configuration opt-in)
var enableSwagger = app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Swagger:Enabled");
if (enableSwagger)
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "DealZone API v1");
        options.RoutePrefix = "swagger";
        options.DocumentTitle = "DealZone Marketplace Web API";
        options.DisplayRequestDuration();
        options.EnableTryItOutByDefault();
    });
}

app.UseHttpsRedirection();

app.UseCors(CorsOptions.PolicyName);

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Health checks
var healthOptions = new HealthCheckOptions
{
    ResponseWriter = HealthCheckResponseWriter.WriteResponse
};

app.MapHealthChecks("/health", healthOptions);
app.MapHealthChecks("/api/v1/health", healthOptions);

app.MapControllers();

try
{
    Log.Information("Starting DealZone Web API host");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "DealZone Web API host terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program;
