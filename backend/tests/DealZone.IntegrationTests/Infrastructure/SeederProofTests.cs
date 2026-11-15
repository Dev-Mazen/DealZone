using DealZone.Domain.Companies;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Seeding;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace DealZone.IntegrationTests.Infrastructure;

public class SeederProofTests
{
    private const string ScratchDbName = "DealZoneDb_Scratch_SeederProof";
    private const string MasterConnStr = "Server=localhost;Database=master;Trusted_Connection=True;TrustServerCertificate=True;";
    private const string ScratchConnStr = $"Server=localhost;Database={ScratchDbName};Trusted_Connection=True;TrustServerCertificate=True;";

    [Fact]
    public async Task Seeder_ProducesExpectedCompanyCounts_AndCompany6IsBuyer()
    {
        // 1. Create scratch DB
        using (var masterConn = new SqlConnection(MasterConnStr))
        {
            await masterConn.OpenAsync();
            using var cmd = masterConn.CreateCommand();
            cmd.CommandText = $@"
                IF DB_ID('{ScratchDbName}') IS NOT NULL
                BEGIN
                    ALTER DATABASE [{ScratchDbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                    DROP DATABASE [{ScratchDbName}];
                END;
                CREATE DATABASE [{ScratchDbName}];";
            await cmd.ExecuteNonQueryAsync();
        }

        try
        {
            // 2. Run all EF migrations on scratch DB
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["SeedDemoData"] = "true",
                    ["ResetDemoData"] = "true"
                })
                .Build();

            var services = new ServiceCollection();
            services.AddSingleton<IConfiguration>(config);
            services.AddLogging(b => b.AddConsole());
            services.AddSingleton<DealZone.Application.Common.Interfaces.IPasswordHasher, DealZone.Infrastructure.Services.PasswordHasherService>();
            services.AddDbContext<DealZoneDbContext>(opts =>
            {
                opts.UseSqlServer(ScratchConnStr);
                opts.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
            });
            var sp = services.BuildServiceProvider();

            using (var scope = sp.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
                await db.Database.MigrateAsync();

                // 3. Run Seeders
                await AdminUserSeeder.SeedAsync(scope.ServiceProvider);
                await CatalogSeeder.SeedAsync(scope.ServiceProvider);
                await DemoDataSeeder.SeedAsync(scope.ServiceProvider);

                // 4. Verify Company 6 is Buyer
                var company6 = await db.Companies.IgnoreQueryFilters()
                    .FirstOrDefaultAsync(c => c.Id == DemoDataSeeder.DualCompanyId);

                Assert.NotNull(company6);
                Assert.Equal(CompanyType.Buyer, company6.CompanyType);

                // 5. Verify sample company counts
                var sampleCompanies = await db.Companies.IgnoreQueryFilters()
                    .Where(c => c.LegalName.Contains("[Sample]"))
                    .ToListAsync();

                var buyers = sampleCompanies.Count(c => c.CompanyType == CompanyType.Buyer);
                var suppliers = sampleCompanies.Count(c => c.CompanyType == CompanyType.Supplier);

                // In dev database: sample companies have 4 Buyers (including company 6) and 6 Suppliers
                Assert.Equal(4, buyers);
                Assert.Equal(6, suppliers);
            }
        }
        finally
        {
            // 6. Clean up: Drop scratch DB
            using var masterConn = new SqlConnection(MasterConnStr);
            await masterConn.OpenAsync();
            using var cmd = masterConn.CreateCommand();
            cmd.CommandText = $@"
                IF DB_ID('{ScratchDbName}') IS NOT NULL
                BEGIN
                    ALTER DATABASE [{ScratchDbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                    DROP DATABASE [{ScratchDbName}];
                END;";
            await cmd.ExecuteNonQueryAsync();
        }
    }
}
