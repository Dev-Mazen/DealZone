using DealZone.Domain.Companies;

namespace DealZone.Application.Common.Interfaces;

public interface ICurrentCompanyContext
{
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
    bool IsSystemAdmin { get; }
    bool IsUserActive { get; }

    Guid? CompanyId { get; }
    string? LegalName { get; }
    string? TradeName { get; }
    CompanyType? CompanyType { get; }
    CompanyRole? MemberRole { get; }
    CompanyVerificationStatus? VerificationStatus { get; }
    bool IsCompanyActive { get; }
    bool IsCompanyDeleted { get; }
    bool CanPerformCommercialActivities { get; }

    bool IsBuyer => CompanyType == Domain.Companies.CompanyType.Buyer;
    bool IsSupplier => CompanyType == Domain.Companies.CompanyType.Supplier;
}
