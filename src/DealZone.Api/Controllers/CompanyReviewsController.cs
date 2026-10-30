using DealZone.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Endpoints for accessing company reviews and reputation metrics.
/// Route: /api/v1/companies
/// </summary>
[Tags("Reviews")]
[Route("api/v1/companies")]
public class CompanyReviewsController : ApiControllerBase
{
    private readonly IReviewService _reviewService;

    public CompanyReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    /// <summary>
    /// Get public reputation reviews and average rating for a target company.
    /// Route: GET /api/v1/companies/{companyId}/reviews
    /// </summary>
    [HttpGet("{companyId:guid}/reviews")]
    public async Task<IActionResult> GetCompanyReviews(
        Guid companyId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var response = await _reviewService.GetCompanyReviewsAsync(companyId, pageNumber, pageSize, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get reviews received by the authenticated company.
    /// Route: GET /api/v1/companies/me/reviews
    /// </summary>
    [Authorize]
    [HttpGet("me/reviews")]
    public async Task<IActionResult> GetMyCompanyReviews(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var response = await _reviewService.GetMyCompanyReviewsAsync(pageNumber, pageSize, cancellationToken);
        return Ok(response);
    }
}
