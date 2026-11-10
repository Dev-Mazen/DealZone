using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Validation;
using DealZone.Application.Offers.DTOs;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Endpoints for offer lifecycle management, revisions, and buyer decisions.
/// Route: /api/v1/offers
/// </summary>
[Tags("Offers")]
[Authorize]
[Route("api/v1/offers")]
public class OffersController : ApiControllerBase
{
    private readonly IOfferService _offerService;

    public OffersController(IOfferService offerService)
    {
        _offerService = offerService;
    }

    /// <summary>
    /// Get authorized offer details.
    /// Accessible to the owning supplier or the owning buyer of the RFQ.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOfferById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _offerService.GetOfferByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// List all offers submitted across RFQs by the current authenticated supplier company.
    /// </summary>
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyOffers(
        [FromQuery] OfferFilter filter,
        CancellationToken cancellationToken)
    {
        var response = await _offerService.GetMyOffersAsync(filter, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// List all offers received across RFQs published by the current authenticated buyer company.
    /// </summary>
    [HttpGet("received")]
    public async Task<IActionResult> GetReceivedOffers(
        [FromQuery] OfferFilter filter,
        CancellationToken cancellationToken)
    {
        var response = await _offerService.GetReceivedOffersAsync(filter, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Submit a new immutable revision of an existing offer, superseding the previous version.
    /// </summary>
    [HttpPost("{id:guid}/revise")]
    public async Task<IActionResult> ReviseOffer(
        Guid id,
        [FromBody] ReviseOfferRequest request,
        [FromServices] IValidator<ReviseOfferRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _offerService.ReviseOfferAsync(id, request, cancellationToken);
        return CreatedAtAction(nameof(GetOfferById), new { id = response.Id }, response);
    }

    /// <summary>
    /// Get the full immutable revision history for an offer lineage.
    /// Accessible to the owning supplier or the owning buyer.
    /// </summary>
    [HttpGet("{id:guid}/revisions")]
    public async Task<IActionResult> GetOfferRevisions(Guid id, CancellationToken cancellationToken)
    {
        var response = await _offerService.GetOfferRevisionsAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Accept a submitted offer for an open RFQ.
    /// Atomically rejects competing offers and closes the RFQ. Restricted to the owning buyer.
    /// </summary>
    [HttpPost("{id:guid}/accept")]
    public async Task<IActionResult> AcceptOffer(
        Guid id,
        [FromBody] AcceptOfferRequest? request,
        CancellationToken cancellationToken)
    {
        var response = await _offerService.AcceptOfferAsync(id, request ?? new AcceptOfferRequest(), cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Reject a submitted offer. Restricted to the owning buyer.
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> RejectOffer(
        Guid id,
        [FromBody] RejectOfferRequest request,
        [FromServices] IValidator<RejectOfferRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _offerService.RejectOfferAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Withdraw a submitted or under-review offer.
    /// Restricted to the owning supplier company.
    /// </summary>
    [HttpPost("{id:guid}/withdraw")]
    public async Task<IActionResult> WithdrawOffer(
        Guid id,
        [FromBody] WithdrawOfferRequest? request,
        [FromServices] IValidator<WithdrawOfferRequest>? validator,
        CancellationToken cancellationToken)
    {
        if (request != null && validator != null)
        {
            await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        }
        var response = await _offerService.WithdrawOfferAsync(id, request, cancellationToken);
        return Ok(response);
    }
}

