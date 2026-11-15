using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace DealZone.IntegrationTests.Persistence;

public class EmptyDatabaseMigrationTests
{
    [Fact]
    public async Task MigrateEmptyDatabase_ToLatest_ShouldSucceedWithZeroPendingMigrations()
    {
        var scratchDbName = $"DealZoneDb_Scratch_{Guid.NewGuid():N}";
        var connStr = $"Server=localhost;Database={scratchDbName};Integrated Security=True;TrustServerCertificate=True;";

        var options = new DbContextOptionsBuilder<DealZoneDbContext>()
            .UseSqlServer(connStr)
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning))
            .Options;

        await using var db = new DealZoneDbContext(options);

        try
        {
            // Run migrations from empty state
            await db.Database.MigrateAsync();

            var pending = await db.Database.GetPendingMigrationsAsync();
            Assert.Empty(pending);

            var applied = await db.Database.GetAppliedMigrationsAsync();
            Assert.NotEmpty(applied);
        }
        finally
        {
            await db.Database.EnsureDeletedAsync();
        }
    }
}
