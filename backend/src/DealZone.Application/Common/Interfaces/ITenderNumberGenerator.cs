namespace DealZone.Application.Common.Interfaces;

public interface ITenderNumberGenerator
{
    Task<string> NextTenderNumberAsync(CancellationToken cancellationToken = default);
    Task<string> NextBidNumberAsync(CancellationToken cancellationToken = default);
}
