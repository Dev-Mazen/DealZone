using System.Security.Claims;
using DealZone.Application.Common.Interfaces;
using DealZone.Domain.Companies;
using DealZone.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace DealZone.Infrastructure.Services;

public class CurrentCompanyContext : ICurrentCompanyContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly DealZoneDbContext _dbContext;

    private bool _loaded;
    private Guid? _userId;
    private bool _isAuthenticated;
    private bool _isSystemAdmin;
    private bool _isUserActive;
    private Guid? _companyId;
    private string? _legalName;
    private string? _tradeName;
    private CompanyType? _companyType;
    private CompanyRole? _memberRole;
    private CompanyVerificationStatus? _verificationStatus;
    private bool _isCompanyActive;
    private bool _isCompanyDeleted;
    private bool _canPerformCommercialActivities;

    public CurrentCompanyContext(IHttpContextAccessor httpContextAccessor, DealZoneDbContext dbContext)
    {
        _httpContextAccessor = httpContextAccessor;
        _dbContext = dbContext;
    }

    private void EnsureLoaded()
    {
        if (_loaded) return;
        _loaded = true;

        var user = _httpContextAccessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true)
        {
            return;
        }

        var idClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? user.FindFirst("sub")?.Value
            ?? user.FindFirst("uid")?.Value;

        if (!Guid.TryParse(idClaim, out var userId))
        {
            return;
        }

        _userId = userId;
        _isAuthenticated = true;

        var dbUser = _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId && u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.IsSystemAdmin,
                u.IsActive,
                Membership = _dbContext.CompanyMembers
                    .AsNoTracking()
                    .Where(m => m.UserId == u.Id && m.IsActive)
                    .Select(m => new
                    {
                        m.CompanyId,
                        m.Role,
                        m.Company.LegalName,
                        m.Company.TradeName,
                        m.Company.CompanyType,
                        m.Company.VerificationStatus,
                        m.Company.IsActive,
                        m.Company.IsDeleted,
                        CanPerformCommercialActivities = m.Company.IsActive && !m.Company.IsDeleted && m.Company.VerificationStatus == CompanyVerificationStatus.Approved
                    })
                    .FirstOrDefault()
            })
            .FirstOrDefault();

        if (dbUser != null)
        {
            _isSystemAdmin = dbUser.IsSystemAdmin;
            _isUserActive = dbUser.IsActive;

            if (dbUser.Membership != null)
            {
                _companyId = dbUser.Membership.CompanyId;
                _memberRole = dbUser.Membership.Role;
                _legalName = dbUser.Membership.LegalName;
                _tradeName = dbUser.Membership.TradeName;
                _companyType = dbUser.Membership.CompanyType;
                _verificationStatus = dbUser.Membership.VerificationStatus;
                _isCompanyActive = dbUser.Membership.IsActive;
                _isCompanyDeleted = dbUser.Membership.IsDeleted;
                _canPerformCommercialActivities = dbUser.Membership.CanPerformCommercialActivities;
            }
        }
    }

    public async Task EnsureLoadedAsync(CancellationToken cancellationToken = default)
    {
        if (_loaded) return;
        _loaded = true;

        var user = _httpContextAccessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true)
        {
            return;
        }

        var idClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? user.FindFirst("sub")?.Value
            ?? user.FindFirst("uid")?.Value;

        if (!Guid.TryParse(idClaim, out var userId))
        {
            return;
        }

        _userId = userId;
        _isAuthenticated = true;

        var dbUser = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId && u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.IsSystemAdmin,
                u.IsActive,
                Membership = _dbContext.CompanyMembers
                    .AsNoTracking()
                    .Where(m => m.UserId == u.Id && m.IsActive)
                    .Select(m => new
                    {
                        m.CompanyId,
                        m.Role,
                        m.Company.LegalName,
                        m.Company.TradeName,
                        m.Company.CompanyType,
                        m.Company.VerificationStatus,
                        m.Company.IsActive,
                        m.Company.IsDeleted,
                        CanPerformCommercialActivities = m.Company.IsActive && !m.Company.IsDeleted && m.Company.VerificationStatus == CompanyVerificationStatus.Approved
                    })
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (dbUser != null)
        {
            _isSystemAdmin = dbUser.IsSystemAdmin;
            _isUserActive = dbUser.IsActive;

            if (dbUser.Membership != null)
            {
                _companyId = dbUser.Membership.CompanyId;
                _memberRole = dbUser.Membership.Role;
                _legalName = dbUser.Membership.LegalName;
                _tradeName = dbUser.Membership.TradeName;
                _companyType = dbUser.Membership.CompanyType;
                _verificationStatus = dbUser.Membership.VerificationStatus;
                _isCompanyActive = dbUser.Membership.IsActive;
                _isCompanyDeleted = dbUser.Membership.IsDeleted;
                _canPerformCommercialActivities = dbUser.Membership.CanPerformCommercialActivities;
            }
        }
    }

    public Guid? UserId { get { EnsureLoaded(); return _userId; } }
    public bool IsAuthenticated { get { EnsureLoaded(); return _isAuthenticated; } }
    public bool IsSystemAdmin { get { EnsureLoaded(); return _isSystemAdmin; } }
    public bool IsUserActive { get { EnsureLoaded(); return _isUserActive; } }

    public Guid? CompanyId { get { EnsureLoaded(); return _companyId; } }
    public string? LegalName { get { EnsureLoaded(); return _legalName; } }
    public string? TradeName { get { EnsureLoaded(); return _tradeName; } }
    public CompanyType? CompanyType { get { EnsureLoaded(); return _companyType; } }
    public CompanyRole? MemberRole { get { EnsureLoaded(); return _memberRole; } }
    public CompanyVerificationStatus? VerificationStatus { get { EnsureLoaded(); return _verificationStatus; } }
    public bool IsCompanyActive { get { EnsureLoaded(); return _isCompanyActive; } }
    public bool IsCompanyDeleted { get { EnsureLoaded(); return _isCompanyDeleted; } }
    public bool CanPerformCommercialActivities { get { EnsureLoaded(); return _canPerformCommercialActivities; } }
}
