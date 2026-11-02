using DealZone.Application.Common.Interfaces;
using DealZone.Application.Shipping.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Endpoints for managing shipments linked directly to a deal.
/// Route: /api/v1/deals/{dealId}/shipments
/// </summary>
[Tags("Shipping")]
[Authorize]
[Route("api/v1/deals/{dealId:guid}/shipments")]
public class DealShipmentsController : ApiControllerBase
{
    private readonly IShippingService _shippingService;

    public DealShipmentsController(IShippingService shippingService)
    {
        _shippingService = shippingService;
    }

    /// <summary>
    /// Create or arrange a shipment for a confirmed or in-progress deal.
    /// Accessible only to the supplier company.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateShipment(
        Guid dealId,
        [FromBody] CreateShipmentRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _shippingService.CreateShipmentAsync(dealId, request, cancellationToken);
        return CreatedAtAction("GetShipmentById", "Shipments", new { id = response.Id }, response);
    }

    /// <summary>
    /// Get all shipments for a specific deal.
    /// Accessible to deal participants or system administrators.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDealShipments(
        Guid dealId,
        CancellationToken cancellationToken)
    {
        var response = await _shippingService.GetDealShipmentsAsync(dealId, cancellationToken);
        return Ok(response);
    }
}

