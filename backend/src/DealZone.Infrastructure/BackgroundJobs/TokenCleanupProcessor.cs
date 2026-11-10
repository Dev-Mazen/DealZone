using DealZone.Application.Common.Interfaces;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DealZone.Infrastructure.BackgroundJobs;

public class TokenCleanupProcessor : ITokenCleanupProcessor
{
    private readonly DealZoneDbContext _context;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<TokenCleanupProcessor> _logger;
    private readonly BackgroundJobOptions _options;

    public TokenCleanupProcessor(
        DealZoneDbContext context,
        IDateTimeProvider dateTimeProvider,
        ILogger<TokenCleanupProcessor> logger,
        IOptions<BackgroundJobOptions> options)
    {
        _context = context;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
        _options = options.Value;
    }

    public async Task<int> CleanupExpiredTokensAsync(CancellationToken cancellationToken = default)
    {
        var now = _dateTimeProvider.UtcNow;
        var retentionDays = Math.Max(1, _options.TokenRetentionDays);
        var cutoff = now.AddDays(-retentionDays);

        var staleTokens = await _context.RefreshTokens
            .Where(t => (t.RevokedAtUtc != null && t.RevokedAtUtc <= cutoff) ||
                        (t.ExpiresAtUtc <= cutoff))
            .Take(500)
            .ToListAsync(cancellationToken);

        if (staleTokens.Count == 0)
        {
            return 0;
        }

        _context.RefreshTokens.RemoveRange(staleTokens);
        var deletedCount = await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Purged {Count} stale refresh tokens older than {CutoffUtc}",
            deletedCount, cutoff);

        return deletedCount;
    }
}
