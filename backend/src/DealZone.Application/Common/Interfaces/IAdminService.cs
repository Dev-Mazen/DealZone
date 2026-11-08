using DealZone.Application.Admin.DTOs;
using DealZone.Application.Verification.DTOs;

namespace DealZone.Application.Common.Interfaces;

public interface IAdminService
{
    Task<IReadOnlyList<PendingCompanyDto>> GetPendingCompaniesAsync(CancellationToken cancellationToken = default);

    Task<CompanyVerificationDetailDto> GetCompanyVerificationAsync(
        Guid companyId,
        CancellationToken cancellationToken = default);

    Task ApproveCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);

    Task RejectCompanyAsync(Guid companyId, string reason, CancellationToken cancellationToken = default);

    Task RequestChangesAsync(Guid companyId, string reason, CancellationToken cancellationToken = default);

    Task<(Stream stream, string contentType, string fileName)> GetDocumentStreamAsync(
        Guid companyId,
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task<AdminAnalyticsResponse> GetAnalyticsAsync(
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        CancellationToken cancellationToken = default);

    Task<byte[]> ExportCompaniesCsvAsync(CancellationToken cancellationToken = default);

    Task<byte[]> ExportDealsCsvAsync(CancellationToken cancellationToken = default);
}
