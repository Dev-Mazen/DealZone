namespace DealZone.Application.Common.Interfaces;

public interface ITenderClosingProcessor
{
    Task<int> ProcessClosedTendersAsync(CancellationToken cancellationToken = default);
}
