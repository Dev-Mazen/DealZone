using DealZone.Application.Common.Interfaces;
using DealZone.Application.Shipping.DTOs;
using DealZone.Domain.Shipping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Administrative endpoints for shipping provider management and shipment oversight.
/// Requires platform administrator authorization.
/// </summary>
[Tags("Shipping Providers")]
[Authorize(Policy = "SystemAdmin")]
[Route("api/v1/admin")]
public class AdminShippingController : ApiControllerBase
{
    private readonly IShippingService _shippingService;

    public AdminShippingController(IShippingService shippingService)
    {
        _shippingService = shippingService;
    }

    // -------------------------------------------------------------------------
    // Shipping Providers
    // -------------------------------------------------------------------------

    /// <summary>
    /// Register a new shipping provider in the platform.
    /// Route: POST /api/v1/admin/shipping-providers
    /// </summary>
    [HttpPost("shipping-providers")]
    public async Task<IActionResult> CreateProvider(
        [FromBody] CreateShippingProviderRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _shippingService.CreateProviderAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetProviderById), new { id = response.Id }, response);
    }

    /// <summary>
    /// List shipping providers with pagination and optional active filter.
    /// Route: GET /api/v1/admin/shipping-providers
    /// </summary>
    [HttpGet("shipping-providers")]
    public async Task<IActionResult> GetProviders(
        [FromQuery] bool? isActive,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var response = await _shippingService.GetProvidersAsync(isActive, pageNumber, pageSize, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get shipping provider details.
    /// Route: GET /api/v1/admin/shipping-providers/{id}
    /// </summary>
    [HttpGet("shipping-providers/{id:guid}")]
    public async Task<IActionResult> GetProviderById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _shippingService.GetProviderByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Update shipping provider details.
    /// Route: PUT /api/v1/admin/shipping-providers/{id}
    /// </summary>
    [HttpPut("shipping-providers/{id:guid}")]
    public async Task<IActionResult> UpdateProvider(
        Guid id,
        [FromBody] UpdateShippingProviderRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _shippingService.UpdateProviderAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Activate a shipping provider.
    /// Route: POST /api/v1/admin/shipping-providers/{id}/activate
    /// </summary>
    [HttpPost("shipping-providers/{id:guid}/activate")]
    public async Task<IActionResult> ActivateProvider(Guid id, CancellationToken cancellationToken)
    {
        var response = await _shippingService.SetProviderActiveAsync(id, true, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Deactivate a shipping provider.
    /// Route: POST /api/v1/admin/shipping-providers/{id}/deactivate
    /// </summary>
    [HttpPost("shipping-providers/{id:guid}/deactivate")]
    public async Task<IActionResult> DeactivateProvider(Guid id, CancellationToken cancellationToken)
    {
        var response = await _shippingService.SetProviderActiveAsync(id, false, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Delete an unreferenced shipping provider.
    /// Route: DELETE /api/v1/admin/shipping-providers/{id}
    /// </summary>
    [HttpDelete("shipping-providers/{id:guid}")]
    public async Task<IActionResult> DeleteProvider(Guid id, CancellationToken cancellationToken)
    {
        await _shippingService.DeleteProviderAsync(id, cancellationToken);
        return NoContent();
    }

    // -------------------------------------------------------------------------
    // Shipments Oversight
    // -------------------------------------------------------------------------

    /// <summary>
    /// List all marketplace shipments with optional status filter and pagination.
    /// Route: GET /api/v1/admin/shipments
    /// </summary>
    [HttpGet("shipments")]
    public async Task<IActionResult> GetAdminShipments(
        [FromQuery] ShipmentStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var response = await _shippingService.GetAdminShipmentsAsync(status, pageNumber, pageSize, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Assign an active shipping provider to a deal shipment.
    /// Route: POST /api/v1/admin/shipments/{id}/assign-provider
    /// </summary>
    [HttpPost("shipments/{id:guid}/assign-provider")]
    public async Task<IActionResult> AssignProvider(
        Guid id,
        [FromBody] AssignShippingProviderRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _shippingService.AssignProviderAsync(id, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Administratively update status for any shipment.
    /// Route: POST /api/v1/admin/shipments/{id}/status
    /// </summary>
    [HttpPost("shipments/{id:guid}/status")]
    public async Task<IActionResult> AdminUpdateStatus(
        Guid id,
        [FromBody] UpdateShipmentStatusRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _shippingService.AdminUpdateStatusAsync(id, request, cancellationToken);
        return Ok(response);
    }
}
