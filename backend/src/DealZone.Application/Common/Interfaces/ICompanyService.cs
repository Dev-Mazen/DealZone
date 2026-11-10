using DealZone.Application.Common.Models;
using DealZone.Application.Companies.DTOs;

namespace DealZone.Application.Common.Interfaces;

public interface ICompanyService
{
    Task<CompanyResponse> CreateCompanyAsync(CreateCompanyRequest request, CancellationToken cancellationToken = default);
    Task<CompanyResponse> GetMyCompanyAsync(CancellationToken cancellationToken = default);
    Task<CompanyResponse> UpdateMyCompanyProfileAsync(UpdateCompanyProfileRequest request, CancellationToken cancellationToken = default);
    Task<CompanyContactDetailsResponse> GetMyCompanyContactDetailsAsync(CancellationToken cancellationToken = default);

    // Phase B: Company Member Management
    Task<List<CompanyMemberResponse>> GetMyCompanyMembersAsync(CancellationToken cancellationToken = default);
    Task<CompanyMemberResponse> AddCompanyMemberAsync(AddCompanyMemberRequest request, CancellationToken cancellationToken = default);
    Task<CompanyMemberResponse> UpdateCompanyMemberRoleAsync(Guid targetUserId, UpdateCompanyMemberRoleRequest request, CancellationToken cancellationToken = default);
    Task RemoveCompanyMemberAsync(Guid targetUserId, CancellationToken cancellationToken = default);

    // Phase B: Supplier Directory & Public Company Profile
    Task<PagedResult<PublicSupplierSummaryResponse>> GetPublicSuppliersAsync(CompanyDirectoryFilter filter, CancellationToken cancellationToken = default);
    Task<PublicCompanyProfileResponse> GetPublicCompanyProfileAsync(Guid companyId, CancellationToken cancellationToken = default);
}

