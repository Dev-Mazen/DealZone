namespace DealZone.Api.Options;

public class CorsOptions
{
    public const string SectionName = "CorsSettings";
    public const string PolicyName = "DealZoneCorsPolicy";

    public string[] AllowedOrigins { get; set; } = [];
}
