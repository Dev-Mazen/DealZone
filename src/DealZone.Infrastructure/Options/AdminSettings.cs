namespace DealZone.Infrastructure.Options;

public class AdminSettings
{
    public const string SectionName = "AdminSettings";

    /// <summary>
    /// When non-empty, the seeder will promote the user with this email address to system admin.
    /// Leave blank in production. Intended for development bootstrapping only.
    /// </summary>
    public string SeedAdminEmail { get; set; } = string.Empty;
}

