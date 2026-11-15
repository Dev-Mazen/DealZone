using DealZone.Infrastructure.Persistence;
using DealZone.IntegrationTests.Controllers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Xunit;

[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace DealZone.IntegrationTests.Infrastructure;

public class DealZoneWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string TestConnectionString = "Server=localhost;Database=DealZoneDb_IntegrationTests;Integrated Security=True;TrustServerCertificate=True;";

    static DealZoneWebApplicationFactory()
    {
        try
        {
            var masterConnStr = "Server=localhost;Database=master;Integrated Security=True;TrustServerCertificate=True;";
            using var conn = new Microsoft.Data.SqlClient.SqlConnection(masterConnStr);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                IF DB_ID('DealZoneDb_IntegrationTests') IS NOT NULL
                BEGIN
                    ALTER DATABASE DealZoneDb_IntegrationTests SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                    DROP DATABASE DealZoneDb_IntegrationTests;
                END;
                CREATE DATABASE DealZoneDb_IntegrationTests;";
            cmd.ExecuteNonQuery();

            var options = new DbContextOptionsBuilder<DealZoneDbContext>()
                .UseSqlServer(TestConnectionString)
                .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning))
                .Options;

            using var db = new DealZoneDbContext(options);
            db.Database.Migrate();
        }
        catch
        {
            // Fallback if master access is restricted
        }
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["RateLimiting:Enabled"] = "false",
                ["EmailProvider"] = "Development",
                ["SeedDemoData"] = "false",
                ["ResetDemoData"] = "false"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.AddControllers()
                .AddApplicationPart(typeof(TestExceptionsController).Assembly);

            var descriptors = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<DealZoneDbContext>) ||
                d.ServiceType == typeof(DealZoneDbContext)).ToList();

            foreach (var descriptor in descriptors)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<DealZoneDbContext>(options =>
            {
                options.UseSqlServer(TestConnectionString)
                       .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
            });
        });
    }
}

