using DealZone.Application.Common.Interfaces;
using DealZone.Domain.Notifications;
using DealZone.Domain.Offers;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DealZone.Infrastructure.BackgroundJobs;

public class OfferExpiryProcessor : IOfferExpiryProcessor
{
    private readonly DealZoneDbContext _context;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly INotificationService _notificationService;
    private readonly ILogger<OfferExpiryProcessor> _logger;
    private readonly BackgroundJobOptions _options;

    public OfferExpiryProcessor(
        DealZoneDbContext context,
        IDateTimeProvider dateTimeProvider,
        INotificationService notificationService,
        ILogger<OfferExpiryProcessor> logger,
        IOptions<BackgroundJobOptions> options)
    {
        _context = context;
        _dateTimeProvider = dateTimeProvider;
        _notificationService = notificationService;
        _logger = logger;
        _options = options.Value;
    }

    public async Task<int> ProcessExpiredOffersAsync(CancellationToken cancellationToken = default)
    {
        var now = _dateTimeProvider.UtcNow;
        var batchSize = Math.Max(1, _options.OfferExpiryBatchSize);
        var totalExpired = 0;

        while (!cancellationToken.IsCancellationRequested)
        {
            // Bounded batch query: only active (Submitted or UnderReview) offers whose validity has passed
            var batch = await _context.Offers
                .Include(o => o.Rfq)
                .Where(o => (o.Status == OfferStatus.Submitted || o.Status == OfferStatus.UnderReview)
                            && o.ValidityDateUtc <= now)
                .OrderBy(o => o.ValidityDateUtc)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            if (batch.Count == 0)
            {
                break;
            }

            var expiredInBatch = 0;
            foreach (var offer in batch)
            {
                offer.Status = OfferStatus.Expired;
            }

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                expiredInBatch = batch.Count;
                totalExpired += expiredInBatch;

                _logger.LogInformation("Batch expired {Count} offers at {NowUtc}", expiredInBatch, now);

                // Send notifications with idempotency keys to avoid duplicate alerts
                foreach (var offer in batch)
                {
                    try
                    {
                        var rfqNumber = offer.Rfq?.RfqNumber ?? "RFQ";
                        await _notificationService.CreateNotificationsForCompanyMembersAsync(
                            offer.SupplierCompanyId,
                            null,
                            NotificationType.OfferExpired,
                            "Offer Expired",
                            $"Your offer {offer.OfferNumber} for RFQ {rfqNumber} has expired due to validity period end.",
                            "Offer",
                            offer.Id,
                            $"offer_expired_{offer.Id}",
                            cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to send notification for expired offer {OfferId}", offer.Id);
                    }
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning(ex, "Concurrency conflict during offer expiry batch save. Some records were modified concurrently.");
                // Detach entries to clean up change tracker
                foreach (var entry in ex.Entries)
                {
                    await entry.ReloadAsync(cancellationToken);
                }
                break;
            }

            if (batch.Count < batchSize)
            {
                break;
            }
        }

        return totalExpired;
    }
}
