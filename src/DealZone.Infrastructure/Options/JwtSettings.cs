namespace DealZone.Infrastructure.Options;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string SecretKey { get; set; } = "DealZoneEnterpriseSecretKeyForJwtAuthenticationTokens2026!#EgyptRawMaterialMarketplace";
    public string Issuer { get; set; } = "DealZone.Api";
    public string Audience { get; set; } = "DealZone.Clients";
    public int AccessTokenExpirationMinutes { get; set; } = 60;
    public int RefreshTokenExpirationDays { get; set; } = 30;
}

