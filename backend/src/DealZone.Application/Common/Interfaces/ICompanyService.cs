using DealZone.Application.Companies.DTOs;

namespace DealZone.Application.Common.Interfaces;

public interface ICompanyService
{
    Task<CompanyResponse> CreateCompanyAsync(CreateCompanyRequest request, CancellationToken cancellationToken = default);
    Task<CompanyResponse> GetMyCompanyAsync(CancellationToken cancellationToken = default);
    Task<CompanyResponse> UpdateMyCompanyProfileAsync(UpdateCompanyProfileRequest request, CancellationToken cancellationToken = default);
    Task<CompanyContactDetailsResponse> GetMyCompanyContactDetailsAsync(CancellationToken cancellationToken = default);
}

