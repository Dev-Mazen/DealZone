using DealZone.Application.Common.Interfaces;
using DealZone.Application.Purchasing.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Product price negotiations between buyers and suppliers.
/// </summary>
[Authorize]
public class NegotiationsController : ApiControllerBase
{
    private readonly INegotiationService _negotiationService;

    public NegotiationsController(INegotiationService negotiationService)
    {
        _negotiationService = negotiationService;
    }

    /// <summary>
    /// Buyer initiates a "Make an Offer" negotiation on a marketplace product.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductNegotiationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _negotiationService.CreateNegotiationAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Get paginated list of negotiations for the caller's company (buyer or supplier).
    /// </summary>
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(
        [FromQuery] ProductNegotiationFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _negotiationService.GetMyNegotiationsAsync(filter, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get a single negotiation by ID (accessible to both parties).
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _negotiationService.GetNegotiationByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Submit a counter-offer on a negotiation (buyer or supplier depending on whose turn it is).
    /// </summary>
    [HttpPost("{id:guid}/counter")]
    public async Task<IActionResult> Counter(
        Guid id,
        [FromBody] CounterNegotiationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _negotiationService.CounterNegotiationAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Accept the current terms — creates a Deal atomically in AwaitingConfirmation status.
    /// </summary>
    [HttpPost("{id:guid}/accept")]
    public async Task<IActionResult> Accept(Guid id, CancellationToken cancellationToken)
    {
        var result = await _negotiationService.AcceptNegotiationAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Reject the negotiation (buyer or supplier).
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(
        Guid id,
        [FromBody] RejectNegotiationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _negotiationService.RejectNegotiationAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Buyer cancels an open negotiation they initiated.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var result = await _negotiationService.CancelNegotiationAsync(id, cancellationToken);
        return Ok(result);
    }
}

