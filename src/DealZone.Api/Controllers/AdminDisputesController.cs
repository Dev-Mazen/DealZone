using DealZone.Application.Common.Interfaces;
using DealZone.Application.Deals.DTOs;
using DealZone.Domain.Deals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Administrative endpoints for managing and resolving commercial deal disputes.
/// Requires platform administrator authorization.
/// Route: /api/v1/admin/disputes
/// </summary>
[Tags("Admin Disputes")]
[Authorize(Policy = "SystemAdmin")]
[Route("api/v1/admin/disputes")]
public class AdminDisputesController : ApiControllerBase
{
    private readonly IDealService _dealService;

    public AdminDisputesController(IDealService dealService)
    {
        _dealService = dealService;
    }

    /// <summary>
    /// List all disputes across deals with optional status filter and pagination.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDisputes(
        [FromQuery] DisputeStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var response = await _dealService.GetAdminDisputesAsync(status, pageNumber, pageSize, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get details of a specific dispute and its associated deal.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetDisputeById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _dealService.GetAdminDisputeByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Resolve a dispute by either resuming the deal to its previous status or cancelling the deal.
    /// </summary>
    [HttpPost("{id:guid}/resolve")]
    public async Task<IActionResult> ResolveDispute(
        Guid id,
        [FromBody] ResolveDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _dealService.ResolveDisputeAsync(id, request, cancellationToken);
        return Ok(response);
    }
}

