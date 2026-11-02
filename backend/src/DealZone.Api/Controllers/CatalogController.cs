using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Public read-only catalog endpoints for industrial raw materials, categories, and units of measure.
/// Route: /api/v1/catalog
/// </summary>
[Tags("Catalog")]
[AllowAnonymous]
[Route("api/v1/catalog")]
public class CatalogController : ApiControllerBase
{
    private readonly ICatalogService _catalogService;

    public CatalogController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    /// <summary>
    /// Get hierarchical raw material categories.
    /// </summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetCategoriesAsync(includeInactive: false, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get raw material category by ID.
    /// </summary>
    [HttpGet("categories/{id:guid}")]
    public async Task<IActionResult> GetCategoryById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetCategoryByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Search, filter, and paginate industrial raw materials.
    /// </summary>
    [HttpGet("materials")]
    public async Task<IActionResult> GetMaterials(
        [FromQuery] CatalogMaterialFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetMaterialsAsync(filter, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get material definition by ID.
    /// </summary>
    [HttpGet("materials/{id:guid}")]
    public async Task<IActionResult> GetMaterialById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetMaterialByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get active standard units of measure (ton, kg, liter, meter, piece, etc.).
    /// </summary>
    [HttpGet("units")]
    public async Task<IActionResult> GetUnits(CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetUnitsAsync(includeInactive: false, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get unit of measure by ID.
    /// </summary>
    [HttpGet("units/{id:guid}")]
    public async Task<IActionResult> GetUnitById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetUnitByIdAsync(id, cancellationToken);
        return Ok(result);
    }
}

