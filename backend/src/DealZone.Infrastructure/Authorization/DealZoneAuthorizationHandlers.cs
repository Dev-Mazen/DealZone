using DealZone.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace DealZone.Infrastructure.Authorization;

public class SystemAdminAuthorizationHandler : AuthorizationHandler<SystemAdminRequirement>
{
    private readonly ICurrentCompanyContext _companyContext;

    public SystemAdminAuthorizationHandler(ICurrentCompanyContext companyContext)
    {
        _companyContext = companyContext;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, SystemAdminRequirement requirement)
    {
        if (_companyContext.IsAuthenticated && _companyContext.IsSystemAdmin && _companyContext.IsUserActive)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

public class CompanyTypeAuthorizationHandler : AuthorizationHandler<CompanyTypeRequirement>
{
    private readonly ICurrentCompanyContext _companyContext;

    public CompanyTypeAuthorizationHandler(ICurrentCompanyContext companyContext)
    {
        _companyContext = companyContext;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, CompanyTypeRequirement requirement)
    {
        if (_companyContext.IsAuthenticated &&
            _companyContext.CompanyId.HasValue &&
            _companyContext.IsCompanyActive &&
            !_companyContext.IsCompanyDeleted &&
            _companyContext.CompanyType == requirement.ExpectedType)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

public class VerifiedCompanyAuthorizationHandler : AuthorizationHandler<VerifiedCompanyRequirement>
{
    private readonly ICurrentCompanyContext _companyContext;

    public VerifiedCompanyAuthorizationHandler(ICurrentCompanyContext companyContext)
    {
        _companyContext = companyContext;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, VerifiedCompanyRequirement requirement)
    {
        if (_companyContext.IsAuthenticated &&
            ((_companyContext.CompanyId.HasValue && _companyContext.CanPerformCommercialActivities) ||
             _companyContext.IsSystemAdmin))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

public class CompanyRoleAuthorizationHandler : AuthorizationHandler<CompanyRoleRequirement>
{
    private readonly ICurrentCompanyContext _companyContext;

    public CompanyRoleAuthorizationHandler(ICurrentCompanyContext companyContext)
    {
        _companyContext = companyContext;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, CompanyRoleRequirement requirement)
    {
        if (_companyContext.IsAuthenticated &&
            _companyContext.MemberRole.HasValue &&
            requirement.AllowedRoles.Contains(_companyContext.MemberRole.Value))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
