using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Catalog.Validators;
using Xunit;

namespace DealZone.UnitTests.Catalog;

public class CatalogValidatorTests
{
    private readonly CreateCategoryRequestValidator _createCategoryValidator = new();
    private readonly UpdateCategoryRequestValidator _updateCategoryValidator = new();
    private readonly CreateUnitRequestValidator _createUnitValidator = new();
    private readonly UpdateUnitRequestValidator _updateUnitValidator = new();
    private readonly CreateMaterialRequestValidator _createMaterialValidator = new();
    private readonly UpdateMaterialRequestValidator _updateMaterialValidator = new();

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void CreateCategory_WithEmptyCode_ShouldFail(string? code)
    {
        var request = new CreateCategoryRequest(null, code!, "معادن", "Metals", null, null, 1);
        var result = _createCategoryValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCategoryRequest.Code));
    }

    [Fact]
    public void CreateCategory_WithCodeExceeding50Chars_ShouldFail()
    {
        var request = new CreateCategoryRequest(null, new string('C', 51), "معادن", "Metals", null, null, 1);
        var result = _createCategoryValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCategoryRequest.Code));
    }

    [Theory]
    [InlineData("", "Metals")]
    [InlineData("معادن", "")]
    [InlineData(null, "Metals")]
    [InlineData("معادن", null)]
    public void CreateCategory_WithMissingNames_ShouldFail(string? nameAr, string? nameEn)
    {
        var request = new CreateCategoryRequest(null, "METALS", nameAr!, nameEn!, null, null, 1);
        var result = _createCategoryValidator.Validate(request);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void CreateCategory_WithValidData_ShouldPass()
    {
        var request = new CreateCategoryRequest(null, "METALS", "معادن", "Metals", "وصف المعادن", "Description of metals", 1);
        var result = _createCategoryValidator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateUnit_WithValidData_ShouldPass()
    {
        var request = new CreateUnitRequest("TON", "طن", "Metric Ton", "طن", "t", 1);
        var result = _createUnitValidator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("", "طن", "Ton", "طن", "t")]
    [InlineData("TON", "", "Ton", "طن", "t")]
    [InlineData("TON", "طن", "", "طن", "t")]
    [InlineData("TON", "طن", "Ton", "", "t")]
    [InlineData("TON", "طن", "Ton", "طن", "")]
    public void CreateUnit_WithMissingRequiredFields_ShouldFail(string code, string nameAr, string nameEn, string symAr, string symEn)
    {
        var request = new CreateUnitRequest(code, nameAr, nameEn, symAr, symEn, 1);
        var result = _createUnitValidator.Validate(request);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void CreateMaterial_WithValidData_ShouldPass()
    {
        var request = new CreateMaterialRequest(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "STEEL-REBAR-12",
            "حديد تسليح 12 مم",
            "Steel Rebar 12mm",
            "حديد تسليح عالي المقاومة",
            "High strength deformed steel rebar",
            "{\"grade\":\"B500DWR\",\"diameter_mm\":12}");

        var result = _createMaterialValidator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateMaterial_WithEmptyCategoryOrUnit_ShouldFail()
    {
        var request = new CreateMaterialRequest(
            Guid.Empty,
            Guid.Empty,
            "MAT-1",
            "مادة",
            "Material",
            null,
            null,
            null);

        var result = _createMaterialValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateMaterialRequest.CategoryId));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateMaterialRequest.DefaultUnitId));
    }

    [Fact]
    public void CreateMaterial_WithAttributesExceeding4000Chars_ShouldFail()
    {
        var request = new CreateMaterialRequest(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "MAT-1",
            "مادة",
            "Material",
            null,
            null,
            new string('x', 4001));

        var result = _createMaterialValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateMaterialRequest.AttributesJson));
    }
}
