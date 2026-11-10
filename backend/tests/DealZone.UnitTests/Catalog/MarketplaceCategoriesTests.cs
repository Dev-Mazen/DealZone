using DealZone.Domain.Catalog;
using Xunit;

namespace DealZone.UnitTests.Catalog;

public class MarketplaceCategoriesTests
{
    [Theory]
    [InlineData("TEXTILES", true)]
    [InlineData("textiles", true)]
    [InlineData("FOOD", true)]
    [InlineData("food", true)]
    [InlineData("METALS", true)]
    [InlineData("metals", true)]
    [InlineData("CERAMICS", false)]
    [InlineData("CHEMICALS", false)]
    [InlineData("POLYMERS", false)]
    [InlineData("", false)]
    [InlineData("   ", false)]
    [InlineData(null, false)]
    public void IsSupported_ReturnsExpectedResult(string? code, bool expected)
    {
        var result = MarketplaceCategories.IsSupported(code);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void SupportedCodes_ContainsExactlyThreeOfficialCategories()
    {
        Assert.Equal(3, MarketplaceCategories.SupportedCodes.Length);
        Assert.Contains(MarketplaceCategories.Textiles, MarketplaceCategories.SupportedCodes);
        Assert.Contains(MarketplaceCategories.Food, MarketplaceCategories.SupportedCodes);
        Assert.Contains(MarketplaceCategories.Metals, MarketplaceCategories.SupportedCodes);
    }

    [Fact]
    public void Definitions_HasArabicAndEnglishMetadataForEverySupportedCategory()
    {
        foreach (var code in MarketplaceCategories.SupportedCodes)
        {
            Assert.True(MarketplaceCategories.Definitions.ContainsKey(code));
            var (nameAr, nameEn, descAr, descEn, order) = MarketplaceCategories.Definitions[code];
            Assert.False(string.IsNullOrWhiteSpace(nameAr));
            Assert.False(string.IsNullOrWhiteSpace(nameEn));
            Assert.False(string.IsNullOrWhiteSpace(descAr));
            Assert.False(string.IsNullOrWhiteSpace(descEn));
            Assert.True(order > 0);
        }
    }
}

