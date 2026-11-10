namespace DealZone.Application.Common.Interfaces;

/// <summary>
/// Processor for expiring commercial offers whose validity date has elapsed.
/// </summary>
public interface IOfferExpiryProcessor
{
    /// <summary>
    /// Processes all submitted/under-review offers with ValidityDateUtc &lt;= now in bounded batches.
    /// Returns the number of offers transitioned to Expired.
    /// </summary>
    Task<int> ProcessExpiredOffersAsync(CancellationToken cancellationToken = default);
}
