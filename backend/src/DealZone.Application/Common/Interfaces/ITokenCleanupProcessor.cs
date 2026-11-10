namespace DealZone.Application.Common.Interfaces;

/// <summary>
/// Processor for purging old revoked or expired refresh tokens.
/// </summary>
public interface ITokenCleanupProcessor
{
    /// <summary>
    /// Deletes expired or revoked refresh tokens older than the configured retention period.
    /// Returns the number of tokens purged.
    /// </summary>
    Task<int> CleanupExpiredTokensAsync(CancellationToken cancellationToken = default);
}
