using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Validation;
using DealZone.Application.Purchasing.DTOs;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Direct catalog purchasing endpoints for verified buyers to procure industrial materials
/// directly without RFQs. Creates an atomic Deal in AwaitingConfirmation for full lifecycle integration.
/// Route: /api/v1/purchases
/// </summary>
[Tags("Purchases")]
[Authorize]
[Route("api/v1/purchases")]
public class PurchasesController : ApiControllerBase
{
    private readonly IPurchasingService _purchasingService;

    public PurchasesController(IPurchasingService purchasingService)
    {
        _purchasingService = purchasingService;
    }

    /// <summary>
    /// Place a direct purchase order for an eligible catalog product.
    /// Server calculates pricing, validates MOQ and stock availability, snaps commercial terms,
    /// and atomically creates a commercial agreement deal.
    /// </summary>
    [HttpPost("direct")]
    [ProducesResponseType(typeof(DirectPurchaseResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateDirectPurchase(
        [FromBody] CreateDirectPurchaseRequest request,
        [FromServices] IValidator<CreateDirectPurchaseRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var result = await _purchasingService.CreateDirectPurchaseAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetPurchaseById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Get direct purchase orders for the caller's company (as buyer or supplier).
    /// </summary>
    [HttpGet("mine")]
    [ProducesResponseType(typeof(DealZone.Application.Common.Models.PagedResult<DirectPurchaseResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPurchases(
        [FromQuery] DirectPurchaseFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _purchasingService.GetDirectPurchasesAsync(filter, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get details of a specific direct purchase order.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DirectPurchaseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPurchaseById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _purchasingService.GetDirectPurchaseByIdAsync(id, cancellationToken);
        return Ok(result);
    }
}

