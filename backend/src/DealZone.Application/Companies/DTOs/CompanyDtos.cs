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

