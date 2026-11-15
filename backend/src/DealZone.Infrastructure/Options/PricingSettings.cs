namespace DealZone.Infrastructure.Options;

public class PricingSettings
{
    public const string SectionName = "PricingSettings";
    public decimal VatRate { get; set; } = 0.14m;
}
