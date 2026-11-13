using System.Text.Json;
using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Application.Deals.DTOs;
using DealZone.Application.Purchasing.DTOs;
using DealZone.Domain.Catalog;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Notifications;
using DealZone.Domain.Purchasing;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Services;

public class PurchasingService : IPurchasingService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly INotificationService _notificationService;
    private readonly ILogger<PurchasingService> _logger;

    public PurchasingService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        IDateTimeProvider dateTimeProvider,
        INotificationService notificationService,
        ILogger<PurchasingService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _dateTimeProvider = dateTimeProvider;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<DirectPurchaseResponse> CreateDirectPurchaseAsync(
        CreateDirectPurchaseRequest request,
        CancellationToken cancellationToken = default)
    {
        var now = _dateTimeProvider.UtcNow;
        var (buyerCompany, buyerMember) = await RequireApprovedCompanyAsync(cancellationToken);

        // Role check: Buyer owner, admin, or procurement manager
        if (buyerMember.Role is not (CompanyRole.Owner or CompanyRole.Admin or CompanyRole.ProcurementManager))
        {
            throw new ForbiddenException("Only company Owners, Admins, and Procurement Managers can place direct purchase orders.");
        }

        // Fetch catalog product with category, material, and supplier company
        var product = await _context.CatalogProducts
            .Include(p => p.Category)
            .Include(p => p.Material)
                .ThenInclude(m => m!.Category)
            .Include(p => p.Material)
                .ThenInclude(m => m!.DefaultUnit)
            .Include(p => p.SupplierCompany)
            .FirstOrDefaultAsync(p => p.Id == request.CatalogProductId, cancellationToken)
            ?? throw new NotFoundException($"Catalog product {request.CatalogProductId} was not found.");

        if (!product.IsActive || product.IsArchived)
        {
            throw new ConflictException("The selected catalog product is not currently available for direct purchase.");
        }

        if (product.PricingMode == ProductPricingMode.Negotiable)
        {
            throw new ConflictException("This product has negotiable pricing and cannot be purchased directly. Please make an offer to negotiate terms with the supplier.");
        }

        // Ensure category is one of the three supported marketplace categories
        var categoryCode = product.Category?.Code ?? product.Material?.Category?.Code ?? string.Empty;
        if (!MarketplaceCategories.IsSupported(categoryCode))
        {
            throw new ConflictException($"Direct purchasing is only supported for the official marketplace categories (Textiles, Food, Metals). The product category '{categoryCode}' is not supported.");
        }

        // Validate supplier company is active and approved for commercial activities
        var supplier = product.SupplierCompany;
        if (supplier == null || !supplier.CanPerformCommercialActivities)
        {
            throw new ConflictException("The product supplier is not currently authorized for marketplace commercial activities.");
        }

        // Marketplace rule: Buyer cannot purchase products listed by their own company
        if (buyerCompany.Id == product.SupplierCompanyId)
        {
            throw new ConflictException("A company cannot purchase its own catalog products.");
        }

        var unitName = product.Unit ?? product.Material?.DefaultUnit?.SymbolEn ?? "units";

        // Quantity constraints validation
        if (request.Quantity <= 0)
        {
            throw new ValidationException(nameof(request.Quantity), "Purchase quantity must be greater than zero.");
        }

        if (request.Quantity < product.MinimumOrderQuantity)
        {
            throw new ValidationException(
                nameof(request.Quantity),
                $"Requested quantity ({request.Quantity:G29}) is less than the minimum order quantity ({product.MinimumOrderQuantity:G29} {unitName}).");
        }

        if (request.Quantity > product.AvailableQuantity)
        {
            throw new ConflictException(
                $"Requested quantity ({request.Quantity:G29}) exceeds available stock ({product.AvailableQuantity:G29} {unitName}).");
        }

        // Server-side calculation — NEVER trust client-submitted prices
        var unitPrice = product.UnitPrice;
        var totalPrice = Math.Round(unitPrice * request.Quantity, 2);
        var currency = string.IsNullOrWhiteSpace(product.Currency) ? "EGP" : product.Currency.Trim().ToUpperInvariant();

        // Concurrency token & stock deduction
        product.AvailableQuantity -= request.Quantity;

        var purchaseNumber = $"DP-{now:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
        var dealNumber = $"DEAL-{now:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
        var estimatedDeliveryDate = now.AddDays(product.DeliveryLeadTimeDays);

        // Build product snapshot JSON
        var productSnapshot = new DirectPurchaseItemSnapshot(
            product.Id,
            product.Sku,
            product.NameAr,
            product.NameEn,
            product.MaterialId.GetValueOrDefault(),
            product.Material?.Code ?? product.Sku,
            product.Material?.NameAr ?? product.NameAr,
            product.Material?.NameEn ?? product.NameEn,
            product.Material?.DefaultUnit?.Code ?? product.Unit,
            product.Material?.DefaultUnit?.NameAr ?? product.Unit,
            product.Material?.DefaultUnit?.NameEn ?? product.Unit,
            categoryCode,
            request.Quantity,
            unitPrice,
            totalPrice,
            currency,
            product.DeliveryLeadTimeDays,
            now);

        var productSnapshotJson = JsonSerializer.Serialize(productSnapshot);

        var directPurchase = new DirectPurchase
        {
            PurchaseNumber = purchaseNumber,
            BuyerCompanyId = buyerCompany.Id,
            BuyerUserId = _currentUser.Id!.Value,
            SupplierCompanyId = product.SupplierCompanyId,
            CatalogProductId = product.Id,
            Quantity = request.Quantity,
            UnitPrice = unitPrice,
            TotalPrice = totalPrice,
            Currency = currency,
            DeliveryLeadTimeDays = product.DeliveryLeadTimeDays,
            EstimatedDeliveryDateUtc = estimatedDeliveryDate,
            DeliveryAddress = request.DeliveryAddress?.Trim(),
            Notes = request.Notes?.Trim(),
            ProductSnapshotJson = productSnapshotJson,
            Status = DirectPurchaseStatus.Submitted,
            CreatedAtUtc = now
        };

        _context.DirectPurchases.Add(directPurchase);

        // Build commercial terms snapshot for Deal
        var dealItemSnapshot = new DealItemSnapshot(
            product.Id,
            product.NameEn,
            unitPrice,
            request.Quantity,
            totalPrice,
            $"Material: {product.Material?.NameEn ?? product.NameEn} ({product.Material?.Code ?? product.Sku})",
            request.Notes?.Trim());

        var deliveryTermsSummary = $"Standard Delivery / Direct Purchase; Lead Time: {product.DeliveryLeadTimeDays} days";

        var termsSnapshot = new DealCommercialTermsSnapshot(
            directPurchase.Id,
            1,
            purchaseNumber,
            product.Id,
            product.Sku,
            product.NameEn,
            totalPrice,
            currency,
            product.DeliveryLeadTimeDays,
            false,
            "Direct Purchase Standard Terms",
            deliveryTermsSummary,
            estimatedDeliveryDate,
            now.AddDays(30),
            request.Notes?.Trim(),
            [dealItemSnapshot]);

        var termsSnapshotJson = JsonSerializer.Serialize(termsSnapshot);

        var deal = new Deal
        {
            DealNumber = dealNumber,
            Source = DealSource.DirectPurchase,
            DirectPurchase = directPurchase,
            BuyerCompanyId = buyerCompany.Id,
            SupplierCompanyId = product.SupplierCompanyId,
            AgreedPrice = totalPrice,
            Currency = currency,
            Status = DealStatus.AwaitingConfirmation,
            ConfirmedByBuyerAtUtc = now,
            ConfirmedByBuyerUserId = _currentUser.Id!.Value,
            DeliveryTerms = deliveryTermsSummary,
            EstimatedDeliveryDateUtc = estimatedDeliveryDate,
            CommercialTermsSnapshotJson = termsSnapshotJson,
            CreatedAtUtc = now
        };

        _context.Deals.Add(deal);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Concurrency conflict during direct purchase for product {ProductId}", product.Id);
            throw new ConflictException("The product inventory or availability changed during your purchase request. Please refresh and try again.");
        }

        _logger.LogInformation(
            "Direct purchase {PurchaseNumber} created for buyer company {BuyerCompanyId} and supplier {SupplierCompanyId}. Deal {DealNumber} created.",
            directPurchase.PurchaseNumber, buyerCompany.Id, product.SupplierCompanyId, deal.DealNumber);

        // Notify Supplier company members
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            product.SupplierCompanyId,
            [CompanyRole.Owner, CompanyRole.Admin, CompanyRole.SalesManager],
            NotificationType.DealCreated,
            "New Direct Purchase Order",
            $"A new direct purchase order ({directPurchase.PurchaseNumber}) for {request.Quantity:G29} {unitName} of '{product.NameEn}' was placed. Deal {deal.DealNumber} awaits confirmation.",
            "Deal",
            deal.Id,
            $"direct_purchase_created_{directPurchase.Id}_{product.SupplierCompanyId}",
            cancellationToken);

        // Notify Buyer company members
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            buyerCompany.Id,
            [CompanyRole.Owner, CompanyRole.Admin, CompanyRole.ProcurementManager],
            NotificationType.DealCreated,
            "Direct Purchase Submitted",
            $"Direct purchase order {directPurchase.PurchaseNumber} was submitted. Commercial deal {deal.DealNumber} is awaiting mutual confirmation.",
            "Deal",
            deal.Id,
            $"direct_purchase_buyer_{directPurchase.Id}_{buyerCompany.Id}",
            cancellationToken);

        return MapDirectPurchase(directPurchase, product, buyerCompany, supplier, deal);
    }

    public async Task<PagedResult<DirectPurchaseResponse>> GetDirectPurchasesAsync(
        DirectPurchaseFilter filter,
        CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var query = _context.DirectPurchases
            .AsNoTracking()
            .Include(p => p.CatalogProduct)
                .ThenInclude(cp => cp.Material)
                    .ThenInclude(m => m.DefaultUnit)
            .Include(p => p.BuyerCompany)
            .Include(p => p.SupplierCompany)
            .Include(p => p.Deal)
            .Where(p => p.BuyerCompanyId == company.Id || p.SupplierCompanyId == company.Id);

        if (!string.IsNullOrWhiteSpace(filter.Status) &&
            Enum.TryParse<DirectPurchaseStatus>(filter.Status, true, out var status))
        {
            query = query.Where(p => p.Status == status);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var purchases = await query
            .OrderByDescending(p => p.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = purchases.Select(p => MapDirectPurchase(p, p.CatalogProduct, p.BuyerCompany, p.SupplierCompany, p.Deal)).ToList();

        return PagedResult<DirectPurchaseResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    public async Task<DirectPurchaseResponse> GetDirectPurchaseByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var purchase = await _context.DirectPurchases
            .AsNoTracking()
            .Include(p => p.CatalogProduct)
                .ThenInclude(cp => cp.Material)
                    .ThenInclude(m => m.DefaultUnit)
            .Include(p => p.BuyerCompany)
            .Include(p => p.SupplierCompany)
            .Include(p => p.Deal)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Direct purchase {id} was not found.");

        if (purchase.BuyerCompanyId != company.Id && purchase.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("You do not have permission to view this purchase order.");
        }

        return MapDirectPurchase(purchase, purchase.CatalogProduct, purchase.BuyerCompany, purchase.SupplierCompany, purchase.Deal);
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

    private static DirectPurchaseResponse MapDirectPurchase(
        DirectPurchase p,
        CatalogProduct prod,
        Company buyer,
        Company supplier,
        Deal? deal)
    {
        return new DirectPurchaseResponse(
            p.Id,
            p.PurchaseNumber,
            p.BuyerCompanyId,
            buyer.LegalName,
            p.SupplierCompanyId,
            supplier.LegalName,
            prod.Id,
            prod.Sku,
            prod.NameAr,
            prod.NameEn,
            prod.Material?.Code ?? prod.Sku,
            prod.Material?.NameAr ?? prod.NameAr,
            prod.Material?.NameEn ?? prod.NameEn,
            prod.Material?.DefaultUnit?.Code ?? prod.Unit,
            prod.Material?.DefaultUnit?.NameAr ?? prod.Unit,
            prod.Material?.DefaultUnit?.NameEn ?? prod.Unit,
            p.Quantity,
            p.UnitPrice,
            p.TotalPrice,
            p.Currency,
            p.DeliveryLeadTimeDays,
            p.EstimatedDeliveryDateUtc,
            p.DeliveryAddress,
            p.Notes,
            p.Status.ToString(),
            deal?.Id,
            deal?.DealNumber,
            p.CreatedAtUtc);
    }
}
