namespace DealZone.Domain.Catalog;

/// <summary>
/// Authoritative definition of the three official marketplace categories supported by DealZone:
/// 1. Textiles (منسوجات / TEXTILES)
/// 2. Food (أغذية / FOOD)
/// 3. Metals (معادن / METALS)
/// </summary>
public static class MarketplaceCategories
{
    public const string Textiles = "TEXTILES";
    public const string Food = "FOOD";
    public const string Metals = "METALS";

    public static readonly string[] SupportedCodes = [Textiles, Food, Metals];

    public static readonly IReadOnlyDictionary<string, (string NameAr, string NameEn, string DescriptionAr, string DescriptionEn, int DisplayOrder)> Definitions =
        new Dictionary<string, (string, string, string, string, int)>(StringComparer.OrdinalIgnoreCase)
        {
            [Textiles] = (
                "منسوجات",
                "Textiles",
                "الألياف والخيوط والأقمشة ومستلزمات الصناعات النسيجية",
                "Industrial fibers, yarns, fabrics, and textile manufacturing inputs",
                1),
            [Food] = (
                "أغذية",
                "Food",
                "المواد الخام الزراعية والغذائية ومدخلات التصنيع الغذائي والتمويني",
                "Raw agricultural commodities, food ingredients, and food processing inputs",
                2),
            [Metals] = (
                "معادن",
                "Metals",
                "المعادن الصناعية والصلب وحديد التسليح والقطاعات والسبائك",
                "Industrial metals, steel, rebar, structural sections, and alloys",
                3)
        };

    public static bool IsSupported(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return false;
        return SupportedCodes.Contains(code.Trim().ToUpperInvariant());
    }
}

