using DealZone.Domain.Companies;
using DealZone.Domain.Identity;

namespace DealZone.UnitTests.Domain;

public class CompanyInvariantsTests
{
    [Theory]
    [InlineData(CompanyVerificationStatus.Pending, false)]
    [InlineData(CompanyVerificationStatus.UnderReview, false)]
    [InlineData(CompanyVerificationStatus.Rejected, false)]
    [InlineData(CompanyVerificationStatus.Approved, true)]
    public void CanPerformCommercialActivities_ShouldDependOnApprovedVerification(
        CompanyVerificationStatus status,
        bool expectedCanPerform)
    {
        var company = new Company
        {
            LegalName = "El Marwa Metals",
            TradeName = "El Marwa",
            IndustrySector = "Metallurgy",
            City = "10th of Ramadan",
            Governorate = "Sharqia",
            VerificationStatus = status,
            IsActive = true,
            IsDeleted = false
        };

        Assert.Equal(expectedCanPerform, company.CanPerformCommercialActivities);
    }

    [Fact]
    public void CanPerformCommercialActivities_ShouldBeFalseWhenCompanyInactiveOrDeleted()
    {
        var approvedButInactiveCompany = new Company
        {
            VerificationStatus = CompanyVerificationStatus.Approved,
            IsActive = false,
            IsDeleted = false
        };

        var approvedButDeletedCompany = new Company
        {
            VerificationStatus = CompanyVerificationStatus.Approved,
            IsActive = true,
            IsDeleted = true
        };

        Assert.False(approvedButInactiveCompany.CanPerformCommercialActivities);
        Assert.False(approvedButDeletedCompany.CanPerformCommercialActivities);
    }

    [Fact]
    public void CompanyType_ShouldNotHaveDefaultBuyer_AndRequiresExplicitAssignment()
    {
        var company = new Company();
        Assert.Equal((CompanyType)0, company.CompanyType);

        company.CompanyType = CompanyType.Buyer;
        Assert.True(company.HasBuyerCapability());
        Assert.False(company.HasSupplierCapability());

        company.CompanyType = CompanyType.Supplier;
        Assert.False(company.HasBuyerCapability());
        Assert.True(company.HasSupplierCapability());
    }

    [Fact]
    public void CompanyCapabilityExtensions_ThrowAppropriateExceptions()
    {
        var buyer = new Company { CompanyType = CompanyType.Buyer };
        buyer.AssertCanOperateAsBuyer();
        Assert.Throws<DealZone.Domain.Exceptions.ForbiddenException>(() => buyer.AssertCanOperateAsSupplier());

        var supplier = new Company { CompanyType = CompanyType.Supplier };
        supplier.AssertCanOperateAsSupplier();
        Assert.Throws<DealZone.Domain.Exceptions.ForbiddenException>(() => supplier.AssertCanOperateAsBuyer());
    }
}

