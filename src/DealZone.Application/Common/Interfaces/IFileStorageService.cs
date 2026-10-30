namespace DealZone.Application.Common.Interfaces;

/// <summary>
/// Abstraction for persisting and retrieving verification document files.
/// Implementations must store files outside the web root and never return public URLs.
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Stores a document stream and returns an opaque storage key.
    /// </summary>
    Task<string> StoreAsync(
        Guid companyId,
        string documentType,
        string extension,
        Stream content,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Opens a read stream for the given storage key.
    /// </summary>
    Task<Stream> RetrieveAsync(string storageKey, CancellationToken cancellationToken = default);

    /// <summary>
    /// Permanently deletes the stored file. No-op if the key does not exist.
    /// </summary>
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default);
}

