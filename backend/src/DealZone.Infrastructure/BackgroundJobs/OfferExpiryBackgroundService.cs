using DealZone.Application.Common.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DealZone.Infrastructure.BackgroundJobs;

/// <summary>
/// Hosted service running periodic offer expiration in bounded batches.
/// </summary>
public class OfferExpiryBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<BackgroundJobOptions> _options;
    private readonly ILogger<OfferExpiryBackgroundService> _logger;

    public OfferExpiryBackgroundService(
        IServiceScopeFactory scopeFactory,
        IOptions<BackgroundJobOptions> options,
        ILogger<OfferExpiryBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Value.EnableOfferExpiryJob)
        {
            _logger.LogInformation("Offer expiry background job is disabled by configuration.");
            return;
        }

        _logger.LogInformation("Offer expiry background worker started with interval {Interval}s.",
            _options.Value.OfferExpiryIntervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<IOfferExpiryProcessor>();
                await processor.ProcessExpiredOffersAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Graceful shutdown requested
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred during offer expiry background run.");
            }

            var delaySeconds = Math.Max(5, _options.Value.OfferExpiryIntervalSeconds);
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(delaySeconds), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("Offer expiry background worker stopped.");
    }
}
