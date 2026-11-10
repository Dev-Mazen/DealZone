using DealZone.Infrastructure.Options;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace DealZone.Api.Infrastructure;

public class FileStorageHealthCheck : IHealthCheck
{
    private readonly string _rootPath;

    public FileStorageHealthCheck(IOptions<FileStorageSettings> options)
    {
        var configured = options.Value.RootPath;
        _rootPath = Path.IsPathRooted(configured)
            ? configured
            : Path.GetFullPath(configured);
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!Directory.Exists(_rootPath))
            {
                Directory.CreateDirectory(_rootPath);
            }

            var testFile = Path.Combine(_rootPath, $".healthcheck-{Guid.NewGuid():N}.tmp");
            File.WriteAllText(testFile, "health-check");
            File.Delete(testFile);

            return Task.FromResult(HealthCheckResult.Healthy($"Storage root '{_rootPath}' is accessible and writable."));
        }
        catch (Exception ex)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy($"Storage root '{_rootPath}' is not accessible or writable.", ex));
        }
    }
}
