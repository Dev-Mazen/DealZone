using DealZone.Application.Common.Interfaces;
using DealZone.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DealZone.Infrastructure.Services;

/// <summary>
/// Stores verification documents in a private, non-web-root directory on the local filesystem.
/// This implementation is suitable for development and single-server pilots.
/// Replace with a blob-storage implementation for production scale-out.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly string _rootPath;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(
        IOptions<FileStorageSettings> options,
        ILogger<LocalFileStorageService> logger)
    {
        _logger = logger;

        // Resolve relative paths relative to the current working directory
        var configured = options.Value.RootPath;
        _rootPath = Path.IsPathRooted(configured)
            ? configured
            : Path.GetFullPath(configured);
    }

    public async Task<string> StoreAsync(
        Guid companyId,
        string documentType,
        string extension,
        Stream content,
        CancellationToken cancellationToken = default)
    {
        // Build a storage key that includes company scope
        var storageKey = Path.Combine(
            companyId.ToString(),
            documentType,
            $"{Guid.NewGuid()}{extension}");

        var absolutePath = GetAbsolutePath(storageKey);

        Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);

        await using var fileStream = new FileStream(
            absolutePath,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 81920,
            useAsync: true);

        await content.CopyToAsync(fileStream, cancellationToken);

        _logger.LogInformation("Stored verification document at key {StorageKey}", storageKey);

        // Return forward-slash key for cross-platform consistency in DB
        return storageKey.Replace(Path.DirectorySeparatorChar, '/');
    }

    public Task<Stream> RetrieveAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var absolutePath = GetAbsolutePath(storageKey);

        if (!File.Exists(absolutePath))
            throw new FileNotFoundException($"Document not found.", absolutePath);

        Stream stream = new FileStream(
            absolutePath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 81920,
            useAsync: true);

        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var absolutePath = GetAbsolutePath(storageKey);

        if (File.Exists(absolutePath))
        {
            File.Delete(absolutePath);
            _logger.LogInformation("Deleted stored document at key {StorageKey}", storageKey);
        }

        return Task.CompletedTask;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /// <summary>
    /// Converts a relative storage key to an absolute filesystem path and guards
    /// against path-traversal attacks.
    /// </summary>
    private string GetAbsolutePath(string storageKey)
    {
        // Normalise separators to host-OS separator
        var normalized = storageKey.Replace('/', Path.DirectorySeparatorChar)
                                   .Replace('\\', Path.DirectorySeparatorChar);

        var absolutePath = Path.GetFullPath(Path.Combine(_rootPath, normalized));

        // Guard: the resolved path must still be inside _rootPath
        if (!absolutePath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Storage key resolves outside the designated storage root.");

        return absolutePath;
    }
}

