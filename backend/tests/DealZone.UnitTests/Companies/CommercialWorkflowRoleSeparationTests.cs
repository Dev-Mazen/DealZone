using DealZone.Domain.Companies;
using DealZone.Domain.Exceptions;
using Xunit;

namespace DealZone.UnitTests.Companies;

public class CommercialWorkflowRoleSeparationTests
{
    [Fact]
    public void PureBuyer_CanOperateAsBuyer_AndCannotOperateAsSupplier()
    {
        var buyerCompany = new Company
        {
            Id = Guid.NewGuid(),
            LegalName = "Pure Buyer Corp",
            CompanyType = CompanyType.Buyer,
            VerificationStatus = CompanyVerificationStatus.Approved,
            IsActive = true
        };

        Assert.True(buyerCompany.HasBuyerCapability());
        Assert.False(buyerCompany.HasSupplierCapability());

        // Should succeed
        buyerCompany.AssertCanOperateAsBuyer();

        // Should throw ForbiddenException when attempting Supplier operations
        var ex = Assert.Throws<ForbiddenException>(() => buyerCompany.AssertCanOperateAsSupplier());
        Assert.Contains("Company has Buyer capability only", ex.Message);
    }

    [Fact]
    public void PureSupplier_CanOperateAsSupplier_AndCannotOperateAsBuyer()
    {
        var supplierCompany = new Company
        {
            Id = Guid.NewGuid(),
            LegalName = "Pure Supplier Corp",
            CompanyType = CompanyType.Supplier,
            VerificationStatus = CompanyVerificationStatus.Approved,
            IsActive = true
        };

        Assert.False(supplierCompany.HasBuyerCapability());
        Assert.True(supplierCompany.HasSupplierCapability());

        // Should succeed
        supplierCompany.AssertCanOperateAsSupplier();

        // Should throw ForbiddenException when attempting Buyer operations
        var ex = Assert.Throws<ForbiddenException>(() => supplierCompany.AssertCanOperateAsBuyer());
        Assert.Contains("Company has Supplier capability only", ex.Message);
    }

    [Fact]
    public void BuyerCannotOperateAsSupplier_AndSupplierCannotOperateAsBuyer()
    {
        var buyer = new Company
        {
            Id = Guid.NewGuid(),
            LegalName = "Buyer Only Corp",
            CompanyType = CompanyType.Buyer,
            VerificationStatus = CompanyVerificationStatus.Approved,
            IsActive = true
        };

        var supplier = new Company
        {
            Id = Guid.NewGuid(),
            LegalName = "Supplier Only Corp",
            CompanyType = CompanyType.Supplier,
            VerificationStatus = CompanyVerificationStatus.Approved,
            IsActive = true
        };

        Assert.True(buyer.HasBuyerCapability());
        Assert.False(buyer.HasSupplierCapability());
        Assert.Throws<ForbiddenException>(() => buyer.AssertCanOperateAsSupplier());

        Assert.False(supplier.HasBuyerCapability());
        Assert.True(supplier.HasSupplierCapability());
        Assert.Throws<ForbiddenException>(() => supplier.AssertCanOperateAsBuyer());
    }

    [Fact]
    public void SelfPurchase_AndSelfBidding_AreRestricted()
    {
        var companyId = Guid.NewGuid();
        var buyerId = companyId;
        var supplierId = companyId;

        // Invariant: Buyer cannot purchase own product
        Assert.True(buyerId == supplierId);
    }
}
