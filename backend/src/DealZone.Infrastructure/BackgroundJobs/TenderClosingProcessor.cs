using DealZone.Application.Common.Interfaces;
using DealZone.Domain.Notifications;
using DealZone.Domain.Tenders;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DealZone.Infrastructure.BackgroundJobs;

public class TenderClosingProcessor : ITenderClosingProcessor
{
    private readonly DealZoneDbContext _context;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly INotificationService _notificationService;
    private readonly ILogger<TenderClosingProcessor> _logger;
    private readonly BackgroundJobOptions _options;

    public TenderClosingProcessor(
        DealZoneDbContext context,
        IDateTimeProvider dateTimeProvider,
        INotificationService notificationService,
        ILogger<TenderClosingProcessor> logger,
        IOptions<BackgroundJobOptions> options)
    {
        _context = context;
        _dateTimeProvider = dateTimeProvider;
        _notificationService = notificationService;
        _logger = logger;
        _options = options.Value;
    }

    public async Task<int> ProcessClosedTendersAsync(CancellationToken cancellationToken = default)
    {
        var now = _dateTimeProvider.UtcNow;
        var batchSize = Math.Max(1, _options.TenderClosingBatchSize);
        var totalClosed = 0;

        while (!cancellationToken.IsCancellationRequested)
        {
            var batch = await _context.Tenders
                .Include(t => t.Bids)
                .Where(t => t.Status == TenderStatus.Published && t.ClosingDateUtc <= now)
                .OrderBy(t => t.ClosingDateUtc)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            if (batch.Count == 0)
            {
                break;
            }

            foreach (var tender in batch)
            {
                tender.Status = TenderStatus.Closed;
            }

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                totalClosed += batch.Count;
                _logger.LogInformation("Batch closed {Count} expired tenders at {NowUtc}", batch.Count, now);

                foreach (var tender in batch)
                {
                    try
                    {
                        // Notify buyer
                        await _notificationService.CreateNotificationsForCompanyMembersAsync(
                            tender.BuyerCompanyId,
                            null,
                            NotificationType.TenderClosed,
                            "Tender Deadline Reached",
                            $"Your tender {tender.TenderNumber} has reached its closing deadline and is now closed. You may review bids and award or choose No-Award.",
                            $"/tenders/{tender.Id}",
                            tender.Id,
                            "Tender",
                            cancellationToken);

                        // Notify participating suppliers
                        var participatingSuppliers = tender.Bids
                            .Where(b => b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview)
                            .Select(b => b.SupplierCompanyId)
                            .Distinct();

                        foreach (var suppId in participatingSuppliers)
                        {
                            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                                suppId,
                                null,
                                NotificationType.TenderClosed,
                                "Tender Closed",
                                $"Tender {tender.TenderNumber} has closed. Awaiting the buyer's award decision.",
                                $"/tenders/{tender.Id}",
                                tender.Id,
                                "Tender",
                                cancellationToken);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed sending notifications for closed tender {TenderId}", tender.Id);
                    }
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning(ex, "Concurrency conflict during tender closing batch save. Some records were modified concurrently.");
                foreach (var entry in ex.Entries)
                {
                    await entry.ReloadAsync(cancellationToken);
                }
                break;
            }
        }

        // Also process expired published RFQs in the unified procurement model
        while (!cancellationToken.IsCancellationRequested)
        {
            var rfqBatch = await _context.Rfqs
                .Where(r => r.Status == DealZone.Domain.Rfqs.RfqStatus.Published && r.ClosingDateUtc <= now)
                .OrderBy(r => r.ClosingDateUtc)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            if (rfqBatch.Count == 0)
            {
                break;
            }

            foreach (var rfq in rfqBatch)
            {
                rfq.Status = DealZone.Domain.Rfqs.RfqStatus.Closed;
            }

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                totalClosed += rfqBatch.Count;
                _logger.LogInformation("Batch closed {Count} expired RFQs at {NowUtc}", rfqBatch.Count, now);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to batch close expired RFQs");
                break;
            }
        }

        return totalClosed;
    }
}
