using System.Security.Claims;
using DealZone.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace DealZone.Infrastructure.Services;

public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IServiceProvider _serviceProvider;

    public CurrentUser(IHttpContextAccessor httpContextAccessor, IServiceProvider serviceProvider)
    {
        _httpContextAccessor = httpContextAccessor;
        _serviceProvider = serviceProvider;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    private ICurrentCompanyContext? CompanyContext =>
        _httpContextAccessor.HttpContext != null
            ? _serviceProvider.GetService<ICurrentCompanyContext>()
            : null;

    public Guid? Id
    {
        get
        {
            var idClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("sub")?.Value;
            return Guid.TryParse(idClaim, out var id) ? id : null;
        }
    }

    public Guid? CompanyId => CompanyContext?.CompanyId;

    public string? Email => User?.FindFirst(ClaimTypes.Email)?.Value ?? User?.FindFirst("email")?.Value;

    public string? Role => CompanyContext?.MemberRole?.ToString();

    public bool IsAuthenticated => CompanyContext?.IsAuthenticated ?? (User?.Identity?.IsAuthenticated == true);

    public bool IsSystemAdmin => CompanyContext?.IsSystemAdmin ?? false;
}

