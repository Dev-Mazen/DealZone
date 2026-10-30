using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Validation;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Administrative catalog management endpoints for categories, materials, and units of measure.
/// Requires platform administrator authorization.
/// Route: /api/v1/admin/catalog
/// </summary>
[Tags("Admin Catalog")]
[Authorize(Policy = "SystemAdmin")]
[Route("api/v1/admin/catalog")]
public class AdminCatalogController : ApiControllerBase
{
    private readonly ICatalogService _catalogService;

    public AdminCatalogController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    // -------------------------------------------------------------------------
    // Categories
    // -------------------------------------------------------------------------

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory(
        [FromBody] CreateCategoryRequest request,
        [FromServices] IValidator<CreateCategoryRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var result = await _catalogService.CreateCategoryAsync(request, cancellationToken);
        return CreatedAtAction("GetCategoryById", "Catalog", new { id = result.Id }, result);
    }

    [HttpPut("categories/{id:guid}")]
    public async Task<IActionResult> UpdateCategory(
        Guid id,
        [FromBody] UpdateCategoryRequest request,
        [FromServices] IValidator<UpdateCategoryRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var result = await _catalogService.UpdateCategoryAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken cancellationToken)
    {
        await _catalogService.DeleteCategoryAsync(id, cancellationToken);
        return NoContent();
    }

    // -------------------------------------------------------------------------
    // Materials
    // -------------------------------------------------------------------------

    [HttpPost("materials")]
    public async Task<IActionResult> CreateMaterial(
        [FromBody] CreateMaterialRequest request,
        [FromServices] IValidator<CreateMaterialRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var result = await _catalogService.CreateMaterialAsync(request, cancellationToken);
        return CreatedAtAction("GetMaterialById", "Catalog", new { id = result.Id }, result);
    }

    [HttpPut("materials/{id:guid}")]
    public async Task<IActionResult> UpdateMaterial(
        Guid id,
        [FromBody] UpdateMaterialRequest request,
        [FromServices] IValidator<UpdateMaterialRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var result = await _catalogService.UpdateMaterialAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("materials/{id:guid}")]
    public async Task<IActionResult> DeleteMaterial(Guid id, CancellationToken cancellationToken)
    {
        await _catalogService.DeleteMaterialAsync(id, cancellationToken);
        return NoContent();
    }

    // -------------------------------------------------------------------------
    // Units of Measure
    // -------------------------------------------------------------------------

    [HttpPost("units")]
    public async Task<IActionResult> CreateUnit(
        [FromBody] CreateUnitRequest request,
        [FromServices] IValidator<CreateUnitRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var result = await _catalogService.CreateUnitAsync(request, cancellationToken);
        return CreatedAtAction("GetUnitById", "Catalog", new { id = result.Id }, result);
    }

    [HttpPut("units/{id:guid}")]
    public async Task<IActionResult> UpdateUnit(
        Guid id,
        [FromBody] UpdateUnitRequest request,
        [FromServices] IValidator<UpdateUnitRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var result = await _catalogService.UpdateUnitAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("units/{id:guid}")]
    public async Task<IActionResult> DeleteUnit(Guid id, CancellationToken cancellationToken)
    {
        await _catalogService.DeleteUnitAsync(id, cancellationToken);
        return NoContent();
    }
}

