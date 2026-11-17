using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Domain.Catalog;
using DealZone.Domain.Companies;
using DealZone.Domain.Exceptions;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Services;

public class CatalogService : ICatalogService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CatalogService> _logger;

    public CatalogService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        IConfiguration configuration,
        ILogger<CatalogService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _configuration = configuration;
        _logger = logger;
    }

    private IReadOnlyList<string> GetAllowedMarketplaceCodes()
    {
        var codes = _configuration.GetSection("Marketplace:AllowedCategoryCodes").Get<string[]>();
        return codes is { Length: > 0 } ? codes : ["METALS", "TEXTILES", "FOOD"];
    }

    // -------------------------------------------------------------------------
    // Categories
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = _context.MaterialCategories.AsNoTracking();

        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive && !c.IsArchived);
        }

        var allCategories = await query
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.NameEn)
            .ToListAsync(cancellationToken);

        // Build tree: root categories first
        var allowedCodes = GetAllowedMarketplaceCodes();
        var rootCategories = allCategories
            .Where(c => c.ParentCategoryId == null)
            .Select(c => MapCategoryTree(c, allCategories, allowedCodes))
            .ToList();

        return rootCategories;
    }

    public async Task<CategoryDto> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _context.MaterialCategories
            .AsNoTracking()
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material category {id} was not found.");

        return MapCategory(category);
    }

    public async Task<CategoryDto> CreateCategoryAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        string codeNormalized;
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            codeNormalized = NormalizeCategoryCode(request.Code);
            var exists = await _context.MaterialCategories
                .AnyAsync(c => c.Code == codeNormalized, cancellationToken);
            if (exists)
            {
                throw new ConflictException($"Category with code '{codeNormalized}' already exists.");
            }
        }
        else
        {
            codeNormalized = GenerateCategoryCodeSlug(request.NameEn, request.NameAr);
            codeNormalized = await ResolveUniqueCategoryCodeAsync(codeNormalized, cancellationToken);
        }

        if (request.ParentCategoryId.HasValue)
        {
            var parentExists = await _context.MaterialCategories
                .AnyAsync(c => c.Id == request.ParentCategoryId.Value, cancellationToken);

            if (!parentExists)
            {
                throw new NotFoundException($"Parent category {request.ParentCategoryId.Value} not found.");
            }
        }

        var category = new MaterialCategory
        {
            ParentCategoryId = request.ParentCategoryId,
            Code = codeNormalized,
            NameAr = request.NameAr.Trim(),
            NameEn = request.NameEn.Trim(),
            DescriptionAr = request.DescriptionAr?.Trim(),
            DescriptionEn = request.DescriptionEn?.Trim(),
            DisplayOrder = request.DisplayOrder,
            IsActive = true,
            IsArchived = false,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.MaterialCategories.Add(category);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created material category {CategoryCode} ({CategoryId})", category.Code, category.Id);

        return MapCategory(category);
    }

    public async Task<CategoryDto> UpdateCategoryAsync(
        Guid id,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var category = await _context.MaterialCategories
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material category {id} was not found.");

        var codeNormalized = request.Code.Trim().ToUpperInvariant();
        if (!string.Equals(category.Code, codeNormalized, StringComparison.OrdinalIgnoreCase))
        {
            var codeExists = await _context.MaterialCategories
                .AnyAsync(c => c.Code == codeNormalized && c.Id != id, cancellationToken);

            if (codeExists)
            {
                throw new ConflictException($"Category with code '{codeNormalized}' already exists.");
            }
            category.Code = codeNormalized;
        }

        if (request.ParentCategoryId.HasValue && request.ParentCategoryId.Value != category.ParentCategoryId)
        {
            if (request.ParentCategoryId.Value == id)
            {
                throw new ConflictException("Category cannot be its own parent.");
            }

            var parentExists = await _context.MaterialCategories
                .AnyAsync(c => c.Id == request.ParentCategoryId.Value, cancellationToken);

            if (!parentExists)
            {
                throw new NotFoundException($"Parent category {request.ParentCategoryId.Value} not found.");
            }
        }

        category.ParentCategoryId = request.ParentCategoryId;
        category.NameAr = request.NameAr.Trim();
        category.NameEn = request.NameEn.Trim();
        category.DescriptionAr = request.DescriptionAr?.Trim();
        category.DescriptionEn = request.DescriptionEn?.Trim();
        category.DisplayOrder = request.DisplayOrder;
        category.IsActive = request.IsActive;
        category.IsArchived = request.IsArchived;

        await _context.SaveChangesAsync(cancellationToken);

        return MapCategory(category);
    }

    public async Task DeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _context.MaterialCategories
            .Include(c => c.SubCategories)
            .Include(c => c.Materials)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material category {id} was not found.");

        category.IsArchived = true;
        category.IsActive = false;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Archived material category {CategoryCode} ({CategoryId})", category.Code, id);
    }

    // -------------------------------------------------------------------------
    // Units of Measure
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<UnitOfMeasureDto>> GetUnitsAsync(
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UnitsOfMeasure.AsNoTracking();

        if (!includeInactive)
        {
            query = query.Where(u => u.IsActive);
        }

        return await query
            .OrderBy(u => u.DisplayOrder)
            .ThenBy(u => u.Code)
            .Select(u => new UnitOfMeasureDto(
                u.Id,
                u.Code,
                u.NameAr,
                u.NameEn,
                u.SymbolAr,
                u.SymbolEn,
                u.IsActive,
                u.DisplayOrder))
            .ToListAsync(cancellationToken);
    }

    public async Task<UnitOfMeasureDto> GetUnitByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var unit = await _context.UnitsOfMeasure
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Unit of measure {id} was not found.");

        return new UnitOfMeasureDto(
            unit.Id,
            unit.Code,
            unit.NameAr,
            unit.NameEn,
            unit.SymbolAr,
            unit.SymbolEn,
            unit.IsActive,
            unit.DisplayOrder);
    }

    public async Task<UnitOfMeasureDto> CreateUnitAsync(
        CreateUnitRequest request,
        CancellationToken cancellationToken = default)
    {
        var codeNormalized = request.Code.Trim().ToLowerInvariant();

        var codeExists = await _context.UnitsOfMeasure
            .AnyAsync(u => u.Code == codeNormalized, cancellationToken);

        if (codeExists)
        {
            throw new ConflictException($"Unit with code '{codeNormalized}' already exists.");
        }

        var unit = new UnitOfMeasure
        {
            Code = codeNormalized,
            NameAr = request.NameAr.Trim(),
            NameEn = request.NameEn.Trim(),
            SymbolAr = request.SymbolAr.Trim(),
            SymbolEn = request.SymbolEn.Trim(),
            DisplayOrder = request.DisplayOrder,
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.UnitsOfMeasure.Add(unit);
        await _context.SaveChangesAsync(cancellationToken);

        return new UnitOfMeasureDto(
            unit.Id,
            unit.Code,
            unit.NameAr,
            unit.NameEn,
            unit.SymbolAr,
            unit.SymbolEn,
            unit.IsActive,
            unit.DisplayOrder);
    }

    public async Task<UnitOfMeasureDto> UpdateUnitAsync(
        Guid id,
        UpdateUnitRequest request,
        CancellationToken cancellationToken = default)
    {
        var unit = await _context.UnitsOfMeasure
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Unit of measure {id} was not found.");

        var codeNormalized = request.Code.Trim().ToLowerInvariant();
        if (!string.Equals(unit.Code, codeNormalized, StringComparison.OrdinalIgnoreCase))
        {
            var codeExists = await _context.UnitsOfMeasure
                .AnyAsync(u => u.Code == codeNormalized && u.Id != id, cancellationToken);

            if (codeExists)
            {
                throw new ConflictException($"Unit with code '{codeNormalized}' already exists.");
            }
            unit.Code = codeNormalized;
        }

        unit.NameAr = request.NameAr.Trim();
        unit.NameEn = request.NameEn.Trim();
        unit.SymbolAr = request.SymbolAr.Trim();
        unit.SymbolEn = request.SymbolEn.Trim();
        unit.IsActive = request.IsActive;
        unit.DisplayOrder = request.DisplayOrder;

        await _context.SaveChangesAsync(cancellationToken);

        return new UnitOfMeasureDto(
            unit.Id,
            unit.Code,
            unit.NameAr,
            unit.NameEn,
            unit.SymbolAr,
            unit.SymbolEn,
            unit.IsActive,
            unit.DisplayOrder);
    }

    public async Task DeleteUnitAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var unit = await _context.UnitsOfMeasure
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Unit of measure {id} was not found.");

        unit.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);
    }

    // -------------------------------------------------------------------------
    // Materials
    // -------------------------------------------------------------------------

    public async Task<PagedResult<MaterialDto>> GetMaterialsAsync(
        CatalogMaterialFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Materials
            .AsNoTracking()
            .Include(m => m.Category)
            .Include(m => m.DefaultUnit)
            .AsQueryable();

        // Always restrict materials to the three official marketplace categories (Metals, Textiles, Food)
        var supportedCategoryCodes = MarketplaceCategories.SupportedCodes;
        query = query.Where(m => m.Category != null && m.Category.IsActive && !m.Category.IsArchived && supportedCategoryCodes.Contains(m.Category.Code.ToUpper()));

        if (filter.ActiveOnly == true)
        {
            query = query.Where(m => m.IsActive && !m.IsArchived);
        }

        if (filter.CategoryId.HasValue)
        {
            // Category or any descendant category
            var subCategoryIds = await _context.MaterialCategories
                .Where(c => c.ParentCategoryId == filter.CategoryId.Value)
                .Select(c => c.Id)
                .ToListAsync(cancellationToken);

            subCategoryIds.Add(filter.CategoryId.Value);

            query = query.Where(m => subCategoryIds.Contains(m.CategoryId));
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(m =>
                m.NameEn.ToLower().Contains(search) ||
                m.NameAr.ToLower().Contains(search) ||
                m.Code.ToLower().Contains(search) ||
                (m.DescriptionEn != null && m.DescriptionEn.ToLower().Contains(search)) ||
                (m.DescriptionAr != null && m.DescriptionAr.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "name" or "nameen" => filter.SortDescending ? query.OrderByDescending(m => m.NameEn) : query.OrderBy(m => m.NameEn),
            "namear" => filter.SortDescending ? query.OrderByDescending(m => m.NameAr) : query.OrderBy(m => m.NameAr),
            "code" => filter.SortDescending ? query.OrderByDescending(m => m.Code) : query.OrderBy(m => m.Code),
            _ => filter.SortDescending ? query.OrderByDescending(m => m.CreatedAtUtc) : query.OrderBy(m => m.NameEn)
        };

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(m => MapMaterial(m))
            .ToListAsync(cancellationToken);

        return PagedResult<MaterialDto>.Create(items, pageNumber, pageSize, totalCount);
    }

    public async Task<MaterialDto> GetMaterialByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var material = await _context.Materials
            .AsNoTracking()
            .Include(m => m.Category)
            .Include(m => m.DefaultUnit)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material {id} was not found.");

        return MapMaterial(material);
    }

    public async Task<MaterialDto> CreateMaterialAsync(
        CreateMaterialRequest request,
        CancellationToken cancellationToken = default)
    {
        var category = await _context.MaterialCategories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.IsActive && !c.IsArchived, cancellationToken)
            ?? throw new NotFoundException($"Active category {request.CategoryId} was not found.");

        if (!MarketplaceCategories.IsSupported(category.Code))
        {
            throw new ConflictException($"Material category must be one of the three supported marketplace categories: Textiles, Food, or Metals. Category '{category.Code}' is not supported.");
        }

        var unit = await _context.UnitsOfMeasure
            .FirstOrDefaultAsync(u => u.Id == request.DefaultUnitId && u.IsActive, cancellationToken)
            ?? throw new NotFoundException($"Active unit of measure {request.DefaultUnitId} was not found.");

        var codeNormalized = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _context.Materials
            .AnyAsync(m => m.Code == codeNormalized, cancellationToken);

        if (codeExists)
        {
            throw new ConflictException($"Material with code '{codeNormalized}' already exists.");
        }

        var material = new Material
        {
            CategoryId = category.Id,
            DefaultUnitId = unit.Id,
            Code = codeNormalized,
            NameAr = request.NameAr.Trim(),
            NameEn = request.NameEn.Trim(),
            DescriptionAr = request.DescriptionAr?.Trim(),
            DescriptionEn = request.DescriptionEn?.Trim(),
            AttributesJson = request.AttributesJson?.Trim(),
            IsActive = true,
            IsArchived = false
        };

        _context.Materials.Add(material);
        await _context.SaveChangesAsync(cancellationToken);

        material.Category = category;
        material.DefaultUnit = unit;

        _logger.LogInformation("Created industrial material {MaterialCode} ({MaterialId})", material.Code, material.Id);

        return MapMaterial(material);
    }

    public async Task<MaterialDto> UpdateMaterialAsync(
        Guid id,
        UpdateMaterialRequest request,
        CancellationToken cancellationToken = default)
    {
        var material = await _context.Materials
            .Include(m => m.Category)
            .Include(m => m.DefaultUnit)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material {id} was not found.");

        var category = await _context.MaterialCategories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken)
            ?? throw new NotFoundException($"Category {request.CategoryId} was not found.");

        if (!MarketplaceCategories.IsSupported(category.Code))
        {
            throw new ConflictException($"Material category must be one of the three supported marketplace categories: Textiles, Food, or Metals. Category '{category.Code}' is not supported.");
        }

        var unit = await _context.UnitsOfMeasure
            .FirstOrDefaultAsync(u => u.Id == request.DefaultUnitId, cancellationToken)
            ?? throw new NotFoundException($"Unit of measure {request.DefaultUnitId} was not found.");

        var codeNormalized = request.Code.Trim().ToUpperInvariant();
        if (!string.Equals(material.Code, codeNormalized, StringComparison.OrdinalIgnoreCase))
        {
            var codeExists = await _context.Materials
                .AnyAsync(m => m.Code == codeNormalized && m.Id != id, cancellationToken);

            if (codeExists)
            {
                throw new ConflictException($"Material with code '{codeNormalized}' already exists.");
            }
            material.Code = codeNormalized;
        }

        material.CategoryId = category.Id;
        material.DefaultUnitId = unit.Id;
        material.NameAr = request.NameAr.Trim();
        material.NameEn = request.NameEn.Trim();
        material.DescriptionAr = request.DescriptionAr?.Trim();
        material.DescriptionEn = request.DescriptionEn?.Trim();
        material.AttributesJson = request.AttributesJson?.Trim();
        material.IsActive = request.IsActive;
        material.IsArchived = request.IsArchived;

        await _context.SaveChangesAsync(cancellationToken);

        material.Category = category;
        material.DefaultUnit = unit;

        return MapMaterial(material);
    }

    public async Task DeleteMaterialAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var material = await _context.Materials
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material {id} was not found.");

        material.IsArchived = true;
        material.IsActive = false;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Archived industrial material {MaterialCode} ({MaterialId})", material.Code, id);
    }

    // -------------------------------------------------------------------------
    // Category Code Slug & Collision Helpers
    // -------------------------------------------------------------------------

    private static string NormalizeCategoryCode(string rawCode)
    {
        var upper = rawCode.Trim().ToUpperInvariant();
        var chars = upper.Select(c => char.IsLetterOrDigit(c) || c is '_' or '-' ? c : '_').ToArray();
        var normalized = new string(chars);
        while (normalized.Contains("__"))
        {
            normalized = normalized.Replace("__", "_");
        }
        normalized = normalized.Trim('_');
        if (string.IsNullOrWhiteSpace(normalized))
        {
            normalized = $"CAT_{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
        }
        return normalized.Length > 50 ? normalized[..50] : normalized;
    }

    private static string GenerateCategoryCodeSlug(string nameEn, string nameAr)
    {
        var source = !string.IsNullOrWhiteSpace(nameEn) ? nameEn.Trim() : nameAr.Trim();
        var upper = source.ToUpperInvariant();
        var chars = upper.Select(c => (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') ? c : '_').ToArray();
        var slug = new string(chars);
        while (slug.Contains("__"))
        {
            slug = slug.Replace("__", "_");
        }
        slug = slug.Trim('_');

        if (string.IsNullOrWhiteSpace(slug))
        {
            slug = $"CAT_{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
        }

        return slug.Length > 45 ? slug[..45] : slug;
    }

    private async Task<string> ResolveUniqueCategoryCodeAsync(string baseCode, CancellationToken cancellationToken)
    {
        var candidate = baseCode;
        var counter = 1;

        while (await _context.MaterialCategories.AnyAsync(c => c.Code == candidate, cancellationToken))
        {
            counter++;
            var suffix = $"_{counter}";
            var maxBaseLength = 50 - suffix.Length;
            var truncatedBase = baseCode.Length > maxBaseLength ? baseCode[..maxBaseLength] : baseCode;
            candidate = $"{truncatedBase}{suffix}";
        }

        return candidate;
    }

    // -------------------------------------------------------------------------
    // Mapping Helpers
    // -------------------------------------------------------------------------

    private static CategoryDto MapCategoryTree(MaterialCategory category, List<MaterialCategory> all, IReadOnlyList<string> allowedCodes)
    {
        var subCategories = all
            .Where(c => c.ParentCategoryId == category.Id)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.NameEn)
            .Select(c => MapCategoryTree(c, all, allowedCodes))
            .ToList();

        var isMarketplace = allowedCodes.Any(a => a.Equals(category.Code, StringComparison.OrdinalIgnoreCase));

        return new CategoryDto(
            category.Id,
            category.ParentCategoryId,
            category.Code,
            category.NameAr,
            category.NameEn,
            category.DescriptionAr,
            category.DescriptionEn,
            category.DisplayOrder,
            category.IsActive,
            category.IsArchived,
            subCategories,
            isMarketplace);
    }

    private CategoryDto MapCategory(MaterialCategory category)
    {
        var allowedCodes = GetAllowedMarketplaceCodes();
        var subCategories = category.SubCategories?
            .Select(MapCategory)
            .ToList() ?? [];

        var isMarketplace = allowedCodes.Any(a => a.Equals(category.Code, StringComparison.OrdinalIgnoreCase));

        return new CategoryDto(
            category.Id,
            category.ParentCategoryId,
            category.Code,
            category.NameAr,
            category.NameEn,
            category.DescriptionAr,
            category.DescriptionEn,
            category.DisplayOrder,
            category.IsActive,
            category.IsArchived,
            subCategories,
            isMarketplace);
    }

    private static MaterialDto MapMaterial(Material material)
    {
        return new MaterialDto(
            material.Id,
            material.CategoryId,
            material.Category?.NameAr ?? string.Empty,
            material.Category?.NameEn ?? string.Empty,
            material.Category?.Code ?? string.Empty,
            material.DefaultUnitId,
            material.DefaultUnit?.Code ?? string.Empty,
            material.DefaultUnit?.NameAr ?? string.Empty,
            material.DefaultUnit?.NameEn ?? string.Empty,
            material.Code,
            material.NameAr,
            material.NameEn,
            material.DescriptionAr,
            material.DescriptionEn,
            material.AttributesJson,
            material.IsActive,
            material.IsArchived,
            material.CreatedAtUtc);
    }

    // -------------------------------------------------------------------------
    // Direct Purchasing Catalog Products
    // -------------------------------------------------------------------------

    /// <summary>
    /// Returns ALL products owned by the authenticated supplier (including inactive/archived).
    /// Used by the supplier's "My Listed Products" management screen.
    /// No marketplace filters applied; ownership is enforced server-side from the JWT claim.
    /// </summary>
    public async Task<PagedResult<CatalogProductResponse>> GetMyProductsAsync(
        int pageNumber = 1,
        int pageSize = 100,
        CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var query = _context.CatalogProducts
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Unit)
            .Include(p => p.Material)
                .ThenInclude(m => m!.Category)
            .Include(p => p.Material)
                .ThenInclude(m => m!.DefaultUnit)
            .Include(p => p.SupplierCompany)
            .Where(p => p.SupplierCompanyId == company.Id)
            .OrderByDescending(p => p.CreatedAtUtc)
            .AsQueryable();

        var totalCount = await query.CountAsync(cancellationToken);
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var products = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = products.Select(p => MapProduct(p, 0m)).ToList();
        return PagedResult<CatalogProductResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    public async Task<PagedResult<CatalogProductResponse>> GetProductsAsync(
        CatalogProductFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.CatalogProducts
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Unit)
            .Include(p => p.Material)
                .ThenInclude(m => m!.Category)
            .Include(p => p.Material)
                .ThenInclude(m => m!.DefaultUnit)
            .Include(p => p.SupplierCompany)
            .AsQueryable();

        // Marketplace rule: Only products that are active AND whose supplier company is a verified, active, non-deleted Supplier
        query = query.Where(p =>
            p.IsActive &&
            !p.IsArchived &&
            p.SupplierCompany != null &&
            p.SupplierCompany.IsActive &&
            !p.SupplierCompany.IsDeleted &&
            p.SupplierCompany.CompanyType == CompanyType.Supplier &&
            p.SupplierCompany.VerificationStatus == CompanyVerificationStatus.Approved);

        if (filter.ActiveOnly == true)
        {
            query = query.Where(p => p.IsActive && !p.IsArchived);
        }

        // Only products in the supported marketplace categories from server configuration
        var supportedCodes = GetAllowedMarketplaceCodes();
        query = query.Where(p => supportedCodes.Contains(p.Category.Code.ToUpper()));

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);
        }

        if (filter.MaterialId.HasValue)
        {
            query = query.Where(p => p.MaterialId == filter.MaterialId.Value);
        }

        if (filter.SupplierCompanyId.HasValue)
        {
            query = query.Where(p => p.SupplierCompanyId == filter.SupplierCompanyId.Value);
        }

        if (filter.PricingMode.HasValue)
        {
            query = query.Where(p => (int)p.PricingMode == filter.PricingMode.Value);
        }

        var searchInput = filter.EffectiveSearchTerm;
        if (!string.IsNullOrWhiteSpace(searchInput))
        {
            var search = searchInput.Trim().ToLower();
            query = query.Where(p =>
                (p.NameEn != null && p.NameEn.ToLower().Contains(search)) ||
                p.NameAr.ToLower().Contains(search) ||
                (p.Sku != null && p.Sku.ToLower().Contains(search)) ||
                (p.Specifications != null && p.Specifications.ToLower().Contains(search)) ||
                (p.Material != null && (
                    p.Material.NameEn.ToLower().Contains(search) ||
                    p.Material.NameAr.ToLower().Contains(search) ||
                    p.Material.Code.ToLower().Contains(search))));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "price" or "unitprice" => filter.SortDescending ? query.OrderByDescending(p => p.UnitPrice) : query.OrderBy(p => p.UnitPrice),
            "name" or "nameen" => filter.SortDescending ? query.OrderByDescending(p => p.NameEn) : query.OrderBy(p => p.NameEn),
            "namear" => filter.SortDescending ? query.OrderByDescending(p => p.NameAr) : query.OrderBy(p => p.NameAr),
            "availablequantity" or "stock" => filter.SortDescending ? query.OrderByDescending(p => p.AvailableQuantity) : query.OrderBy(p => p.AvailableQuantity),
            _ => filter.SortDescending ? query.OrderByDescending(p => p.CreatedAtUtc) : query.OrderBy(p => p.NameEn)
        };

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var products = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        // Fetch supplier ratings for items on page
        var supplierIds = products.Select(p => p.SupplierCompanyId).Distinct().ToList();
        var ratings = await _context.Reviews
            .Where(r => supplierIds.Contains(r.TargetCompanyId) && !r.IsDeleted)
            .GroupBy(r => r.TargetCompanyId)
            .Select(g => new { CompanyId = g.Key, Avg = (decimal)g.Average(r => r.Rating) })
            .ToDictionaryAsync(x => x.CompanyId, x => Math.Round(x.Avg, 1), cancellationToken);

        var items = products.Select(p => MapProduct(p, ratings.TryGetValue(p.SupplierCompanyId, out var r) ? r : 0m)).ToList();

        return PagedResult<CatalogProductResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    public async Task<PagedResult<CatalogProductResponse>> GetAllProductsForAdminAsync(
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        // No active/verified/marketplace-category filters — show everything to the admin
        var query = _context.CatalogProducts
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Unit)
            .Include(p => p.Material)
                .ThenInclude(m => m!.Category)
            .Include(p => p.Material)
                .ThenInclude(m => m!.DefaultUnit)
            .Include(p => p.SupplierCompany)
            .OrderByDescending(p => p.CreatedAtUtc)
            .AsQueryable();

        var totalCount = await query.CountAsync(cancellationToken);
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var products = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = products.Select(p => MapProduct(p, 0m)).ToList();
        return PagedResult<CatalogProductResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    public async Task<CatalogProductResponse> GetProductByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _context.CatalogProducts
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Unit)
            .Include(p => p.Material)
                .ThenInclude(m => m!.Category)
            .Include(p => p.Material)
                .ThenInclude(m => m!.DefaultUnit)
            .Include(p => p.SupplierCompany)
            .FirstOrDefaultAsync(p => p.Id == id &&
                p.IsActive &&
                !p.IsArchived &&
                p.SupplierCompany != null &&
                p.SupplierCompany.IsActive &&
                !p.SupplierCompany.IsDeleted &&
                p.SupplierCompany.CompanyType == CompanyType.Supplier &&
                p.SupplierCompany.VerificationStatus == CompanyVerificationStatus.Approved,
                cancellationToken)
            ?? throw new NotFoundException($"Catalog product {id} was not found.");

        var avgRating = await _context.Reviews
            .Where(r => r.TargetCompanyId == product.SupplierCompanyId && !r.IsDeleted)
            .AverageAsync(r => (decimal?)r.Rating, cancellationToken) ?? 0m;

        return MapProduct(product, Math.Round(avgRating, 1));
    }

    public async Task<CatalogProductResponse> CreateProductAsync(
        CreateCatalogProductRequest request,
        CancellationToken cancellationToken = default)
    {
        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);
        company.AssertCanOperateAsSupplier();

        if (member.Role is not (CompanyRole.Owner or CompanyRole.Admin or CompanyRole.SalesManager))
        {
            throw new ForbiddenException("Only company Owners, Admins, and Sales Managers can list catalog products.");
        }

        if (request.PricingMode == (int)ProductPricingMode.Fixed && (!request.UnitPrice.HasValue || request.UnitPrice.Value <= 0))
        {
            throw new ValidationException(nameof(request.UnitPrice), "Product unit price must be greater than zero for fixed pricing.");
        }

        if (request.MinimumOrderQuantity <= 0)
        {
            throw new ValidationException(nameof(request.MinimumOrderQuantity), "Minimum order quantity must be greater than zero.");
        }

        Material? material = null;
        if (request.MaterialId.HasValue && request.MaterialId.Value != Guid.Empty)
        {
            material = await _context.Materials
                .Include(m => m.Category)
                .Include(m => m.DefaultUnit)
                .FirstOrDefaultAsync(m => m.Id == request.MaterialId.Value && m.IsActive && !m.IsArchived, cancellationToken)
                ?? throw new NotFoundException($"Active material {request.MaterialId.Value} was not found.");
        }

        var categoryId = request.CategoryId != Guid.Empty
            ? request.CategoryId
            : (material?.CategoryId ?? Guid.Empty);

        if (categoryId == Guid.Empty)
        {
            throw new ValidationException(nameof(request.CategoryId), "A valid CategoryId is required for marketplace products.");
        }

        var category = await _context.MaterialCategories
            .Include(c => c.ParentCategory)
            .FirstOrDefaultAsync(c => c.Id == categoryId && c.IsActive && !c.IsArchived, cancellationToken)
            ?? material?.Category;

        if (category == null)
        {
            throw new NotFoundException($"Active category {categoryId} was not found.");
        }

        var rootCategoryCode = category.ParentCategory?.Code ?? category.Code;
        var allowedMarketplaceCodes = GetAllowedMarketplaceCodes();
        if (!allowedMarketplaceCodes.Any(c => c.Equals(rootCategoryCode, StringComparison.OrdinalIgnoreCase)))
        {
            throw new ConflictException($"Products can only be listed in one of the supported marketplace categories ({string.Join(", ", allowedMarketplaceCodes)}). Category '{category.Code}' is not supported.");
        }

        // Resolve unit
        UnitOfMeasure? unit = null;
        if (request.UnitId.HasValue && request.UnitId.Value != Guid.Empty)
        {
            unit = await _context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Id == request.UnitId.Value && u.IsActive, cancellationToken);
        }

        if (unit == null && !string.IsNullOrWhiteSpace(request.Unit))
        {
            var unitCodeReq = request.Unit.Trim().ToLowerInvariant();
            unit = await _context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Code == unitCodeReq && u.IsActive, cancellationToken);
        }

        if (unit == null && material?.DefaultUnit != null)
        {
            unit = material.DefaultUnit;
        }

        if (unit == null)
        {
            unit = await _context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Code == "ton", cancellationToken)
                ?? await _context.UnitsOfMeasure.FirstAsync(cancellationToken);
        }

        var skuNormalized = string.IsNullOrWhiteSpace(request.Sku)
            ? $"SKU-{category.Code[..Math.Min(3, category.Code.Length)]}-{Guid.NewGuid().ToString("N")[..6]}".ToUpperInvariant()
            : request.Sku.Trim().ToUpperInvariant();

        var skuExists = await _context.CatalogProducts
            .AnyAsync(p => p.Sku == skuNormalized && p.SupplierCompanyId == company.Id, cancellationToken);

        if (skuExists)
        {
            throw new ConflictException($"Product with SKU '{skuNormalized}' already exists for your company.");
        }

        var product = new CatalogProduct
        {
            CategoryId = category.Id,
            MaterialId = material?.Id,
            UnitId = unit.Id,
            SupplierCompanyId = company.Id,
            Sku = string.IsNullOrWhiteSpace(request.Sku) ? null : request.Sku.Trim().ToUpperInvariant(),
            NameAr = request.NameAr.Trim(),
            NameEn = string.IsNullOrWhiteSpace(request.NameEn) ? null : request.NameEn.Trim(),
            DescriptionAr = string.IsNullOrWhiteSpace(request.DescriptionAr) ? null : request.DescriptionAr.Trim(),
            DescriptionEn = string.IsNullOrWhiteSpace(request.DescriptionEn) ? null : request.DescriptionEn.Trim(),
            Specifications = string.IsNullOrWhiteSpace(request.Specifications) ? null : request.Specifications.Trim(),
            PricingMode = (ProductPricingMode)request.PricingMode,
            UnitPrice = request.PricingMode == (int)ProductPricingMode.Negotiable ? null : request.UnitPrice,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "EGP" : request.Currency.Trim().ToUpperInvariant(),
            AvailableQuantity = request.AvailableQuantity,
            MinimumOrderQuantity = request.MinimumOrderQuantity,
            DeliveryLeadTimeDays = request.DeliveryLeadTimeDays,
            ImageUrlsJson = request.ImageUrlsJson,
            IsActive = true,
            IsArchived = false
        };

        _context.CatalogProducts.Add(product);
        await _context.SaveChangesAsync(cancellationToken);

        product.Category = category;
        product.Material = material;
        product.Unit = unit;
        product.SupplierCompany = company;

        _logger.LogInformation("Created catalog product {Sku} ({ProductId}) for supplier company {CompanyId}", product.Sku, product.Id, company.Id);

        return MapProduct(product, 0m);
    }

    public async Task<CatalogProductResponse> UpdateProductAsync(
        Guid id,
        UpdateCatalogProductRequest request,
        CancellationToken cancellationToken = default)
    {
        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);
        company.AssertCanOperateAsSupplier();

        if (member.Role is not (CompanyRole.Owner or CompanyRole.Admin or CompanyRole.SalesManager))
        {
            throw new ForbiddenException("Only company Owners, Admins, and Sales Managers can update catalog products.");
        }

        if (request.PricingMode == (int)ProductPricingMode.Fixed && (!request.UnitPrice.HasValue || request.UnitPrice.Value <= 0))
        {
            throw new ValidationException(nameof(request.UnitPrice), "Product unit price must be greater than zero for fixed pricing.");
        }

        if (request.MinimumOrderQuantity <= 0)
        {
            throw new ValidationException(nameof(request.MinimumOrderQuantity), "Minimum order quantity must be greater than zero.");
        }

        var product = await _context.CatalogProducts
            .Include(p => p.Category)
            .Include(p => p.Unit)
            .Include(p => p.Material)
                .ThenInclude(m => m!.Category)
            .Include(p => p.Material)
                .ThenInclude(m => m!.DefaultUnit)
            .Include(p => p.SupplierCompany)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Catalog product {id} was not found.");

        if (product.SupplierCompanyId != company.Id)
        {
            throw new NotFoundException($"Catalog product {id} was not found.");
        }

        if (request.UnitId.HasValue && request.UnitId.Value != Guid.Empty)
        {
            var unit = await _context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Id == request.UnitId.Value && u.IsActive, cancellationToken);
            if (unit != null)
            {
                product.UnitId = unit.Id;
                product.Unit = unit;
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.Unit))
        {
            var unitCodeReq = request.Unit.Trim().ToLowerInvariant();
            var unit = await _context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Code == unitCodeReq && u.IsActive, cancellationToken);
            if (unit != null)
            {
                product.UnitId = unit.Id;
                product.Unit = unit;
            }
        }

        product.NameAr = request.NameAr.Trim();
        product.NameEn = string.IsNullOrWhiteSpace(request.NameEn) ? null : request.NameEn.Trim();
        product.DescriptionAr = string.IsNullOrWhiteSpace(request.DescriptionAr) ? null : request.DescriptionAr.Trim();
        product.DescriptionEn = string.IsNullOrWhiteSpace(request.DescriptionEn) ? null : request.DescriptionEn.Trim();
        product.Specifications = string.IsNullOrWhiteSpace(request.Specifications) ? null : request.Specifications.Trim();
        product.PricingMode = (ProductPricingMode)request.PricingMode;
        product.UnitPrice = request.PricingMode == (int)ProductPricingMode.Negotiable ? null : request.UnitPrice;
        product.Currency = string.IsNullOrWhiteSpace(request.Currency) ? "EGP" : request.Currency.Trim().ToUpperInvariant();
        product.AvailableQuantity = request.AvailableQuantity;
        product.MinimumOrderQuantity = request.MinimumOrderQuantity;
        product.DeliveryLeadTimeDays = request.DeliveryLeadTimeDays;
        product.ImageUrlsJson = request.ImageUrlsJson;
        product.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated catalog product {Sku} ({ProductId})", product.Sku, product.Id);

        var avgRating = await _context.Reviews
            .Where(r => r.TargetCompanyId == product.SupplierCompanyId && !r.IsDeleted)
            .AverageAsync(r => (decimal?)r.Rating, cancellationToken) ?? 0m;

        return MapProduct(product, Math.Round(avgRating, 1));
    }

    public async Task DeleteProductAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);
        company.AssertCanOperateAsSupplier();

        if (member.Role is not (CompanyRole.Owner or CompanyRole.Admin or CompanyRole.SalesManager))
        {
            throw new ForbiddenException("Only company Owners, Admins, and Sales Managers can delete catalog products.");
        }

        var product = await _context.CatalogProducts
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Catalog product {id} was not found.");

        if (product.SupplierCompanyId != company.Id)
        {
            throw new NotFoundException($"Catalog product {id} was not found.");
        }

        product.IsActive = false;
        product.IsArchived = true;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Archived catalog product {Sku} ({ProductId})", product.Sku, product.Id);
    }

    private async Task<(Company company, CompanyMember member)> RequireApprovedCompanyAsync(CancellationToken cancellationToken)
    {
        var userId = _currentUser.Id ?? throw new UnauthorizedException("User is not authenticated.");

        var member = await _context.CompanyMembers
            .Include(m => m.Company)
            .FirstOrDefaultAsync(m => m.UserId == userId && m.IsActive, cancellationToken)
            ?? throw new UnauthorizedException("No active company membership found for the current user.");

        var company = member.Company;
        if (company == null || !company.CanPerformCommercialActivities)
        {
            throw new ForbiddenException("Only verified and approved companies are authorized to perform commercial marketplace activities.");
        }

        return (company, member);
    }

    private static CatalogProductResponse MapProduct(CatalogProduct p, decimal rating = 0m)
    {
        var categoryCode = p.Category?.Code ?? p.Material?.Category?.Code ?? string.Empty;
        var categoryNameAr = p.Category?.NameAr ?? p.Material?.Category?.NameAr ?? string.Empty;
        var categoryNameEn = p.Category?.NameEn ?? p.Material?.Category?.NameEn ?? string.Empty;
        var unitCode = p.Unit?.Code ?? p.Material?.DefaultUnit?.Code ?? "ton";

        return new CatalogProductResponse(
            p.Id,
            p.MaterialId,
            p.Material?.Code,
            p.Material?.NameAr,
            p.Material?.NameEn,
            p.CategoryId != Guid.Empty ? p.CategoryId : (p.Material?.CategoryId ?? Guid.Empty),
            categoryCode,
            categoryNameAr,
            categoryNameEn,
            unitCode,
            p.SupplierCompanyId,
            p.SupplierCompany?.LegalName ?? string.Empty,
            p.Sku,
            p.NameAr,
            p.NameEn,
            p.DescriptionAr,
            p.DescriptionEn,
            p.Specifications,
            (int)p.PricingMode,
            p.UnitPrice,
            p.Currency,
            p.AvailableQuantity,
            p.MinimumOrderQuantity,
            p.DeliveryLeadTimeDays,
            p.ImageUrlsJson,
            p.IsActive,
            p.CreatedAtUtc,
            p.SupplierCompany?.City,
            p.SupplierCompany?.Governorate,
            p.SupplierCompany != null && p.SupplierCompany.VerificationStatus == CompanyVerificationStatus.Approved,
            rating);
    }
}

