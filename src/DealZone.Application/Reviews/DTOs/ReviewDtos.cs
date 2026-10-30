using DealZone.Application.Common.Models;

namespace DealZone.Application.Reviews.DTOs;

public record CreateReviewRequest(
    int Rating,
    string Comment);

public record ReviewResponse(
    Guid Id,
    Guid DealId,
    string DealNumber,
    Guid ReviewerCompanyId,
    string ReviewerCompanyName,
    Guid TargetCompanyId,
    string TargetCompanyName,
    int Rating,
    string Comment,
    DateTimeOffset CreatedAtUtc);

public record CompanyReviewStatsDto(
    Guid CompanyId,
    string CompanyName,
    decimal AverageRating,
    int TotalReviews);

public record CompanyReviewsResponse(
    CompanyReviewStatsDto Stats,
    PagedResult<ReviewResponse> Reviews);

