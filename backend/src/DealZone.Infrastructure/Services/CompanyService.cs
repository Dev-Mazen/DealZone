using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Application.Companies.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Exceptions;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DealZone.Infrastructure.Services;

public class CompanyService : ICompanyService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IDateTimeProvider _dateTimeProvider;

    public CompanyService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        IDateTimeProvider dateTimeProvider)
    {
        _context = context;
        _currentUser = currentUser;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<CompanyResponse> CreateCompanyAsync(CreateCompanyRequest request, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id;
        if (!userId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var existingMembership = await _context.CompanyMembers
            .AnyAsync(m => m.UserId == userId.Value && m.IsActive, cancellationToken);

        if (existingMembership)
        {
            throw new ConflictException("User already belongs to an active company.");
        }

        var crLower = request.CommercialRegistrationNumber.Trim();
        var taxLower = request.TaxIdNumber.Trim();

        var regConflict = await _context.CompanyContactDetails
            .AnyAsync(c => c.CommercialRegistrationNumber == crLower || c.TaxIdNumber == taxLower, cancellationToken);

        if (regConflict)
        {
            throw new ConflictException("A company with this Commercial Registration or Tax ID already exists.");
        }

        var companyType = CompanyType.Both;
        if (!string.IsNullOrWhiteSpace(request.CompanyType) &&
            Enum.TryParse<CompanyType>(request.CompanyType, true, out var parsedType))
        {
            companyType = parsedType;
        }

        var company = new Company
        {
            CompanyType = companyType,
            LegalName = request.LegalName.Trim(),
            TradeName = request.TradeName.Trim(),
            IndustrySector = request.IndustrySector.Trim(),
            City = request.City.Trim(),
            Governorate = request.Governorate.Trim(),
            Description = request.Description?.Trim(),
            Website = request.Website?.Trim(),
            VerificationStatus = CompanyVerificationStatus.Pending,
            PrimaryContactUserId = userId.Value,
            IsActive = true
        };

        var contactDetails = new CompanyContactDetails
        {
            CompanyId = company.Id,
            Company = company,
            TaxIdNumber = taxLower,
            CommercialRegistrationNumber = crLower,
            CorporateEmail = request.CorporateEmail.Trim().ToLowerInvariant(),
            CorporatePhone = request.CorporatePhone.Trim(),
            AddressLine1 = request.AddressLine1.Trim(),
            AddressLine2 = request.AddressLine2?.Trim(),
            PostalCode = request.PostalCode?.Trim(),
            CreatedAtUtc = _dateTimeProvider.UtcNow
        };

        var member = new CompanyMember
        {
            CompanyId = company.Id,
            Company = company,
            UserId = userId.Value,
            Role = CompanyRole.Owner,
            IsPrimary = true,
            IsActive = true,
            JoinedAtUtc = _dateTimeProvider.UtcNow
        };

        _context.Companies.Add(company);
        _context.CompanyContactDetails.Add(contactDetails);
        _context.CompanyMembers.Add(member);

        await _context.SaveChangesAsync(cancellationToken);

        return new CompanyResponse(
            company.Id,
            company.LegalName,
            company.TradeName,
            company.IndustrySector,
            company.City,
            company.Governorate,
            company.Description,
            company.Website,
            company.VerificationStatus.ToString(),
            company.CanPerformCommercialActivities,
            company.CreatedAtUtc,
            company.CompanyType.ToString());
    }

    public async Task<CompanyResponse> GetMyCompanyAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id;
        if (!userId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var member = await _context.CompanyMembers
            .Include(m => m.Company)
            .FirstOrDefaultAsync(m => m.UserId == userId.Value && m.IsActive, cancellationToken);

        if (member?.Company == null)
        {
            throw new NotFoundException("No active company found for the current user.");
        }

        var c = member.Company;
        return new CompanyResponse(
            c.Id,
            c.LegalName,
            c.TradeName,
            c.IndustrySector,
            c.City,
            c.Governorate,
            c.Description,
            c.Website,
            c.VerificationStatus.ToString(),
            c.CanPerformCommercialActivities,
            c.CreatedAtUtc,
            c.CompanyType.ToString());
    }

    public async Task<CompanyResponse> UpdateMyCompanyProfileAsync(UpdateCompanyProfileRequest request, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id;
        if (!userId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var member = await _context.CompanyMembers
            .Include(m => m.Company)
            .FirstOrDefaultAsync(m => m.UserId == userId.Value && m.IsActive, cancellationToken);

        if (member?.Company == null)
        {
            throw new NotFoundException("No active company found for the current user.");
        }

        if (member.Role != CompanyRole.Owner && member.Role != CompanyRole.Admin)
        {
            throw new ForbiddenException("Only company Owners or Admins are authorized to update company profile.");
        }

        member.Company.TradeName = request.TradeName.Trim();
        member.Company.City = request.City.Trim();
        member.Company.Governorate = request.Governorate.Trim();
        member.Company.Description = request.Description?.Trim();
        member.Company.Website = request.Website?.Trim();

        await _context.SaveChangesAsync(cancellationToken);

        var c = member.Company;
        return new CompanyResponse(
            c.Id,
            c.LegalName,
            c.TradeName,
            c.IndustrySector,
            c.City,
            c.Governorate,
            c.Description,
            c.Website,
            c.VerificationStatus.ToString(),
            c.CanPerformCommercialActivities,
            c.CreatedAtUtc,
            c.CompanyType.ToString());
    }

    public async Task<CompanyContactDetailsResponse> GetMyCompanyContactDetailsAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id;
        if (!userId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var member = await _context.CompanyMembers
            .FirstOrDefaultAsync(m => m.UserId == userId.Value && m.IsActive, cancellationToken);

        if (member == null)
        {
            throw new NotFoundException("No active company found for the current user.");
        }

        var contact = await _context.CompanyContactDetails
            .FirstOrDefaultAsync(cd => cd.CompanyId == member.CompanyId, cancellationToken);

        if (contact == null)
        {
            throw new NotFoundException("Company contact details not found.");
        }

        return new CompanyContactDetailsResponse(
            contact.CompanyId,
            contact.TaxIdNumber,
            contact.CommercialRegistrationNumber,
            contact.CorporateEmail,
            contact.CorporatePhone,
            contact.AddressLine1,
            contact.AddressLine2,
            contact.PostalCode,
            contact.CreatedAtUtc,
            contact.LastModifiedAtUtc);
    }

    // ─── Phase B: Company Member Management ──────────────────────────────────

    public async Task<List<CompanyMemberResponse>> GetMyCompanyMembersAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id;
        if (!userId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var callerMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(m => m.UserId == userId.Value && m.IsActive, cancellationToken);

        if (callerMember == null)
        {
            throw new NotFoundException("No active company found for the current user.");
        }

        var members = await _context.CompanyMembers
            .Include(m => m.User)
            .Where(m => m.CompanyId == callerMember.CompanyId && m.IsActive)
            .OrderByDescending(m => m.Role == CompanyRole.Owner)
            .ThenByDescending(m => m.Role == CompanyRole.Admin)
            .ThenBy(m => m.User.FullName)
            .ToListAsync(cancellationToken);

        return members.Select(m => new CompanyMemberResponse(
            m.Id,
            m.UserId,
            m.User.Email,
            m.User.FullName,
            m.User.PhoneNumber,
            m.Role.ToString(),
            m.IsPrimary,
            m.IsActive,
            m.JoinedAtUtc)).ToList();
    }

    public async Task<CompanyMemberResponse> AddCompanyMemberAsync(AddCompanyMemberRequest request, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id;
        if (!userId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var callerMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(m => m.UserId == userId.Value && m.IsActive, cancellationToken);

        if (callerMember == null)
        {
            throw new NotFoundException("No active company found for the current user.");
        }

        if (callerMember.Role != CompanyRole.Owner && callerMember.Role != CompanyRole.Admin)
        {
            throw new ForbiddenException("Only company Owners or Admins are authorized to manage company members.");
        }

        if (callerMember.Role == CompanyRole.Admin && request.Role == CompanyRole.Owner)
        {
            throw new ForbiddenException("Admins cannot assign the Owner role.");
        }

        var emailNormalized = request.Email.Trim().ToLowerInvariant();
        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalized, cancellationToken);

        if (targetUser == null)
        {
            throw new NotFoundException("User with specified email was not found. The user must register an account first.");
        }

        if (targetUser.IsSystemAdmin)
        {
            throw new ForbiddenException("System administrators cannot be added as company members.");
        }

        var existingActive = await _context.CompanyMembers
            .AnyAsync(m => m.UserId == targetUser.Id && m.IsActive, cancellationToken);

        if (existingActive)
        {
            throw new ConflictException("User already belongs to an active company.");
        }

        var memberRecord = await _context.CompanyMembers
            .FirstOrDefaultAsync(m => m.CompanyId == callerMember.CompanyId && m.UserId == targetUser.Id, cancellationToken);

        if (memberRecord != null)
        {
            memberRecord.IsActive = true;
            memberRecord.Role = request.Role;
            memberRecord.JoinedAtUtc = _dateTimeProvider.UtcNow;
        }
        else
        {
            memberRecord = new CompanyMember
            {
                CompanyId = callerMember.CompanyId,
                UserId = targetUser.Id,
                Role = request.Role,
                IsPrimary = false,
                IsActive = true,
                JoinedAtUtc = _dateTimeProvider.UtcNow
            };
            _context.CompanyMembers.Add(memberRecord);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new CompanyMemberResponse(
            memberRecord.Id,
            targetUser.Id,
            targetUser.Email,
            targetUser.FullName,
            targetUser.PhoneNumber,
            memberRecord.Role.ToString(),
            memberRecord.IsPrimary,
            memberRecord.IsActive,
            memberRecord.JoinedAtUtc);
    }

    public async Task<CompanyMemberResponse> UpdateCompanyMemberRoleAsync(Guid targetUserId, UpdateCompanyMemberRoleRequest request, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id;
        if (!userId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var callerMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(m => m.UserId == userId.Value && m.IsActive, cancellationToken);

        if (callerMember == null)
        {
            throw new NotFoundException("No active company found for the current user.");
        }

        if (callerMember.Role != CompanyRole.Owner && callerMember.Role != CompanyRole.Admin)
        {
            throw new ForbiddenException("Only company Owners or Admins are authorized to manage member roles.");
        }

        var targetMember = await _context.CompanyMembers
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.CompanyId == callerMember.CompanyId && m.UserId == targetUserId && m.IsActive, cancellationToken);

        if (targetMember == null)
        {
            throw new NotFoundException("Company member not found.");
        }

        if (callerMember.Role == CompanyRole.Admin)
        {
            if (targetMember.Role == CompanyRole.Owner)
            {
                throw new ForbiddenException("Admins cannot modify the role of an Owner.");
            }
            if (request.Role == CompanyRole.Owner)
            {
                throw new ForbiddenException("Admins cannot assign the Owner role.");
            }
        }

        if (targetMember.Role == CompanyRole.Owner && request.Role != CompanyRole.Owner)
        {
            var ownerCount = await _context.CompanyMembers
                .CountAsync(m => m.CompanyId == callerMember.CompanyId && m.Role == CompanyRole.Owner && m.IsActive, cancellationToken);

            if (ownerCount <= 1)
            {
                throw new DomainException("Cannot demote the only Owner of the company. A company must retain at least one Owner.");
            }
        }

        targetMember.Role = request.Role;
        await _context.SaveChangesAsync(cancellationToken);

        return new CompanyMemberResponse(
            targetMember.Id,
            targetMember.UserId,
            targetMember.User.Email,
            targetMember.User.FullName,
            targetMember.User.PhoneNumber,
            targetMember.Role.ToString(),
            targetMember.IsPrimary,
            targetMember.IsActive,
            targetMember.JoinedAtUtc);
    }

    public async Task RemoveCompanyMemberAsync(Guid targetUserId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id;
        if (!userId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var callerMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(m => m.UserId == userId.Value && m.IsActive, cancellationToken);

        if (callerMember == null)
        {
            throw new NotFoundException("No active company found for the current user.");
        }

        if (callerMember.Role != CompanyRole.Owner && callerMember.Role != CompanyRole.Admin)
        {
            throw new ForbiddenException("Only company Owners or Admins are authorized to remove company members.");
        }

        var targetMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(m => m.CompanyId == callerMember.CompanyId && m.UserId == targetUserId && m.IsActive, cancellationToken);

        if (targetMember == null)
        {
            throw new NotFoundException("Company member not found.");
        }

        if (callerMember.Role == CompanyRole.Admin && targetMember.Role == CompanyRole.Owner)
        {
            throw new ForbiddenException("Admins cannot remove a company Owner.");
        }

        if (targetMember.Role == CompanyRole.Owner)
        {
            var ownerCount = await _context.CompanyMembers
                .CountAsync(m => m.CompanyId == callerMember.CompanyId && m.Role == CompanyRole.Owner && m.IsActive, cancellationToken);

            if (ownerCount <= 1)
            {
                throw new DomainException("Cannot remove the only Owner of the company. A company must always retain at least one Owner.");
            }
        }

        targetMember.IsActive = false;
        targetMember.IsPrimary = false;

        await _context.SaveChangesAsync(cancellationToken);
    }

    // ─── Phase B: Supplier Directory & Public Company Profile ────────────────

    public async Task<PagedResult<PublicSupplierSummaryResponse>> GetPublicSuppliersAsync(CompanyDirectoryFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _context.Companies
            .AsNoTracking()
            .Where(c => !c.IsDeleted && c.IsActive && c.VerificationStatus == CompanyVerificationStatus.Approved &&
                        (c.CompanyType == CompanyType.Supplier || c.CompanyType == CompanyType.Both));

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(c => c.TradeName.ToLower().Contains(search) ||
                                     c.LegalName.ToLower().Contains(search) ||
                                     (c.Description != null && c.Description.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(filter.IndustrySector))
        {
            var sector = filter.IndustrySector.Trim();
            query = query.Where(c => c.IndustrySector == sector);
        }

        if (!string.IsNullOrWhiteSpace(filter.City))
        {
            var city = filter.City.Trim();
            query = query.Where(c => c.City == city);
        }

        if (!string.IsNullOrWhiteSpace(filter.Governorate))
        {
            var gov = filter.Governorate.Trim();
            query = query.Where(c => c.Governorate == gov);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var pageSize = filter.PageSize < 1 ? 12 : (filter.PageSize > 50 ? 50 : filter.PageSize);

        var companies = await query
            .OrderBy(c => c.TradeName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var companyIds = companies.Select(c => c.Id).ToList();

        var reviewStats = await _context.Reviews
            .AsNoTracking()
            .Where(r => companyIds.Contains(r.TargetCompanyId) && !r.IsDeleted)
            .GroupBy(r => r.TargetCompanyId)
            .Select(g => new
            {
                CompanyId = g.Key,
                Count = g.Count(),
                Avg = g.Average(r => (decimal)r.Rating)
            })
            .ToDictionaryAsync(x => x.CompanyId, x => (x.Count, x.Avg), cancellationToken);

        var dtos = companies.Select(c =>
        {
            reviewStats.TryGetValue(c.Id, out var stats);
            return new PublicSupplierSummaryResponse(
                c.Id,
                c.TradeName,
                c.LegalName,
                c.IndustrySector,
                c.City,
                c.Governorate,
                c.Description,
                c.Website,
                c.CompanyType.ToString(),
                true,
                stats.Count > 0 ? Math.Round(stats.Avg, 1) : null,
                stats.Count
            );
        }).ToList();

        return PagedResult<PublicSupplierSummaryResponse>.Create(dtos, pageNumber, pageSize, totalCount);
    }

    public async Task<PublicCompanyProfileResponse> GetPublicCompanyProfileAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var company = await _context.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted && c.IsActive && c.VerificationStatus == CompanyVerificationStatus.Approved, cancellationToken);

        if (company == null)
        {
            throw new NotFoundException("Company not found or not eligible for public profile display.");
        }

        var reviewCount = await _context.Reviews
            .AsNoTracking()
            .CountAsync(r => r.TargetCompanyId == companyId && !r.IsDeleted, cancellationToken);

        var avgRating = reviewCount > 0
            ? await _context.Reviews
                .AsNoTracking()
                .Where(r => r.TargetCompanyId == companyId && !r.IsDeleted)
                .AverageAsync(r => (decimal)r.Rating, cancellationToken)
            : (decimal?)null;

        return new PublicCompanyProfileResponse(
            company.Id,
            company.TradeName,
            company.LegalName,
            company.IndustrySector,
            company.City,
            company.Governorate,
            company.Description,
            company.Website,
            company.CompanyType.ToString(),
            true,
            company.VerificationStatus.ToString(),
            avgRating.HasValue ? Math.Round(avgRating.Value, 1) : null,
            reviewCount,
            company.CreatedAtUtc
        );
    }
}

