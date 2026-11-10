namespace DealZone.Application.Common.Interfaces;

/// <summary>
/// Concurrency-safe generator for sequential RFQ numbers.
/// </summary>
public interface IRfqNumberGenerator
{
    Task<string> NextRfqNumberAsync(DateTimeOffset date, CancellationToken cancellationToken = default);
}
