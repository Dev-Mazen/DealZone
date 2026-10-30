using DealZone.Application.Reviews.DTOs;

namespace DealZone.Application.Common.Interfaces;

public interface IReviewService
{
    Task<ReviewResponse> CreateReviewAsync(
        Guid dealId,
        CreateReviewRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ReviewResponse>> GetDealReviewsAsync(
        Guid dealId,
        CancellationToken cancellationToken = default);

    Task<CompanyReviewsResponse> GetCompanyReviewsAsync(
        Guid companyId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<CompanyReviewsResponse> GetMyCompanyReviewsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
}

