using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Validation;
using DealZone.Application.Tenders.DTOs;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Tender and reverse bidding lifecycle management endpoints.
/// Requires an authenticated user belonging to an approved company.
/// Route: /api/v1/tenders
/// </summary>
[Tags("Tenders")]
[Authorize]
[Route("api/v1/tenders")]
public class TendersController : ApiControllerBase
{
    private readonly ITenderService _tenderService;

    public TendersController(ITenderService tenderService)
    {
        _tenderService = tenderService;
    }

    // =========================================================================
    // BUYER TENDER OPERATIONS
    // =========================================================================

    /// <summary>
    /// Create a new tender with one or more required items.
    /// Creates in Draft status by default.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTender(
        [FromBody] CreateTenderRequest request,
        [FromServices] IValidator<CreateTenderRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _tenderService.CreateTenderAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetTenderById), new { id = response.Id }, response);
    }

    /// <summary>
    /// Update a draft tender. Only draft tenders can be edited.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTender(
        Guid id,
        [FromBody] UpdateTenderRequest request,
        [FromServices] IValidator<UpdateTenderRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _tenderService.UpdateTenderAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Publish a draft tender, making it visible to verified suppliers in the marketplace.
    /// </summary>
    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> PublishTender(Guid id, CancellationToken cancellationToken)
    {
        var response = await _tenderService.PublishTenderAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Manually close a published tender before its automatic closing date.
    /// </summary>
    [HttpPost("{id:guid}/close")]
    public async Task<IActionResult> CloseTender(Guid id, CancellationToken cancellationToken)
    {
        var response = await _tenderService.CloseTenderAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Reopen a closed tender with a new future closing date.
    /// Only closed tenders (not awarded, cancelled, or no-award) can be reopened.
    /// </summary>
    [HttpPost("{id:guid}/reopen")]
    public async Task<IActionResult> ReopenTender(
        Guid id,
        [FromBody] ReopenTenderRequest request,
        [FromServices] IValidator<ReopenTenderRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _tenderService.ReopenTenderAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Cancel a tender before award. Requires a reason and notifies all bidding suppliers.
    /// Cancellation is a terminal state.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelTender(
        Guid id,
        [FromBody] CancelTenderRequest request,
        [FromServices] IValidator<CancelTenderRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _tenderService.CancelTenderAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Reject all bids after closing. NoAward is a terminal state.
    /// </summary>
    [HttpPost("{id:guid}/no-award")]
    public async Task<IActionResult> MarkNoAward(
        Guid id,
        [FromBody] NoAwardTenderRequest request,
        [FromServices] IValidator<NoAwardTenderRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _tenderService.MarkNoAwardAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Award a tender to a specific bid. Atomically creates a Deal at AwaitingConfirmation status.
    /// The buyer can optionally provide rationale. Award is a terminal state for the tender.
    /// </summary>
    [HttpPost("{id:guid}/award")]
    public async Task<IActionResult> AwardTender(
        Guid id,
        [FromBody] AwardTenderRequest request,
        [FromServices] IValidator<AwardTenderRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _tenderService.AwardTenderAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// List tenders created by the current authenticated buyer company.
    /// </summary>
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyTenders(
        [FromQuery] TenderFilter filter,
        CancellationToken cancellationToken)
    {
        var response = await _tenderService.GetMyTendersAsync(filter, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get all bids submitted for a specific tender. Restricted to the owning buyer.
    /// Includes supplier identities and item-level pricing.
    /// </summary>
    [HttpGet("{id:guid}/bids")]
    public async Task<IActionResult> GetTenderBids(Guid id, CancellationToken cancellationToken)
    {
        var response = await _tenderService.GetTenderBidsAsync(id, cancellationToken);
        return Ok(response);
    }

    // =========================================================================
    // DISCOVERY & DETAIL
    // =========================================================================

    /// <summary>
    /// Browse published tenders in the marketplace.
    /// Available to all verified companies.
    /// </summary>
    [HttpGet("discover")]
    public async Task<IActionResult> DiscoverTenders(
        [FromQuery] TenderFilter filter,
        CancellationToken cancellationToken)
    {
        var response = await _tenderService.DiscoverTendersAsync(filter, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get tender details by ID.
    /// Buyers see full details; suppliers see limited competitive information.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTenderById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _tenderService.GetTenderByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    // =========================================================================
    // SUPPLIER BID OPERATIONS
    // =========================================================================

    /// <summary>
    /// Submit a new bid for a published tender.
    /// Restricted to verified supplier companies. One active bid per supplier per tender.
    /// </summary>
    [HttpPost("{id:guid}/bids")]
    public async Task<IActionResult> SubmitBid(
        Guid id,
        [FromBody] SubmitBidRequest request,
        [FromServices] IValidator<SubmitBidRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _tenderService.SubmitBidAsync(id, request, cancellationToken);
        return CreatedAtAction(nameof(GetBidById), new { bidId = response.Id }, response);
    }

    /// <summary>
    /// Revise an existing bid, superseding the previous version.
    /// Revised total must be lower than the lowest competing active bid.
    /// </summary>
    [HttpPut("bids/{bidId:guid}/revise")]
    public async Task<IActionResult> ReviseBid(
        Guid bidId,
        [FromBody] ReviseBidRequest request,
        [FromServices] IValidator<ReviseBidRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _tenderService.ReviseBidAsync(bidId, request, cancellationToken);
        return CreatedAtAction(nameof(GetBidById), new { bidId = response.Id }, response);
    }

    /// <summary>
    /// Withdraw a submitted bid before the tender closes.
    /// Requires a mandatory reason. Withdrawal is irreversible.
    /// </summary>
    [HttpPost("bids/{bidId:guid}/withdraw")]
    public async Task<IActionResult> WithdrawBid(
        Guid bidId,
        [FromBody] WithdrawBidRequest request,
        [FromServices] IValidator<WithdrawBidRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _tenderService.WithdrawBidAsync(bidId, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// List bids submitted by the current authenticated supplier company across all tenders.
    /// </summary>
    [HttpGet("bids/mine")]
    public async Task<IActionResult> GetMyBids(
        [FromQuery] BidFilter filter,
        CancellationToken cancellationToken)
    {
        var response = await _tenderService.GetMyBidsAsync(filter, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get bid details by ID.
    /// Accessible to the owning supplier or the tender's buyer.
    /// </summary>
    [HttpGet("bids/{bidId:guid}")]
    public async Task<IActionResult> GetBidById(Guid bidId, CancellationToken cancellationToken)
    {
        var response = await _tenderService.GetBidByIdAsync(bidId, cancellationToken);
        return Ok(response);
    }
}
