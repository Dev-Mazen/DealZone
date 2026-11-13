using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Validation;
using DealZone.Application.Rfqs.DTOs;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Request for Quotation (RFQ) lifecycle management endpoints.
/// Requires an authenticated user belonging to an approved company.
/// Route: /api/v1/rfqs
/// </summary>
[Tags("RFQs")]
[Authorize]
[Route("api/v1/rfqs")]
public class RfqsController : ApiControllerBase
{
    private readonly IRfqService _rfqService;

    public RfqsController(IRfqService rfqService)
    {
        _rfqService = rfqService;
    }

    /// <summary>
    /// Create a new Request for Quotation (RFQ).
    /// Can be saved as a Draft (default) or Published immediately if PublishImmediately is true.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateRfq(
        [FromBody] CreateRfqRequest request,
        [FromServices] IValidator<CreateRfqRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _rfqService.CreateRfqAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetRfqById), new { id = response.Id }, response);
    }

    /// <summary>
    /// Get RFQ details by ID.
    /// Accessible to the owning buyer, or to verified suppliers if the RFQ is Published.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetRfqById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _rfqService.GetRfqByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// List all RFQs created by the current authenticated buyer company.
    /// Includes drafts, published, closed, and cancelled RFQs.
    /// </summary>
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyRfqs(
        [FromQuery] MyRfqFilter filter,
        CancellationToken cancellationToken)
    {
        var response = await _rfqService.GetMyRfqsAsync(filter, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Discover published and open RFQs across the marketplace.
    /// Restricted to approved supplier companies. Sanitizes buyer private contact info.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> DiscoverRfqs(
        [FromQuery] RfqDiscoveryFilter filter,
        CancellationToken cancellationToken)
    {
        var response = await _rfqService.DiscoverRfqsAsync(filter, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Update an existing RFQ.
    /// Draft RFQs allow full editing of items and parameters; published RFQs allow updating delivery details and notes.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateRfq(
        Guid id,
        [FromBody] UpdateRfqRequest request,
        [FromServices] IValidator<UpdateRfqRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _rfqService.UpdateRfqAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Publish a draft RFQ, making it visible to verified marketplace suppliers.
    /// </summary>
    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> PublishRfq(Guid id, CancellationToken cancellationToken)
    {
        var response = await _rfqService.PublishRfqAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Close a published RFQ. Closed RFQs cannot receive any further offers.
    /// </summary>
    [HttpPost("{id:guid}/close")]
    public async Task<IActionResult> CloseRfq(Guid id, CancellationToken cancellationToken)
    {
        var response = await _rfqService.CloseRfqAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Cancel an RFQ. Cancelled RFQs are archived and cannot receive any offers.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelRfq(Guid id, CancellationToken cancellationToken)
    {
        var response = await _rfqService.CancelRfqAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Award winning offer for an RFQ and atomically generate a confirmed deal.
    /// </summary>
    [HttpPost("{id:guid}/award")]
    public async Task<IActionResult> AwardRfq(
        Guid id,
        [FromBody] AwardRfqRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _rfqService.AwardRfqAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Reopen a closed or unawarded RFQ, extending deadline and allowing offers.
    /// </summary>
    [HttpPost("{id:guid}/reopen")]
    public async Task<IActionResult> ReopenRfq(Guid id, CancellationToken cancellationToken)
    {
        var response = await _rfqService.ReopenRfqAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Close an RFQ without selecting a winner (No Award).
    /// </summary>
    [HttpPost("{id:guid}/no-award")]
    public async Task<IActionResult> NoAwardRfq(
        Guid id,
        [FromBody] NoAwardRfqRequest? request,
        CancellationToken cancellationToken)
    {
        var response = await _rfqService.NoAwardRfqAsync(id, request?.Reason, cancellationToken);
        return Ok(response);
    }
}

