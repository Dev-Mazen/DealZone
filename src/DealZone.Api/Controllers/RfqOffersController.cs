using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Validation;
using DealZone.Application.Offers.DTOs;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Endpoints for submitting and managing offers within the context of an RFQ.
/// Route: /api/v1/rfqs/{rfqId}/offers
/// </summary>
[Tags("Offers")]
[Authorize]
[Route("api/v1/rfqs/{rfqId:guid}/offers")]
public class RfqOffersController : ApiControllerBase
{
    private readonly IOfferService _offerService;

    public RfqOffersController(IOfferService offerService)
    {
        _offerService = offerService;
    }

    /// <summary>
    /// Submit a new structured offer for an open RFQ as an approved marketplace supplier.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> SubmitOffer(
        Guid rfqId,
        [FromBody] CreateOfferRequest request,
        [FromServices] IValidator<CreateOfferRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _offerService.SubmitOfferAsync(rfqId, request, cancellationToken);
        return CreatedAtAction("GetOfferById", "Offers", new { id = response.Id }, response);
    }

    /// <summary>
    /// Get offers submitted by the current authenticated supplier for this RFQ (all revisions).
    /// </summary>
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyOffersForRfq(
        Guid rfqId,
        CancellationToken cancellationToken)
    {
        var response = await _offerService.GetMyOffersForRfqAsync(rfqId, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get all submitted offers received for this RFQ. Restricted to the owning buyer company.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetOffersForRfq(
        Guid rfqId,
        CancellationToken cancellationToken)
    {
        var response = await _offerService.GetOffersForRfqAsync(rfqId, cancellationToken);
        return Ok(response);
    }
}

