using DealZone.Application.Common.Interfaces;
using DealZone.Application.Shipping.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Endpoints for inspecting and updating active shipments.
/// Route: /api/v1/shipments
/// </summary>
[Tags("Shipping")]
[Authorize]
[Route("api/v1/shipments")]
public class ShipmentsController : ApiControllerBase
{
    private readonly IShippingService _shippingService;

    public ShipmentsController(IShippingService shippingService)
    {
        _shippingService = shippingService;
    }

    /// <summary>
    /// Get shipment details and tracking event history.
    /// Accessible to deal participants or system administrators.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetShipmentById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _shippingService.GetShipmentByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Update tracking number or carrier name for a shipment.
    /// </summary>
    [HttpPut("{id:guid}/tracking")]
    public async Task<IActionResult> UpdateTracking(
        Guid id,
        [FromBody] UpdateTrackingRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _shippingService.UpdateTrackingAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Update status for a supplier-arranged shipment.
    /// </summary>
    [HttpPost("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateShipmentStatusRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _shippingService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(response);
    }
}

