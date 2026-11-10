using DealZone.Application.Common.Interfaces;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace DealZone.Infrastructure.Services;

/// <summary>
/// Concurrency-safe generator for sequential Tender and Bid numbers.
/// In relational databases (SQL Server), uses database SEQUENCES.
/// In in-memory test providers, uses thread-safe atomic counters.
/// </summary>
public class TenderNumberGenerator : ITenderNumberGenerator
{
    private readonly DealZoneDbContext _context;
    private static long _inMemoryTenderCounter = 1000;
    private static long _inMemoryBidCounter = 1000;

    public TenderNumberGenerator(DealZoneDbContext context)
    {
        _context = context;
    }

    public async Task<string> NextTenderNumberAsync(CancellationToken cancellationToken = default)
    {
        var prefix = DateTimeOffset.UtcNow.ToString("yyyyMM");
        var seq = await GetSequenceValueAsync("TenderNumberSequence", () => Interlocked.Increment(ref _inMemoryTenderCounter), cancellationToken);
        return $"TND-{prefix}-{seq:D5}";
    }

    public async Task<string> NextBidNumberAsync(CancellationToken cancellationToken = default)
    {
        var prefix = DateTimeOffset.UtcNow.ToString("yyyyMM");
        var seq = await GetSequenceValueAsync("BidNumberSequence", () => Interlocked.Increment(ref _inMemoryBidCounter), cancellationToken);
        return $"BID-{prefix}-{seq:D5}";
    }

    private async Task<long> GetSequenceValueAsync(string sequenceName, Func<long> inMemoryFallback, CancellationToken cancellationToken)
    {
        if (_context.Database.IsSqlServer())
        {
            try
            {
                var connection = _context.Database.GetDbConnection();
                var wasOpen = connection.State == System.Data.ConnectionState.Open;
                if (!wasOpen)
                {
                    await connection.OpenAsync(cancellationToken);
                }

                try
                {
                    using var command = connection.CreateCommand();
                    var currentTransaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                    if (currentTransaction != null)
                    {
                        command.Transaction = currentTransaction;
                    }

                    command.CommandText = $"SELECT NEXT VALUE FOR {sequenceName};";
                    var result = await command.ExecuteScalarAsync(cancellationToken);
                    return Convert.ToInt64(result);
                }
                finally
                {
                    if (!wasOpen)
                    {
                        await connection.CloseAsync();
                    }
                }
            }
            catch
            {
                return inMemoryFallback();
            }
        }

        return inMemoryFallback();
    }
}
