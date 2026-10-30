namespace DealZone.Infrastructure.Options;

public class FileStorageSettings
{
    public const string SectionName = "FileStorage";

    /// <summary>
    /// Absolute or relative path to the private storage directory.
    /// Must NOT be under wwwroot. Defaults to a path outside the web root.
    /// </summary>
    public string RootPath { get; set; } = "private-storage/verification-documents";
}

