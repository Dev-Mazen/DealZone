using System.Text.Json;
using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
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

public class NegotiationService : INegotiationService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly INotificationService _notificationService;
    private readonly ILogger<NegotiationService> _logger;

    public NegotiationService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        IDateTimeProvider dateTimeProvider,
        INotificationService notificationService,
        ILogger<NegotiationService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _dateTimeProvider = dateTimeProvider;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<ProductNegotiationResponse> CreateNegotiationAsync(
        CreateProductNegotiationRequest request,
        CancellationToken cancellationToken = default)
    {
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id ?? throw new UnauthorizedException("User is not authenticated.");

        var (buyerCompany, buyerMember) = await RequireApprovedCompanyAsync(cancellationToken);

        if (buyerMember.Role is not (CompanyRole.Owner or CompanyRole.Admin or CompanyRole.ProcurementManager))
        {
            throw new ForbiddenException("Only company Owners, Admins, and Procurement Managers can initiate price negotiations.");
        }

        var product = await _context.CatalogProducts
            .Include(p => p.Category)
            .Include(p => p.Material)
                .ThenInclude(m => m!.DefaultUnit)
            .Include(p => p.SupplierCompany)
            .FirstOrDefaultAsync(p => p.Id == request.CatalogProductId, cancellationToken)
            ?? throw new NotFoundException($"Catalog product {request.CatalogProductId} was not found.");

        if (!product.IsActive || product.IsArchived)
        {
            throw new ConflictException("The selected catalog product is not currently available for negotiation.");
        }

        if (buyerCompany.Id == product.SupplierCompanyId)
        {
            throw new ConflictException("A company cannot negotiate with itself.");
        }

        var supplier = product.SupplierCompany;
        if (supplier == null || !supplier.CanPerformCommercialActivities)
        {
            throw new ConflictException("The product supplier is not currently authorized for marketplace commercial activities.");
        }

        if (request.Quantity <= 0)
        {
            throw new ValidationException(nameof(request.Quantity), "Quantity must be greater than zero.");
        }

        if (request.ProposedUnitPrice < 0)
        {
            throw new ValidationException(nameof(request.ProposedUnitPrice), "Proposed price cannot be negative.");
        }

        // Check no active open negotiation already exists for this buyer + product
        var existing = await _context.ProductNegotiations
            .AnyAsync(n =>
                n.CatalogProductId == request.CatalogProductId &&
                n.BuyerCompanyId == buyerCompany.Id &&
                (n.Status == ProductNegotiationStatus.PendingSupplierResponse ||
                 n.Status == ProductNegotiationStatus.CounterofferPendingBuyerResponse),
                cancellationToken);

        if (existing)
        {
            throw new ConflictException("You already have an active negotiation for this product. Please resolve it before starting a new one.");
        }

        var totalPrice = Math.Round(request.ProposedUnitPrice * request.Quantity, 2);
        var negotiationNumber = $"NEG-{now:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        var negotiation = new ProductNegotiation
        {
            NegotiationNumber = negotiationNumber,
            CatalogProductId = product.Id,
            BuyerCompanyId = buyerCompany.Id,
            BuyerUserId = userId,
            SupplierCompanyId = product.SupplierCompanyId,
            CurrentUnitPrice = request.ProposedUnitPrice,
            Quantity = request.Quantity,
            CurrentTotalPrice = totalPrice,
            Currency = product.Currency ?? "EGP",
            DeliveryLeadTimeDays = request.DeliveryLeadTimeDays,
            DeliveryAddress = request.DeliveryAddress?.Trim(),
            Notes = request.Notes?.Trim(),
            Status = ProductNegotiationStatus.PendingSupplierResponse,
            LastActionByCompanyId = buyerCompany.Id,
            LastActionByUserId = userId,
            CreatedAtUtc = now,
            LastModifiedAtUtc = now
        };

        var revision = new ProductNegotiationRevision
        {
            RevisionNumber = 1,
            ProposedByCompanyId = buyerCompany.Id,
            ProposedByUserId = userId,
            UnitPrice = request.ProposedUnitPrice,
            Quantity = request.Quantity,
            TotalPrice = totalPrice,
            DeliveryLeadTimeDays = request.DeliveryLeadTimeDays,
            Notes = request.Notes?.Trim(),
            CreatedAtUtc = now
        };
        negotiation.Revisions.Add(revision);

        _context.ProductNegotiations.Add(negotiation);
        await _context.SaveChangesAsync(cancellationToken);

        // Notify supplier
        await _notificationService.CreateNotificationAsync(
            await GetSupplierOwnerUserIdAsync(product.SupplierCompanyId, cancellationToken),
            NotificationType.OfferSubmitted,
            "عرض سعر جديد في انتظار ردك",
            $"قدّمت شركة '{buyerCompany.LegalName}' عرض سعر جديد بشأن منتجك '{product.NameAr}' بسعر {request.ProposedUnitPrice:N0} ج.م.",
            "Negotiation",
            negotiation.Id,
            $"notif-neg-new-{negotiation.Id}",
            cancellationToken);

        negotiation.CatalogProduct = product;
        negotiation.BuyerCompany = buyerCompany;
        negotiation.SupplierCompany = supplier;

        _logger.LogInformation("Created product negotiation {Number} for product {ProductId} by buyer {BuyerCompanyId}",
            negotiationNumber, product.Id, buyerCompany.Id);

        return await MapNegotiationAsync(negotiation, cancellationToken);
    }

    public async Task<PagedResult<ProductNegotiationResponse>> GetMyNegotiationsAsync(
        ProductNegotiationFilter filter,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id ?? throw new UnauthorizedException("User is not authenticated.");

        var member = await _context.CompanyMembers
            .Include(m => m.Company)
            .FirstOrDefaultAsync(m => m.UserId == userId && m.IsActive, cancellationToken)
            ?? throw new UnauthorizedException("No active company membership found.");

        var companyId = member.CompanyId;

        var query = _context.ProductNegotiations
            .AsNoTracking()
            .Include(n => n.CatalogProduct)
                .ThenInclude(p => p.Category)
            .Include(n => n.BuyerCompany)
            .Include(n => n.SupplierCompany)
            .Include(n => n.Deal)
            .Where(n => n.BuyerCompanyId == companyId || n.SupplierCompanyId == companyId);

        if (filter.CatalogProductId.HasValue)
        {
            query = query.Where(n => n.CatalogProductId == filter.CatalogProductId.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(n => (int)n.Status == filter.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 50);

        var negotiations = await query
            .OrderByDescending(n => n.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(n => n.Revisions)
            .ToListAsync(cancellationToken);

        var items = new List<ProductNegotiationResponse>();
        foreach (var n in negotiations)
        {
            items.Add(await MapNegotiationAsync(n, cancellationToken));
        }

        return PagedResult<ProductNegotiationResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    public async Task<ProductNegotiationResponse> GetNegotiationByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id ?? throw new UnauthorizedException("User is not authenticated.");

        var member = await _context.CompanyMembers
            .FirstOrDefaultAsync(m => m.UserId == userId && m.IsActive, cancellationToken)
            ?? throw new UnauthorizedException("No active company membership found.");

        var companyId = member.CompanyId;

        var negotiation = await _context.ProductNegotiations
            .AsNoTracking()
            .Include(n => n.CatalogProduct)
                .ThenInclude(p => p.Category)
            .Include(n => n.BuyerCompany)
            .Include(n => n.SupplierCompany)
            .Include(n => n.Deal)
            .Include(n => n.Revisions)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Negotiation {id} was not found.");

        if (negotiation.BuyerCompanyId != companyId && negotiation.SupplierCompanyId != companyId)
        {
            throw new ForbiddenException("You do not have access to this negotiation.");
        }

        return await MapNegotiationAsync(negotiation, cancellationToken);
    }

    public async Task<ProductNegotiationResponse> CounterNegotiationAsync(
        Guid id,
        CounterNegotiationRequest request,
        CancellationToken cancellationToken = default)
    {
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id ?? throw new UnauthorizedException("User is not authenticated.");

        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var negotiation = await _context.ProductNegotiations
            .Include(n => n.CatalogProduct)
                .ThenInclude(p => p.Category)
            .Include(n => n.BuyerCompany)
            .Include(n => n.SupplierCompany)
            .Include(n => n.Revisions)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Negotiation {id} was not found.");

        // Validate access and turn
        if (negotiation.BuyerCompanyId != company.Id && negotiation.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("You do not have access to this negotiation.");
        }

        if (negotiation.Status == ProductNegotiationStatus.PendingSupplierResponse && negotiation.SupplierCompanyId != company.Id)
        {
            throw new ConflictException("It is the supplier's turn to respond.");
        }

        if (negotiation.Status == ProductNegotiationStatus.CounterofferPendingBuyerResponse && negotiation.BuyerCompanyId != company.Id)
        {
            throw new ConflictException("It is the buyer's turn to respond.");
        }

        if (negotiation.Status is not (ProductNegotiationStatus.PendingSupplierResponse or ProductNegotiationStatus.CounterofferPendingBuyerResponse))
        {
            throw new ConflictException($"Cannot counter a negotiation in '{negotiation.Status}' status.");
        }

        var newQuantity = request.Quantity ?? negotiation.Quantity;
        var newLeadTime = request.DeliveryLeadTimeDays ?? negotiation.DeliveryLeadTimeDays;
        var newTotal = Math.Round(request.ProposedUnitPrice * newQuantity, 2);
        var revisionNumber = negotiation.Revisions.Count + 1;

        var revision = new ProductNegotiationRevision
        {
            RevisionNumber = revisionNumber,
            ProposedByCompanyId = company.Id,
            ProposedByUserId = userId,
            UnitPrice = request.ProposedUnitPrice,
            Quantity = newQuantity,
            TotalPrice = newTotal,
            DeliveryLeadTimeDays = newLeadTime,
            Notes = request.Notes?.Trim(),
            CreatedAtUtc = now
        };
        negotiation.Revisions.Add(revision);

        negotiation.CurrentUnitPrice = request.ProposedUnitPrice;
        negotiation.Quantity = newQuantity;
        negotiation.CurrentTotalPrice = newTotal;
        negotiation.DeliveryLeadTimeDays = newLeadTime;
        negotiation.LastActionByCompanyId = company.Id;
        negotiation.LastActionByUserId = userId;
        negotiation.LastModifiedAtUtc = now;

        // Flip status
        negotiation.Status = company.Id == negotiation.BuyerCompanyId
            ? ProductNegotiationStatus.PendingSupplierResponse
            : ProductNegotiationStatus.CounterofferPendingBuyerResponse;

        await _context.SaveChangesAsync(cancellationToken);

        // Notify counterparty
        var counterpartyId = company.Id == negotiation.BuyerCompanyId
            ? negotiation.SupplierCompanyId
            : negotiation.BuyerCompanyId;

        await _notificationService.CreateNotificationAsync(
            await GetSupplierOwnerUserIdAsync(counterpartyId, cancellationToken),
            NotificationType.OfferRevisionSubmitted,
            "ردّ على التفاوض",
            $"قدّمت شركة '{company.LegalName}' عرضاً معدّلاً بسعر {request.ProposedUnitPrice:N0} ج.م.",
            "Negotiation",
            negotiation.Id,
            $"notif-neg-counter-{negotiation.Id}-{revisionNumber}",
            cancellationToken);

        _logger.LogInformation("Counter on negotiation {Id} by company {CompanyId}", id, company.Id);

        return await MapNegotiationAsync(negotiation, cancellationToken);
    }

    public async Task<ProductNegotiationResponse> AcceptNegotiationAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id ?? throw new UnauthorizedException("User is not authenticated.");

        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var negotiation = await _context.ProductNegotiations
            .Include(n => n.CatalogProduct)
                .ThenInclude(p => p.Category)
            .Include(n => n.BuyerCompany)
            .Include(n => n.SupplierCompany)
            .Include(n => n.Revisions)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Negotiation {id} was not found.");

        if (negotiation.BuyerCompanyId != company.Id && negotiation.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("You do not have access to this negotiation.");
        }

        // Accepting party must be the one waiting for a response
        if (negotiation.Status == ProductNegotiationStatus.PendingSupplierResponse && negotiation.SupplierCompanyId != company.Id)
        {
            throw new ConflictException("Only the supplier can accept at this stage.");
        }

        if (negotiation.Status == ProductNegotiationStatus.CounterofferPendingBuyerResponse && negotiation.BuyerCompanyId != company.Id)
        {
            throw new ConflictException("Only the buyer can accept at this stage.");
        }

        if (negotiation.Status is not (ProductNegotiationStatus.PendingSupplierResponse or ProductNegotiationStatus.CounterofferPendingBuyerResponse))
        {
            throw new ConflictException($"Cannot accept a negotiation in '{negotiation.Status}' status.");
        }

        negotiation.Status = ProductNegotiationStatus.Accepted;
        negotiation.RespondedAtUtc = now;
        negotiation.LastActionByCompanyId = company.Id;
        negotiation.LastActionByUserId = userId;
        negotiation.LastModifiedAtUtc = now;

        // Atomically create Deal
        var dealNumber = $"DZ-DEAL-{now:yyyy}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}";

        var termsSnapshot = new
        {
            NegotiationId = negotiation.Id,
            NegotiationNumber = negotiation.NegotiationNumber,
            ProductId = negotiation.CatalogProductId,
            ProductSku = negotiation.CatalogProduct.Sku,
            ProductNameEn = negotiation.CatalogProduct.NameEn,
            UnitPrice = negotiation.CurrentUnitPrice,
            Quantity = negotiation.Quantity,
            TotalPrice = negotiation.CurrentTotalPrice,
            Currency = negotiation.Currency,
            DeliveryLeadTimeDays = negotiation.DeliveryLeadTimeDays,
            AcceptedAtUtc = now
        };

        var deal = new Deal
        {
            DealNumber = dealNumber,
            Source = DealSource.ProductNegotiation,
            ProductNegotiationId = negotiation.Id,
            ProductNegotiation = negotiation,
            BuyerCompanyId = negotiation.BuyerCompanyId,
            SupplierCompanyId = negotiation.SupplierCompanyId,
            AgreedPrice = negotiation.CurrentTotalPrice,
            Currency = negotiation.Currency,
            Status = DealStatus.AwaitingConfirmation,
            DeliveryTerms = $"Negotiated; Lead Time: {negotiation.DeliveryLeadTimeDays} days",
            EstimatedDeliveryDateUtc = now.AddDays(negotiation.DeliveryLeadTimeDays),
            CommercialTermsSnapshotJson = System.Text.Json.JsonSerializer.Serialize(termsSnapshot),
            CreatedAtUtc = now,
            LastModifiedAtUtc = now
        };

        _context.Deals.Add(deal);
        negotiation.Deal = deal;

        await _context.SaveChangesAsync(cancellationToken);

        // Notify both parties
        var notifyParty = company.Id == negotiation.BuyerCompanyId
            ? negotiation.SupplierCompanyId
            : negotiation.BuyerCompanyId;

        await _notificationService.CreateNotificationAsync(
            await GetSupplierOwnerUserIdAsync(notifyParty, cancellationToken),
            NotificationType.DealCreated,
            "تم قبول عرض السعر — صفقة جديدة",
            $"تم إنشاء صفقة جديدة {dealNumber} بقيمة {negotiation.CurrentTotalPrice:N0} ج.م.",
            "Deal",
            deal.Id,
            $"notif-neg-accepted-{negotiation.Id}",
            cancellationToken);

        _logger.LogInformation("Accepted negotiation {Id} — created deal {DealNumber}", id, dealNumber);

        return await MapNegotiationAsync(negotiation, cancellationToken);
    }

    public async Task<ProductNegotiationResponse> RejectNegotiationAsync(
        Guid id,
        RejectNegotiationRequest request,
        CancellationToken cancellationToken = default)
    {
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id ?? throw new UnauthorizedException("User is not authenticated.");

        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var negotiation = await _context.ProductNegotiations
            .Include(n => n.CatalogProduct).ThenInclude(p => p.Category)
            .Include(n => n.BuyerCompany)
            .Include(n => n.SupplierCompany)
            .Include(n => n.Revisions)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Negotiation {id} was not found.");

        if (negotiation.BuyerCompanyId != company.Id && negotiation.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("You do not have access to this negotiation.");
        }

        if (negotiation.Status is not (ProductNegotiationStatus.PendingSupplierResponse or ProductNegotiationStatus.CounterofferPendingBuyerResponse))
        {
            throw new ConflictException($"Cannot reject a negotiation in '{negotiation.Status}' status.");
        }

        negotiation.Status = ProductNegotiationStatus.Rejected;
        negotiation.RespondedAtUtc = now;
        negotiation.RejectionReason = request.Reason?.Trim();
        negotiation.LastActionByCompanyId = company.Id;
        negotiation.LastActionByUserId = userId;
        negotiation.LastModifiedAtUtc = now;

        await _context.SaveChangesAsync(cancellationToken);

        // Notify the other party
        var notifyParty = company.Id == negotiation.BuyerCompanyId
            ? negotiation.SupplierCompanyId
            : negotiation.BuyerCompanyId;

        await _notificationService.CreateNotificationAsync(
            await GetSupplierOwnerUserIdAsync(notifyParty, cancellationToken),
            NotificationType.OfferRejected,
            "تم رفض عرض السعر",
            $"رفضت شركة '{company.LegalName}' عرض السعر بشأن منتج '{negotiation.CatalogProduct.NameAr}'.",
            "Negotiation",
            negotiation.Id,
            $"notif-neg-rejected-{negotiation.Id}",
            cancellationToken);

        _logger.LogInformation("Rejected negotiation {Id} by company {CompanyId}", id, company.Id);

        return await MapNegotiationAsync(negotiation, cancellationToken);
    }

    public async Task<ProductNegotiationResponse> CancelNegotiationAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id ?? throw new UnauthorizedException("User is not authenticated.");

        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var negotiation = await _context.ProductNegotiations
            .Include(n => n.CatalogProduct).ThenInclude(p => p.Category)
            .Include(n => n.BuyerCompany)
            .Include(n => n.SupplierCompany)
            .Include(n => n.Revisions)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Negotiation {id} was not found.");

        // Only the buyer (initiator) can cancel
        if (negotiation.BuyerCompanyId != company.Id)
        {
            throw new ForbiddenException("Only the buyer who initiated the negotiation can cancel it.");
        }

        if (negotiation.Status is not (ProductNegotiationStatus.PendingSupplierResponse or ProductNegotiationStatus.CounterofferPendingBuyerResponse))
        {
            throw new ConflictException($"Cannot cancel a negotiation in '{negotiation.Status}' status.");
        }

        negotiation.Status = ProductNegotiationStatus.Cancelled;
        negotiation.RespondedAtUtc = now;
        negotiation.LastActionByCompanyId = company.Id;
        negotiation.LastActionByUserId = userId;
        negotiation.LastModifiedAtUtc = now;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Cancelled negotiation {Id} by buyer company {CompanyId}", id, company.Id);

        return await MapNegotiationAsync(negotiation, cancellationToken);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

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

    private async Task<Guid> GetSupplierOwnerUserIdAsync(Guid companyId, CancellationToken cancellationToken)
    {
        var ownerMember = await _context.CompanyMembers
            .Where(m => m.CompanyId == companyId && m.IsActive &&
                (m.Role == CompanyRole.Owner || m.Role == CompanyRole.Admin))
            .OrderBy(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);

        return ownerMember?.UserId ?? Guid.Empty;
    }

    private static Task<ProductNegotiationResponse> MapNegotiationAsync(ProductNegotiation n, CancellationToken _)
    {
        var categoryCode = n.CatalogProduct?.Category?.Code ?? string.Empty;
        var categoryNameAr = n.CatalogProduct?.Category?.NameAr ?? string.Empty;
        var categoryNameEn = n.CatalogProduct?.Category?.NameEn ?? string.Empty;
        var categoryId = n.CatalogProduct?.CategoryId ?? Guid.Empty;

        var revisions = n.Revisions
            .OrderBy(r => r.RevisionNumber)
            .Select(r => new ProductNegotiationRevisionDto(
                r.RevisionNumber,
                r.ProposedByCompanyId,
                r.ProposedByUserId,
                r.UnitPrice,
                r.Quantity,
                r.TotalPrice,
                r.DeliveryLeadTimeDays,
                r.Notes,
                r.CreatedAtUtc))
            .ToList();

        var response = new ProductNegotiationResponse(
            n.Id,
            n.NegotiationNumber,
            n.CatalogProductId,
            n.CatalogProduct?.Sku ?? string.Empty,
            n.CatalogProduct?.NameAr ?? string.Empty,
            n.CatalogProduct?.NameEn ?? string.Empty,
            categoryId,
            categoryCode,
            categoryNameAr,
            categoryNameEn,
            n.BuyerCompanyId,
            n.BuyerCompany?.LegalName ?? string.Empty,
            n.SupplierCompanyId,
            n.SupplierCompany?.LegalName ?? string.Empty,
            n.CurrentUnitPrice,
            n.Quantity,
            n.CurrentTotalPrice,
            n.Currency,
            n.DeliveryLeadTimeDays,
            n.DeliveryAddress,
            n.Notes,
            (int)n.Status,
            n.Status.ToString(),
            n.LastActionByCompanyId,
            n.DealId,
            n.Deal?.DealNumber,
            n.RejectionReason,
            n.CreatedAtUtc,
            n.RespondedAtUtc,
            revisions);

        return Task.FromResult(response);
    }
}

