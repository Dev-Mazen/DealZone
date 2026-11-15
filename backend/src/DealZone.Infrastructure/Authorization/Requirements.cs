using DealZone.Domain.Companies;
using Microsoft.AspNetCore.Authorization;

namespace DealZone.Infrastructure.Authorization;

public class SystemAdminRequirement : IAuthorizationRequirement { }

public class CompanyTypeRequirement : IAuthorizationRequirement
{
    public CompanyType ExpectedType { get; }

    public CompanyTypeRequirement(CompanyType expectedType)
    {
        ExpectedType = expectedType;
    }
}

public class VerifiedCompanyRequirement : IAuthorizationRequirement { }

public class CompanyRoleRequirement : IAuthorizationRequirement
{
    public IReadOnlyList<CompanyRole> AllowedRoles { get; }

    public CompanyRoleRequirement(params CompanyRole[] allowedRoles)
    {
        AllowedRoles = allowedRoles;
    }
}

public static class CompanyActionRoleMap
{
    public static readonly IReadOnlyList<CompanyRole> CompanyManagement = [CompanyRole.Owner, CompanyRole.Admin];
    public static readonly IReadOnlyList<CompanyRole> Verification = [CompanyRole.Owner, CompanyRole.Admin];
    public static readonly IReadOnlyList<CompanyRole> BuyerProcurement = [CompanyRole.Owner, CompanyRole.Admin, CompanyRole.ProcurementManager];
    public static readonly IReadOnlyList<CompanyRole> SupplierSales = [CompanyRole.Owner, CompanyRole.Admin, CompanyRole.SalesManager];
    public static readonly IReadOnlyList<CompanyRole> CommercialView = [CompanyRole.Owner, CompanyRole.Admin, CompanyRole.ProcurementManager, CompanyRole.SalesManager, CompanyRole.Member];
}
