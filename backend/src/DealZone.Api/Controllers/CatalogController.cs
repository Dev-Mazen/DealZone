using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Purchasing.DTOs;
using DealZone.Domain.Exceptions;
using DealZone.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DealZone.Api.Controllers;

/// <summary>
/// Public read-only catalog endpoints for industrial raw materials, categories, and units of measure.
/// Route: /api/v1/catalog
/// </summary>
[Tags("Catalog")]
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
    [AllowAnonymous]
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetCategoriesAsync(includeInactive: false, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get raw material category by ID.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("categories/{id:guid}")]
    public async Task<IActionResult> GetCategoryById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetCategoryByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Search, filter, and paginate industrial raw materials.
    /// </summary>
    [AllowAnonymous]
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
    [AllowAnonymous]
    [HttpGet("materials/{id:guid}")]
    public async Task<IActionResult> GetMaterialById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetMaterialByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get active standard units of measure (ton, kg, liter, meter, piece, etc.).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("units")]
    public async Task<IActionResult> GetUnits(CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetUnitsAsync(includeInactive: false, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get unit of measure by ID.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("units/{id:guid}")]
    public async Task<IActionResult> GetUnitById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetUnitByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    // -------------------------------------------------------------------------
    // Direct Purchasing Catalog Products
    // -------------------------------------------------------------------------

    /// <summary>
    /// Search and filter eligible purchasable catalog products with prices and stock.
    /// Restricted to the three official marketplace categories (Textiles, Food, Metals).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(
        [FromQuery] CatalogProductFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetProductsAsync(filter, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get details of an eligible catalog product.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("products/{id:guid}")]
    public async Task<IActionResult> GetProductById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetProductByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// List a new catalog product available for direct purchasing (verified suppliers only).
    /// </summary>
    [Authorize]
    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct(
        [FromBody] CreateCatalogProductRequest request,
        [FromServices] FluentValidation.IValidator<CreateCatalogProductRequest> validator,
        CancellationToken cancellationToken)
    {
        await DealZone.Application.Common.Validation.ValidationExtensions.ValidateAndThrowDomainAsync(validator, request, cancellationToken);
        var result = await _catalogService.CreateProductAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update catalog product pricing, MOQ, or availability (supplier owner/sales only).
    /// </summary>
    [Authorize]
    [HttpPut("products/{id:guid}")]
    public async Task<IActionResult> UpdateProduct(
        Guid id,
        [FromBody] UpdateCatalogProductRequest request,
        [FromServices] FluentValidation.IValidator<UpdateCatalogProductRequest> validator,
        CancellationToken cancellationToken)
    {
        await DealZone.Application.Common.Validation.ValidationExtensions.ValidateAndThrowDomainAsync(validator, request, cancellationToken);
        var result = await _catalogService.UpdateProductAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Archive a catalog product.
    /// </summary>
    [Authorize]
    [HttpDelete("products/{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken cancellationToken)
    {
        await _catalogService.DeleteProductAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Place a direct purchase order for this specific catalog product (convenience route).
    /// </summary>
    [Authorize]
    [HttpPost("products/{id:guid}/direct-purchase")]
    public async Task<IActionResult> DirectPurchaseProduct(
        Guid id,
        [FromBody] DealZone.Application.Purchasing.DTOs.CreateDirectPurchaseRequest request,
        [FromServices] IPurchasingService purchasingService,
        [FromServices] FluentValidation.IValidator<DealZone.Application.Purchasing.DTOs.CreateDirectPurchaseRequest> validator,
        CancellationToken cancellationToken)
    {
        if (request.CatalogProductId != Guid.Empty && request.CatalogProductId != id)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(nameof(request.CatalogProductId), "Route product ID does not match request body product ID.");
        }

        var normalizedRequest = request with { CatalogProductId = id };
        await DealZone.Application.Common.Validation.ValidationExtensions.ValidateAndThrowDomainAsync(validator, normalizedRequest, cancellationToken);
        var result = await purchasingService.CreateDirectPurchaseAsync(normalizedRequest, cancellationToken);
        return CreatedAtAction("GetPurchaseById", "Purchases", new { id = result.Id }, result);
    }

    /// <summary>
    /// Direct purchase of an industrial raw material from the catalog.
    /// Finds the active supplier catalog product offering this material and issues an atomic direct purchase deal.
    /// Route: POST /api/v1/catalog/materials/{id}/purchase
    /// </summary>
    [Authorize]
    [HttpPost("materials/{id:guid}/purchase")]
    public async Task<IActionResult> DirectPurchaseMaterial(
        Guid id,
        [FromBody] MaterialPurchaseRequest request,
        [FromServices] IPurchasingService purchasingService,
        [FromServices] DealZoneDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var product = await dbContext.CatalogProducts
            .Include(p => p.SupplierCompany)
            .Include(p => p.Material)
            .Where(p => p.MaterialId == id && p.IsActive && !p.IsArchived)
            .OrderByDescending(p => p.AvailableQuantity >= request.Quantity)
            .ThenBy(p => p.UnitPrice)
            .FirstOrDefaultAsync(cancellationToken);

        if (product == null && !string.IsNullOrWhiteSpace(request.MaterialCode))
        {
            product = await dbContext.CatalogProducts
                .Include(p => p.SupplierCompany)
                .Include(p => p.Material)
                .Where(p => p.Material.Code == request.MaterialCode && p.IsActive && !p.IsArchived)
                .OrderByDescending(p => p.AvailableQuantity >= request.Quantity)
                .ThenBy(p => p.UnitPrice)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (product == null)
        {
            throw new NotFoundException($"No active supplier catalog offering was found for material {id}.");
        }

        var fullDeliveryAddress = string.IsNullOrWhiteSpace(request.DeliveryIndustrialZone)
            ? request.DeliveryAddress ?? "Factory Gate"
            : $"{request.DeliveryIndustrialZone} - {request.DeliveryAddress ?? ""}".Trim(' ', '-');

        var directPurchaseRequest = new CreateDirectPurchaseRequest(
            CatalogProductId: product.Id,
            Quantity: request.Quantity,
            DeliveryAddress: fullDeliveryAddress,
            Notes: request.SpecialInstructions);

        var result = await purchasingService.CreateDirectPurchaseAsync(directPurchaseRequest, cancellationToken);
        return CreatedAtAction("GetPurchaseById", "Purchases", new { id = result.Id }, result);
    }
}

