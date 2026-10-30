using DealZone.Application.Common.Interfaces;
using DealZone.Application.Deals.DTOs;
using DealZone.Domain.Deals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Endpoints for B2B deal lifecycle, confirmations, fulfillment, cancellation, and disputes.
/// Route: /api/v1/deals
/// </summary>
[Tags("Deals")]
[Authorize]
[Route("api/v1/deals")]
public class DealsController : ApiControllerBase
{
    private readonly IDealService _dealService;

    public DealsController(IDealService dealService)
    {
        _dealService = dealService;
    }

    /// <summary>
    /// List current company's deals (as buyer or supplier) with pagination and optional status filter.
    /// </summary>
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyDeals(
        [FromQuery] DealStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var response = await _dealService.GetMyDealsAsync(status, pageNumber, pageSize, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get details of an authorized deal. Accessible only to deal participants (buyer or supplier) or system admins.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetDealById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _dealService.GetDealByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Confirm deal participation. Moves deal to Confirmed once both buyer and supplier have confirmed.
    /// </summary>
    [HttpPost("{id:guid}/confirm")]
    public async Task<IActionResult> ConfirmDeal(Guid id, CancellationToken cancellationToken)
    {
        var response = await _dealService.ConfirmDealAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Start work/fulfillment on a confirmed deal. Moves deal to InProgress.
    /// Accessible only to the supplier company.
    /// </summary>
    [HttpPost("{id:guid}/start")]
    public async Task<IActionResult> StartDeal(Guid id, CancellationToken cancellationToken)
    {
        var response = await _dealService.StartDealAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Complete fulfillment on a deal currently in InProgress status. Moves deal to Completed.
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> CompleteDeal(Guid id, CancellationToken cancellationToken)
    {
        var response = await _dealService.CompleteDealAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Request or execute deal cancellation with mandatory reason.
    /// Unilateral while AwaitingConfirmation; mutual agreement required once Confirmed or InProgress.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelDeal(
        Guid id,
        [FromBody] CancelDealRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _dealService.CancelDealAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Open a formal dispute on a deal, moving the deal to Disputed status and preserving prior state.
    /// </summary>
    [HttpPost("{id:guid}/disputes")]
    public async Task<IActionResult> OpenDispute(
        Guid id,
        [FromBody] CreateDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _dealService.OpenDisputeAsync(id, request, cancellationToken);
        return CreatedAtAction(nameof(GetDealById), new { id }, response);
    }

    /// <summary>
    /// List all disputes associated with a deal. Accessible to deal participants or system admins.
    /// </summary>
    [HttpGet("{id:guid}/disputes")]
    public async Task<IActionResult> GetDealDisputes(Guid id, CancellationToken cancellationToken)
    {
        var response = await _dealService.GetDealDisputesAsync(id, cancellationToken);
        return Ok(response);
    }
}

