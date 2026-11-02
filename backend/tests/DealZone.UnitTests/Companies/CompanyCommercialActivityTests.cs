using DealZone.Domain.Companies;

namespace DealZone.UnitTests.Companies;

public class CompanyCommercialActivityTests
{
    [Fact]
    public void NewCompany_VerificationStatusPending_CannotPerformCommercialActivities()
    {
        var company = new Company
        {
            LegalName = "Delta Plastics SAE",
            TradeName = "DeltaPlast",
            VerificationStatus = CompanyVerificationStatus.Pending,
            IsActive = true,
            IsDeleted = false
        };

        Assert.False(company.CanPerformCommercialActivities);
    }

    [Fact]
    public void ApprovedCompany_ActiveAndNotDeleted_CanPerformCommercialActivities()
    {
        var company = new Company
        {
            LegalName = "Delta Plastics SAE",
            TradeName = "DeltaPlast",
            VerificationStatus = CompanyVerificationStatus.Approved,
            IsActive = true,
            IsDeleted = false
        };

        Assert.True(company.CanPerformCommercialActivities);
    }

    [Fact]
    public void ApprovedCompany_WhenInactive_CannotPerformCommercialActivities()
    {
        var company = new Company
        {
            LegalName = "Delta Plastics SAE",
            TradeName = "DeltaPlast",
            VerificationStatus = CompanyVerificationStatus.Approved,
            IsActive = false,
            IsDeleted = false
        };

        Assert.False(company.CanPerformCommercialActivities);
    }

    [Fact]
    public void ApprovedCompany_WhenSoftDeleted_CannotPerformCommercialActivities()
    {
        var company = new Company
        {
            LegalName = "Delta Plastics SAE",
            TradeName = "DeltaPlast",
            VerificationStatus = CompanyVerificationStatus.Approved,
            IsActive = true,
            IsDeleted = true
        };

        Assert.False(company.CanPerformCommercialActivities);
    }

    [Fact]
    public void RejectedCompany_CannotPerformCommercialActivities()
    {
        var company = new Company
        {
            LegalName = "Delta Plastics SAE",
            TradeName = "DeltaPlast",
            VerificationStatus = CompanyVerificationStatus.Rejected,
            IsActive = true,
            IsDeleted = false
        };

        Assert.False(company.CanPerformCommercialActivities);
    }
}

