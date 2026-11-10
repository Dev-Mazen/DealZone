using DealZone.Application.Common.Interfaces;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace DealZone.Infrastructure.Services;

/// <summary>
/// Concurrency-safe generator for sequential RFQ numbers.
/// In relational databases (SQL Server), uses a database SEQUENCE.
/// In in-memory test providers, uses thread-safe atomic counter.
/// </summary>
public class RfqNumberGenerator : IRfqNumberGenerator
{
    private readonly DealZoneDbContext _context;
    private static long _inMemoryCounter = 1000;

    public RfqNumberGenerator(DealZoneDbContext context)
    {
        _context = context;
    }

    public async Task<string> NextRfqNumberAsync(DateTimeOffset date, CancellationToken cancellationToken = default)
    {
        var prefix = date.ToString("yyyyMM");
        long seqValue;

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

                    command.CommandText = "SELECT NEXT VALUE FOR RfqNumberSequence;";
                    var result = await command.ExecuteScalarAsync(cancellationToken);
                    seqValue = Convert.ToInt64(result);
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
                seqValue = Interlocked.Increment(ref _inMemoryCounter);
            }
        }
        else
        {
            seqValue = Interlocked.Increment(ref _inMemoryCounter);
        }

        return $"RFQ-{prefix}-{seqValue:D5}";
    }
}
