using DealZone.Application.Common.Interfaces;
using DealZone.Application.Reviews.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Endpoints for submitting and viewing reviews directly tied to a deal.
/// Route: /api/v1/deals/{dealId}/reviews
/// </summary>
[Tags("Reviews")]
[Authorize]
[Route("api/v1/deals/{dealId:guid}/reviews")]
public class DealReviewsController : ApiControllerBase
{
    private readonly IReviewService _reviewService;

    public DealReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    /// <summary>
    /// Submit a review for a completed deal. Accessible only to verified deal participants.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateReview(
        Guid dealId,
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _reviewService.CreateReviewAsync(dealId, request, cancellationToken);
        return CreatedAtAction(nameof(GetDealReviews), new { dealId }, response);
    }

    /// <summary>
    /// Get all reviews submitted for a specific deal.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDealReviews(
        Guid dealId,
        CancellationToken cancellationToken)
    {
        var response = await _reviewService.GetDealReviewsAsync(dealId, cancellationToken);
        return Ok(response);
    }
}

