namespace DealZone.Domain.Common;

public record GovernorateInfo(string Key, string NameAr, string NameEn);

public static class EgyptGovernorates
{
    public static readonly IReadOnlyList<GovernorateInfo> All =
    [
        new("cairo", "القاهرة", "Cairo"),
        new("giza", "الجيزة", "Giza"),
        new("alexandria", "الإسكندرية", "Alexandria"),
        new("dakahlia", "الدقهلية", "Dakahlia"),
        new("red_sea", "البحر الأحمر", "Red Sea"),
        new("beheira", "البحيرة", "Beheira"),
        new("faiyum", "الفيوم", "Faiyum"),
        new("gharbia", "الغربية", "Gharbia"),
        new("ismailia", "الإسماعيلية", "Ismailia"),
        new("menofia", "المنوفية", "Menofia"),
        new("minya", "المنيا", "Minya"),
        new("qaliubiya", "القليوبية", "Qaliubiya"),
        new("new_valley", "الوادي الجديد", "New Valley"),
        new("suez", "السويس", "Suez"),
        new("aswan", "أسوان", "Aswan"),
        new("assiut", "أسيوط", "Assiut"),
        new("beni_suef", "بني سويف", "Beni Suef"),
        new("port_said", "بورسعيد", "Port Said"),
        new("damietta", "دمياط", "Damietta"),
        new("sharqia", "الشرقية", "Sharqia"),
        new("south_sinai", "جنوب سيناء", "South Sinai"),
        new("kafr_el_sheikh", "كفر الشيخ", "Kafr El Sheikh"),
        new("matrouh", "مطروح", "Matrouh"),
        new("luxor", "الأقصر", "Luxor"),
        new("qena", "قنا", "Qena"),
        new("north_sinai", "شمال سيناء", "North Sinai"),
        new("sohag", "سوهاج", "Sohag")
    ];

    private static string NormalizeArabic(string s)
    {
        return s.Replace("أ", "ا")
                .Replace("إ", "ا")
                .Replace("آ", "ا")
                .Replace("ة", "ه")
                .Replace("ى", "ي")
                .Trim();
    }

    public static bool IsValid(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return false;

        var clean = name.Trim();
        var cleanNorm = NormalizeArabic(clean);

        return All.Any(g =>
            string.Equals(g.Key, clean, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(g.NameEn, clean, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(g.NameAr, clean, StringComparison.OrdinalIgnoreCase) ||
            NormalizeArabic(g.NameAr).Equals(cleanNorm, StringComparison.OrdinalIgnoreCase));
    }

    public static string? NormalizeToCanonicalArabic(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return null;

        var clean = name.Trim();
        var cleanNorm = NormalizeArabic(clean);

        var match = All.FirstOrDefault(g =>
            string.Equals(g.Key, clean, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(g.NameEn, clean, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(g.NameAr, clean, StringComparison.OrdinalIgnoreCase) ||
            NormalizeArabic(g.NameAr).Equals(cleanNorm, StringComparison.OrdinalIgnoreCase));

        return match?.NameAr ?? clean;
    }
}
