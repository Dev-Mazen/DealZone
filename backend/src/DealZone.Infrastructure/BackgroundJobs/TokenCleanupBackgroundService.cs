using DealZone.Application.Common.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DealZone.Infrastructure.BackgroundJobs;

/// <summary>
/// Hosted service running periodic refresh token cleanup.
/// </summary>
public class TokenCleanupBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<BackgroundJobOptions> _options;
    private readonly ILogger<TokenCleanupBackgroundService> _logger;

    public TokenCleanupBackgroundService(
        IServiceScopeFactory scopeFactory,
        IOptions<BackgroundJobOptions> options,
        ILogger<TokenCleanupBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Value.EnableTokenCleanupJob)
        {
            _logger.LogInformation("Token cleanup background job is disabled by configuration.");
            return;
        }

        _logger.LogInformation("Token cleanup background worker started with interval {Interval} hours.",
            _options.Value.TokenCleanupIntervalHours);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<ITokenCleanupProcessor>();
                await processor.CleanupExpiredTokensAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred during token cleanup background run.");
            }

            var delayHours = Math.Max(1, _options.Value.TokenCleanupIntervalHours);
            try
            {
                await Task.Delay(TimeSpan.FromHours(delayHours), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("Token cleanup background worker stopped.");
    }
}
