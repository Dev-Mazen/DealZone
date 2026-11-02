using DealZone.Infrastructure.Options;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DealZone.Infrastructure.Seeding;

/// <summary>
/// Development-only seeder that promotes a registered user to system admin.
/// Reads the target email from <c>AdminSettings:SeedAdminEmail</c>.
/// If the setting is blank, no action is taken.
/// This seeder must NEVER run automatically in production without explicit opt-in.
/// </summary>
public static class AdminUserSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        await using var scope = serviceProvider.CreateAsyncScope();

        var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("DealZone.Infrastructure.Seeding.AdminUserSeeder");
        var settings = scope.ServiceProvider.GetRequiredService<IOptions<AdminSettings>>().Value;

        if (string.IsNullOrWhiteSpace(settings.SeedAdminEmail))
        {
            logger.LogDebug("AdminUserSeeder: SeedAdminEmail is not configured. Skipping.");
            return;
        }

        var context = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();

        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email == settings.SeedAdminEmail.Trim().ToLowerInvariant());

        if (user is null)
        {
            logger.LogWarning(
                "AdminUserSeeder: No user found with email '{Email}'. Register first, then restart.",
                settings.SeedAdminEmail);
            return;
        }

        if (user.IsSystemAdmin)
        {
            logger.LogDebug("AdminUserSeeder: User '{Email}' is already a system admin.", user.Email);
            return;
        }

        user.IsSystemAdmin = true;
        await context.SaveChangesAsync();

        logger.LogInformation(
            "AdminUserSeeder: User '{Email}' has been promoted to system admin.", user.Email);
    }
}

