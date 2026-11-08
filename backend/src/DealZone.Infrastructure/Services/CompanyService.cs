using DealZone.Application.Common.Interfaces;
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
}

