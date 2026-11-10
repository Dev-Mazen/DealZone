namespace DealZone.Infrastructure.Options;

public class SmtpSettings
{
    public const string SectionName = "SmtpSettings";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public bool EnableSsl { get; set; } = true;
    public string FromEmail { get; set; } = "noreply@dealzone.eg";
    public string FromName { get; set; } = "DealZone Marketplace";
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";
    public int TimeoutSeconds { get; set; } = 15;
    public int MaxRetries { get; set; } = 2;
}
