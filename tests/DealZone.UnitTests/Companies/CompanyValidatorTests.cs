using DealZone.Application.Companies.DTOs;
using DealZone.Application.Companies.Validators;

namespace DealZone.UnitTests.Companies;

public class CompanyValidatorTests
{
    private readonly CreateCompanyRequestValidator _createValidator = new();
    private readonly UpdateCompanyProfileRequestValidator _updateValidator = new();

    [Fact]
    public async Task CreateCompanyRequestValidator_ValidRequest_ShouldPass()
    {
        var request = new CreateCompanyRequest(
            LegalName: "Alexandria Steel Corp",
            TradeName: "AlexSteel",
            IndustrySector: "Metals & Mining",
            City: "Alexandria",
            Governorate: "Alexandria",
            Description: "Leading steel rolling supplier",
            Website: "https://alexsteel.com.eg",
            TaxIdNumber: "123-456-789",
            CommercialRegistrationNumber: "987654",
            CorporateEmail: "procurement@alexsteel.com.eg",
            CorporatePhone: "+2034000100",
            AddressLine1: "Industrial Zone 4, Borg El Arab",
            AddressLine2: null,
            PostalCode: "21934");

        var result = await _createValidator.ValidateAsync(request);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("", "Company legal name is required.")]
    public async Task CreateCompanyRequestValidator_MissingLegalName_ShouldFail(string legalName, string expectedMessage)
    {
        var request = new CreateCompanyRequest(
            LegalName: legalName,
            TradeName: "AlexSteel",
            IndustrySector: "Metals",
            City: "Alexandria",
            Governorate: "Alexandria",
            Description: null,
            Website: null,
            TaxIdNumber: "123-456-789",
            CommercialRegistrationNumber: "987654",
            CorporateEmail: "procurement@alexsteel.com.eg",
            CorporatePhone: "+2034000100",
            AddressLine1: "Borg El Arab",
            AddressLine2: null,
            PostalCode: null);

        var result = await _createValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains(expectedMessage));
    }

    [Fact]
    public async Task CreateCompanyRequestValidator_InvalidEmail_ShouldFail()
    {
        var request = new CreateCompanyRequest(
            LegalName: "Alex Steel",
            TradeName: "AlexSteel",
            IndustrySector: "Metals",
            City: "Alexandria",
            Governorate: "Alexandria",
            Description: null,
            Website: null,
            TaxIdNumber: "123-456-789",
            CommercialRegistrationNumber: "987654",
            CorporateEmail: "not-an-email",
            CorporatePhone: "+2034000100",
            AddressLine1: "Borg El Arab",
            AddressLine2: null,
            PostalCode: null);

        var result = await _createValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCompanyRequest.CorporateEmail));
    }

    [Fact]
    public async Task UpdateCompanyProfileRequestValidator_ValidRequest_ShouldPass()
    {
        var request = new UpdateCompanyProfileRequest(
            TradeName: "Alexandria Steel Updated",
            City: "New Borg El Arab",
            Governorate: "Alexandria",
            Description: "Updated description",
            Website: "https://new.alexsteel.com.eg");

        var result = await _updateValidator.ValidateAsync(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task UpdateCompanyProfileRequestValidator_EmptyTradeName_ShouldFail()
    {
        var request = new UpdateCompanyProfileRequest(
            TradeName: "",
            City: "Alexandria",
            Governorate: "Alexandria",
            Description: null,
            Website: null);

        var result = await _updateValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateCompanyProfileRequest.TradeName));
    }
}

