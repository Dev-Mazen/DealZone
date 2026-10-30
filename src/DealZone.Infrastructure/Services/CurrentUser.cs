using System.Security.Claims;
using DealZone.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace DealZone.Infrastructure.Services;

public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? Id
    {
        get
        {
            var idClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("sub")?.Value
                ?? User?.FindFirst("uid")?.Value;

            return Guid.TryParse(idClaim, out var id) ? id : null;
        }
    }

    public Guid? CompanyId
    {
        get
        {
            var companyClaim = User?.FindFirst("company_id")?.Value
                ?? User?.FindFirst("CompanyId")?.Value;

            return Guid.TryParse(companyClaim, out var companyId) ? companyId : null;
        }
    }

    public string? Email => User?.FindFirst(ClaimTypes.Email)?.Value ?? User?.FindFirst("email")?.Value;

    public string? Role => User?.FindFirst(ClaimTypes.Role)?.Value ?? User?.FindFirst("role")?.Value;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public bool IsSystemAdmin => (User?.IsInRole("SystemAdmin") ?? false)
        || User?.FindFirst("is_system_admin")?.Value == "true";
}

