using DealZone.Domain.Exceptions;

namespace DealZone.Domain.Companies;

public static class CompanyCapabilityExtensions
{
    public static bool HasBuyerCapability(this Company company) =>
        company.CompanyType == CompanyType.Buyer;

    public static bool HasSupplierCapability(this Company company) =>
        company.CompanyType == CompanyType.Supplier;

    public static void AssertCanOperateAsBuyer(this Company company)
    {
        if (!company.HasBuyerCapability())
        {
            throw new ForbiddenException("Company has Supplier capability only and cannot perform Buyer operations.");
        }
    }

    public static void AssertCanOperateAsSupplier(this Company company)
    {
        if (!company.HasSupplierCapability())
        {
            throw new ForbiddenException("Company has Buyer capability only and cannot perform Supplier operations.");
        }
    }
}
