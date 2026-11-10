namespace DealZone.Application.Companies.DTOs;

public record CreateCompanyRequest(
    string LegalName,
    string TradeName,
    string IndustrySector,
    string City,
    string Governorate,
    string? Description,
    string? Website,
    string TaxIdNumber,
    string CommercialRegistrationNumber,
    string CorporateEmail,
    string CorporatePhone,
    string AddressLine1,
    string? AddressLine2,
    string? PostalCode,
    string? CompanyType = null);

public record UpdateCompanyProfileRequest(
    string TradeName,
    string City,
    string Governorate,
    string? Description,
    string? Website);

public record CompanyResponse(
    Guid Id,
    string LegalName,
    string TradeName,
    string IndustrySector,
    string City,
    string Governorate,
    string? Description,
    string? Website,
    string VerificationStatus,
    bool CanPerformCommercialActivities,
    DateTimeOffset CreatedAtUtc,
    string CompanyType = "Both");

public record CompanyContactDetailsResponse(
    Guid CompanyId,
    string TaxIdNumber,
    string CommercialRegistrationNumber,
    string CorporateEmail,
    string CorporatePhone,
    string AddressLine1,
    string? AddressLine2,
    string? PostalCode,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? LastModifiedAtUtc);

// ─── Phase B: Company Member Management DTOs ─────────────────────────────────

public record CompanyMemberResponse(
    Guid Id,
    Guid UserId,
    string Email,
    string FullName,
    string? PhoneNumber,
    string Role,
    bool IsPrimary,
    bool IsActive,
    DateTimeOffset JoinedAtUtc);

public record AddCompanyMemberRequest(
    string Email,
    DealZone.Domain.Companies.CompanyRole Role);

public record UpdateCompanyMemberRoleRequest(
    DealZone.Domain.Companies.CompanyRole Role);

// ─── Phase B: Supplier Directory & Public Company Profile DTOs ───────────────

public record CompanyDirectoryFilter(
    string? Search = null,
    string? IndustrySector = null,
    string? City = null,
    string? Governorate = null,
    int PageNumber = 1,
    int PageSize = 12);

public record PublicSupplierSummaryResponse(
    Guid Id,
    string TradeName,
    string LegalName,
    string IndustrySector,
    string City,
    string Governorate,
    string? Description,
    string? Website,
    string CompanyType,
    bool IsVerified,
    decimal? AverageRating,
    int ReviewCount);

public record PublicCompanyProfileResponse(
    Guid Id,
    string TradeName,
    string LegalName,
    string IndustrySector,
    string City,
    string Governorate,
    string? Description,
    string? Website,
    string CompanyType,
    bool IsVerified,
    string VerificationStatus,
    decimal? AverageRating,
    int ReviewCount,
    DateTimeOffset MemberSinceUtc);


