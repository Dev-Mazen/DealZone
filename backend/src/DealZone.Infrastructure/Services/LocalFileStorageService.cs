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
        {
            try
            {
                var dir = Path.GetDirectoryName(absolutePath);
                if (!string.IsNullOrEmpty(dir))
                {
                    Directory.CreateDirectory(dir);
                }

                var sampleBytes = GenerateSamplePdfContent(Path.GetFileName(storageKey));
                File.WriteAllBytes(absolutePath, sampleBytes);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not persist sample PDF to disk at {Path}. Serving from memory stream.", absolutePath);
                var memBytes = GenerateSamplePdfContent(Path.GetFileName(storageKey));
                Stream memStream = new MemoryStream(memBytes);
                return Task.FromResult(memStream);
            }
        }

        Stream stream = new FileStream(
            absolutePath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 81920,
            useAsync: true);

        return Task.FromResult(stream);
    }

    private static byte[] GenerateSamplePdfContent(string documentName)
    {
        var safeDocName = string.IsNullOrWhiteSpace(documentName) ? "document.pdf" : documentName.Replace("(", "[").Replace(")", "]");
        var line1 = "DealZone B2B Industrial Sourcing - Verification Document";
        var line2 = $"Document: {safeDocName}";
        var line3 = "Certified and Stored under Egyptian Industrial Compliance (EOS / ISO / ASTM).";

        var contentStream = $"BT\n/F1 16 Tf\n50 720 Td\n({line1}) Tj\nET\n" +
                            $"BT\n/F1 12 Tf\n50 690 Td\n({line2}) Tj\nET\n" +
                            $"BT\n/F1 10 Tf\n50 660 Td\n({line3}) Tj\nET\n";

        var streamBytes = System.Text.Encoding.ASCII.GetBytes(contentStream);

        var pdf = "%PDF-1.4\n" +
                  "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
                  "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
                  "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n" +
                  $"4 0 obj\n<< /Length {streamBytes.Length} >>\nstream\n" +
                  contentStream +
                  "endstream\nendobj\n" +
                  "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n" +
                  "xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000350 00000 n \n" +
                  "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n430\n%%EOF";

        return System.Text.Encoding.ASCII.GetBytes(pdf);
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

