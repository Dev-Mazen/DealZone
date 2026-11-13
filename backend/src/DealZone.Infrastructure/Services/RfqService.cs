using System.Text.Json;
using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Application.Deals.DTOs;
using DealZone.Application.Rfqs.DTOs;
using DealZone.Domain.Catalog;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Notifications;
using DealZone.Domain.Offers;
using DealZone.Domain.Rfqs;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Services;

public class RfqService : IRfqService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly INotificationService _notificationService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IRfqNumberGenerator _rfqNumberGenerator;
    private readonly ILogger<RfqService> _logger;

    public RfqService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        INotificationService notificationService,
        IDateTimeProvider dateTimeProvider,
        IRfqNumberGenerator rfqNumberGenerator,
        ILogger<RfqService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _dateTimeProvider = dateTimeProvider;
        _rfqNumberGenerator = rfqNumberGenerator;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // Create RFQ
    // -------------------------------------------------------------------------

    public async Task<RfqDetailResponse> CreateRfqAsync(
        CreateRfqRequest request,
        CancellationToken cancellationToken = default)
    {
        var (buyerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;

        if (request.ClosingDateUtc <= now)
        {
            throw new ValidationException(nameof(request.ClosingDateUtc), "Closing date must be in the future.");
        }

        if (request.RequiredDeliveryDateUtc.HasValue && request.RequiredDeliveryDateUtc.Value < request.ClosingDateUtc)
        {
            throw new ValidationException(
                nameof(request.RequiredDeliveryDateUtc),
                "Required delivery date must be on or after the closing date.");
        }

        if (request.PublishImmediately && (request.Items == null || request.Items.Count == 0))
        {
            throw new ValidationException("Items", "An RFQ must have at least one line item to be published.");
        }

        var rfqNumber = await _rfqNumberGenerator.NextRfqNumberAsync(now, cancellationToken);

        var rfq = new Rfq
        {
            RfqNumber = rfqNumber,
            BuyerCompanyId = buyerCompany.Id,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Status = request.PublishImmediately ? RfqStatus.Published : RfqStatus.Draft,
            PublishedAtUtc = request.PublishImmediately ? now : null,
            TargetCategoryId = request.TargetCategoryId,
            DeliveryGovernorate = request.DeliveryGovernorate.Trim(),
            DeliveryCity = request.DeliveryCity.Trim(),
            DeliveryAddress = request.DeliveryAddress.Trim(),
            ClosingDateUtc = request.ClosingDateUtc,
            RequiredDeliveryDateUtc = request.RequiredDeliveryDateUtc,
            TargetBudget = request.TargetBudget,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "EGP" : request.Currency.Trim().ToUpperInvariant(),
            Notes = request.Notes?.Trim()
        };

        if (request.Items != null && request.Items.Count > 0)
        {
            var lineNum = 1;
            foreach (var itemReq in request.Items)
            {
                var rfqItem = await BuildRfqItemAsync(itemReq, lineNum++, cancellationToken);
                rfq.Items.Add(rfqItem);
            }
        }

        _context.Rfqs.Add(rfq);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created RFQ {RfqNumber} ({RfqId}) in status {Status} for company {CompanyId}",
            rfq.RfqNumber, rfq.Id, rfq.Status, buyerCompany.Id);

        return await GetRfqDetailAsync(rfq.Id, buyerCompany.Id, cancellationToken);
    }

    // -------------------------------------------------------------------------
    // Update RFQ
    // -------------------------------------------------------------------------

    public async Task<RfqDetailResponse> UpdateRfqAsync(
        Guid id,
        UpdateRfqRequest request,
        CancellationToken cancellationToken = default)
    {
        var (buyerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;

        var rfq = await _context.Rfqs
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
            ?? throw new NotFoundException($"RFQ {id} was not found.");

        if (rfq.BuyerCompanyId != buyerCompany.Id)
        {
            throw new ForbiddenException("You do not have permission to modify this RFQ.");
        }

        if (rfq.Status is RfqStatus.Closed or RfqStatus.Cancelled)
        {
            throw new ConflictException($"Cannot modify an RFQ in {rfq.Status} status.");
        }

        if (request.ClosingDateUtc <= now)
        {
            throw new ValidationException(nameof(request.ClosingDateUtc), "Closing date must be in the future.");
        }

        if (request.RequiredDeliveryDateUtc.HasValue && request.RequiredDeliveryDateUtc.Value < request.ClosingDateUtc)
        {
            throw new ValidationException(
                nameof(request.RequiredDeliveryDateUtc),
                "Required delivery date must be on or after the closing date.");
        }

        rfq.Title = request.Title.Trim();
        rfq.Description = request.Description?.Trim();
        rfq.TargetCategoryId = request.TargetCategoryId;
        rfq.DeliveryGovernorate = request.DeliveryGovernorate.Trim();
        rfq.DeliveryCity = request.DeliveryCity.Trim();
        rfq.DeliveryAddress = request.DeliveryAddress.Trim();
        rfq.ClosingDateUtc = request.ClosingDateUtc;
        rfq.RequiredDeliveryDateUtc = request.RequiredDeliveryDateUtc;
        rfq.TargetBudget = request.TargetBudget;
        rfq.Currency = string.IsNullOrWhiteSpace(request.Currency) ? "EGP" : request.Currency.Trim().ToUpperInvariant();
        rfq.Notes = request.Notes?.Trim();

        // Line items can be replaced or modified only if in Draft status
        if (request.Items != null && request.Items.Count > 0)
        {
            if (rfq.Status != RfqStatus.Draft)
            {
                throw new ConflictException("Line items cannot be modified after an RFQ is published.");
            }

            _context.RfqItems.RemoveRange(rfq.Items);
            rfq.Items.Clear();

            var lineNum = 1;
            foreach (var itemReq in request.Items)
            {
                var rfqItem = await BuildRfqItemAsync(itemReq, lineNum++, cancellationToken);
                rfq.Items.Add(rfqItem);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated RFQ {RfqNumber} ({RfqId})", rfq.RfqNumber, rfq.Id);

        return await GetRfqDetailAsync(rfq.Id, buyerCompany.Id, cancellationToken);
    }

    // -------------------------------------------------------------------------
    // Get RFQ by ID
    // -------------------------------------------------------------------------

    public async Task<RfqDetailResponse> GetRfqByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var (callerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var rfq = await _context.Rfqs
            .AsNoTracking()
            .Include(r => r.BuyerCompany)
            .Include(r => r.TargetCategory)
            .Include(r => r.Items)
                .ThenInclude(i => i.Category)
            .Include(r => r.Items)
                .ThenInclude(i => i.Material)
            .Include(r => r.Items)
                .ThenInclude(i => i.UnitOfMeasure)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
            ?? throw new NotFoundException($"RFQ {id} was not found.");

        var isOwner = rfq.BuyerCompanyId == callerCompany.Id;

        // If not owner: must be Published and not deleted
        if (!isOwner)
        {
            if (rfq.Status != RfqStatus.Published)
            {
                throw new NotFoundException($"RFQ {id} was not found.");
            }
        }

        return MapToDetailResponse(rfq, isOwner);
    }

    // -------------------------------------------------------------------------
    // Get My RFQs (Buyer View)
    // -------------------------------------------------------------------------

    public async Task<PagedResult<RfqSummaryResponse>> GetMyRfqsAsync(
        MyRfqFilter filter,
        CancellationToken cancellationToken = default)
    {
        var (buyerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var query = _context.Rfqs
            .AsNoTracking()
            .Include(r => r.BuyerCompany)
            .Include(r => r.TargetCategory)
            .Include(r => r.Items)
            .Where(r => r.BuyerCompanyId == buyerCompany.Id);

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            if (Enum.TryParse<RfqStatus>(filter.Status, true, out var status))
            {
                query = query.Where(r => r.Status == status);
            }
        }

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(r => r.TargetCategoryId == filter.CategoryId.Value ||
                                     r.Items.Any(i => i.CategoryId == filter.CategoryId.Value));
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(r =>
                r.Title.ToLower().Contains(search) ||
                r.RfqNumber.ToLower().Contains(search) ||
                (r.Description != null && r.Description.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "closingdate" => filter.SortDescending ? query.OrderByDescending(r => r.ClosingDateUtc) : query.OrderBy(r => r.ClosingDateUtc),
            "status" => filter.SortDescending ? query.OrderByDescending(r => r.Status) : query.OrderBy(r => r.Status),
            "title" => filter.SortDescending ? query.OrderByDescending(r => r.Title) : query.OrderBy(r => r.Title),
            _ => filter.SortDescending ? query.OrderByDescending(r => r.CreatedAtUtc) : query.OrderByDescending(r => r.CreatedAtUtc)
        };

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => MapToSummaryResponse(r))
            .ToListAsync(cancellationToken);

        return PagedResult<RfqSummaryResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    // -------------------------------------------------------------------------
    // Discover RFQs (Approved Supplier View)
    // -------------------------------------------------------------------------

    public async Task<PagedResult<RfqSummaryResponse>> DiscoverRfqsAsync(
        RfqDiscoveryFilter filter,
        CancellationToken cancellationToken = default)
    {
        // Only approved suppliers/companies can discover published RFQs
        await RequireApprovedCompanyAsync(cancellationToken);

        var now = _dateTimeProvider.UtcNow;

        var query = _context.Rfqs
            .AsNoTracking()
            .Include(r => r.BuyerCompany)
            .Include(r => r.TargetCategory)
            .Include(r => r.Items)
            .Where(r => r.Status == RfqStatus.Published && r.ClosingDateUtc > now);

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(r => r.TargetCategoryId == filter.CategoryId.Value ||
                                     r.Items.Any(i => i.CategoryId == filter.CategoryId.Value));
        }

        if (filter.MaterialId.HasValue)
        {
            query = query.Where(r => r.Items.Any(i => i.MaterialId == filter.MaterialId.Value));
        }

        if (!string.IsNullOrWhiteSpace(filter.Governorate))
        {
            var gov = filter.Governorate.Trim().ToLower();
            query = query.Where(r => r.DeliveryGovernorate.ToLower().Contains(gov));
        }

        if (!string.IsNullOrWhiteSpace(filter.City))
        {
            var city = filter.City.Trim().ToLower();
            query = query.Where(r => r.DeliveryCity.ToLower().Contains(city));
        }

        if (filter.ClosingBeforeUtc.HasValue)
        {
            query = query.Where(r => r.ClosingDateUtc <= filter.ClosingBeforeUtc.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(r =>
                r.Title.ToLower().Contains(search) ||
                r.RfqNumber.ToLower().Contains(search) ||
                (r.Description != null && r.Description.ToLower().Contains(search)) ||
                r.Items.Any(i => i.MaterialName.ToLower().Contains(search) || i.Specifications.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "closingdate" => filter.SortDescending ? query.OrderByDescending(r => r.ClosingDateUtc) : query.OrderBy(r => r.ClosingDateUtc),
            "title" => filter.SortDescending ? query.OrderByDescending(r => r.Title) : query.OrderBy(r => r.Title),
            "governorate" => filter.SortDescending ? query.OrderByDescending(r => r.DeliveryGovernorate) : query.OrderBy(r => r.DeliveryGovernorate),
            _ => filter.SortDescending ? query.OrderByDescending(r => r.PublishedAtUtc) : query.OrderByDescending(r => r.PublishedAtUtc)
        };

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => MapToSummaryResponse(r))
            .ToListAsync(cancellationToken);

        return PagedResult<RfqSummaryResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    // -------------------------------------------------------------------------
    // Lifecycle Operations
    // -------------------------------------------------------------------------

    public async Task<RfqDetailResponse> PublishRfqAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var (buyerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;

        var rfq = await _context.Rfqs
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
            ?? throw new NotFoundException($"RFQ {id} was not found.");

        if (rfq.BuyerCompanyId != buyerCompany.Id)
        {
            throw new ForbiddenException("You do not have permission to publish this RFQ.");
        }

        if (rfq.Status != RfqStatus.Draft)
        {
            throw new ConflictException($"Cannot publish an RFQ in {rfq.Status} status. Only Draft RFQs can be published.");
        }

        if (rfq.Items.Count == 0)
        {
            throw new ValidationException("Items", "Cannot publish an RFQ without at least one line item.");
        }

        if (rfq.ClosingDateUtc <= now)
        {
            throw new ValidationException(nameof(rfq.ClosingDateUtc), "Closing date must be in the future to publish.");
        }

        rfq.Status = RfqStatus.Published;
        rfq.PublishedAtUtc = now;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Published RFQ {RfqNumber} ({RfqId})", rfq.RfqNumber, rfq.Id);

        // Notify active approved supplier companies (capped safely)
        var eligibleSupplierIds = await _context.Companies
            .AsNoTracking()
            .Where(c => c.IsActive && !c.IsDeleted && c.VerificationStatus == CompanyVerificationStatus.Approved && c.Id != buyerCompany.Id)
            .Take(50)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        foreach (var supplierId in eligibleSupplierIds)
        {
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                supplierId,
                [CompanyRole.Owner, CompanyRole.Admin, CompanyRole.SalesManager],
                NotificationType.RfqPublished,
                "New RFQ Published",
                $"A new RFQ '{rfq.Title}' ({rfq.RfqNumber}) was published on DealZone.",
                "Rfq",
                rfq.Id,
                $"rfq_published_{rfq.Id}_{supplierId}",
                cancellationToken);
        }

        return await GetRfqDetailAsync(rfq.Id, buyerCompany.Id, cancellationToken);
    }

    public async Task<RfqDetailResponse> CloseRfqAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var (buyerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var rfq = await _context.Rfqs
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
            ?? throw new NotFoundException($"RFQ {id} was not found.");

        if (rfq.BuyerCompanyId != buyerCompany.Id)
        {
            throw new ForbiddenException("You do not have permission to close this RFQ.");
        }

        if (rfq.Status != RfqStatus.Published)
        {
            throw new ConflictException($"Cannot close an RFQ in {rfq.Status} status. Only Published RFQs can be closed.");
        }

        rfq.Status = RfqStatus.Closed;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Closed RFQ {RfqNumber} ({RfqId})", rfq.RfqNumber, rfq.Id);

        // Notify suppliers who submitted offers on this RFQ
        var closedSupplierIds = await _context.Offers
            .AsNoTracking()
            .Where(o => o.RfqId == rfq.Id)
            .Select(o => o.SupplierCompanyId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var supplierId in closedSupplierIds)
        {
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                supplierId,
                null,
                NotificationType.RfqClosed,
                "RFQ Closed",
                $"RFQ '{rfq.Title}' ({rfq.RfqNumber}) has been closed.",
                "Rfq",
                rfq.Id,
                $"rfq_closed_{rfq.Id}_{supplierId}",
                cancellationToken);
        }

        return await GetRfqDetailAsync(rfq.Id, buyerCompany.Id, cancellationToken);
    }

    public async Task<RfqDetailResponse> CancelRfqAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var (buyerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var rfq = await _context.Rfqs
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
            ?? throw new NotFoundException($"RFQ {id} was not found.");

        if (rfq.BuyerCompanyId != buyerCompany.Id)
        {
            throw new ForbiddenException("You do not have permission to cancel this RFQ.");
        }

        if (rfq.Status is RfqStatus.Closed or RfqStatus.Cancelled)
        {
            throw new ConflictException($"Cannot cancel an RFQ that is already {rfq.Status}.");
        }

        rfq.Status = RfqStatus.Cancelled;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Cancelled RFQ {RfqNumber} ({RfqId})", rfq.RfqNumber, rfq.Id);

        // Notify suppliers who submitted offers on this RFQ
        var cancelledSupplierIds = await _context.Offers
            .AsNoTracking()
            .Where(o => o.RfqId == rfq.Id)
            .Select(o => o.SupplierCompanyId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var supplierId in cancelledSupplierIds)
        {
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                supplierId,
                null,
                NotificationType.RfqCancelled,
                "RFQ Cancelled",
                $"RFQ '{rfq.Title}' ({rfq.RfqNumber}) has been cancelled by the buyer.",
                "Rfq",
                rfq.Id,
                $"rfq_cancelled_{rfq.Id}_{supplierId}",
                cancellationToken);
        }

        return await GetRfqDetailAsync(rfq.Id, buyerCompany.Id, cancellationToken);
    }

    public async Task<RfqAwardResponse> AwardRfqAsync(
        Guid id,
        AwardRfqRequest request,
        CancellationToken cancellationToken = default)
    {
        var (buyerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id;

        var rfq = await _context.Rfqs
            .Include(r => r.BuyerCompany)
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
            ?? throw new NotFoundException($"RFQ {id} was not found.");

        if (rfq.BuyerCompanyId != buyerCompany.Id)
        {
            throw new ForbiddenException("Only the owning buyer company can award this RFQ.");
        }

        if (rfq.Status is not (RfqStatus.Published or RfqStatus.Closed))
        {
            throw new ConflictException($"Cannot award RFQ in {rfq.Status} status.");
        }

        var offer = await _context.Offers
            .Include(o => o.SupplierCompany)
            .Include(o => o.Items)
                .ThenInclude(i => i.RfqItem)
            .FirstOrDefaultAsync(o => o.Id == request.WinningOfferId && o.RfqId == rfq.Id, cancellationToken)
            ?? throw new NotFoundException($"Offer {request.WinningOfferId} was not found for RFQ {id}.");

        if (offer.Status is not (OfferStatus.Submitted or OfferStatus.UnderReview))
        {
            throw new ConflictException($"Cannot award offer in '{offer.Status}' status. Only active Submitted or UnderReview offers can be awarded.");
        }

        // Concurrency safeguard
        var dealExists = await _context.Deals
            .AnyAsync(d => d.OfferId == offer.Id || d.RfqId == rfq.Id, cancellationToken);
        if (dealExists)
        {
            throw new ConflictException("A Deal has already been created for this RFQ or offer.");
        }

        offer.Status = OfferStatus.Accepted;
        offer.AcceptedAtUtc = now;
        offer.AcceptedByUserId = userId;

        // Reject competing offers
        var competingOffers = await _context.Offers
            .Where(o => o.RfqId == rfq.Id && o.Id != offer.Id && (o.Status == OfferStatus.Submitted || o.Status == OfferStatus.UnderReview))
            .ToListAsync(cancellationToken);

        foreach (var comp in competingOffers)
        {
            comp.Status = OfferStatus.Rejected;
            comp.RejectedAtUtc = now;
            comp.RejectedByUserId = userId;
            comp.RejectionReason = "Another offer was awarded for this RFQ.";
        }

        rfq.Status = RfqStatus.Awarded;
        rfq.AwardedOfferId = offer.Id;
        rfq.AwardedAtUtc = now;
        rfq.AwardedByUserId = userId;
        rfq.AwardRationale = request.Rationale?.Trim();

        var dealNumber = $"DZ-DEAL-{now:yyyy}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}";
        var snapshotItems = offer.Items.Select(i => new DealItemSnapshot(
            i.RfqItemId,
            i.RfqItem?.MaterialName ?? "Material",
            i.UnitPrice,
            i.OfferedQuantity,
            i.TotalPrice,
            i.MaterialSpecifications,
            i.Notes)).ToList();

        var deliveryTermsSummary = $"{(offer.ShippingIncluded ? "Shipping Included" : "Pickup")}; Payment: {offer.PaymentTerms}; Lead Time: {offer.DeliveryLeadTimeDays} days";

        var termsSnapshot = new DealCommercialTermsSnapshot(
            offer.Id,
            offer.RevisionNumber,
            offer.OfferNumber,
            rfq.Id,
            rfq.RfqNumber,
            rfq.Title,
            offer.TotalAmount,
            offer.Currency,
            offer.DeliveryLeadTimeDays,
            offer.ShippingIncluded,
            offer.PaymentTerms,
            deliveryTermsSummary,
            now.AddDays(offer.DeliveryLeadTimeDays),
            offer.ValidityDateUtc,
            offer.Notes,
            snapshotItems);

        var termsSnapshotJson = JsonSerializer.Serialize(termsSnapshot);

        var deal = new Deal
        {
            DealNumber = dealNumber,
            Source = DealSource.Rfq,
            RfqId = rfq.Id,
            OfferId = offer.Id,
            OfferRevisionNumber = offer.RevisionNumber,
            BuyerCompanyId = buyerCompany.Id,
            SupplierCompanyId = offer.SupplierCompanyId,
            AgreedPrice = offer.TotalAmount,
            Currency = offer.Currency,
            Status = DealStatus.AwaitingConfirmation,
            DeliveryTerms = deliveryTermsSummary,
            EstimatedDeliveryDateUtc = now.AddDays(offer.DeliveryLeadTimeDays),
            CommercialTermsSnapshotJson = termsSnapshotJson,
            CreatedAtUtc = now,
            LastModifiedAtUtc = now
        };

        _context.Deals.Add(deal);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Awarded RFQ {RfqNumber} to Offer {OfferNumber}. Created Deal {DealNumber}.",
            rfq.RfqNumber, offer.OfferNumber, deal.DealNumber);

        // Notify winner
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            offer.SupplierCompanyId,
            null,
            NotificationType.OfferAccepted,
            "تمت ترسية طلب عروض الأسعار — صفقة جديدة",
            $"تمت ترسية طلب عروض الأسعار {rfq.RfqNumber} على عرضكم {offer.OfferNumber}! تم إنشاء الصفقة {deal.DealNumber}.",
            "Deal",
            deal.Id,
            $"rfq_awarded_{rfq.Id}",
            cancellationToken);

        return new RfqAwardResponse(
            rfq.Id,
            rfq.RfqNumber,
            offer.Id,
            offer.OfferNumber,
            offer.SupplierCompanyId,
            offer.SupplierCompany?.LegalName ?? string.Empty,
            offer.TotalAmount,
            offer.Currency,
            deal.DealNumber,
            deal.Id,
            now);
    }

    public async Task<RfqDetailResponse> ReopenRfqAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var (buyerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;

        var rfq = await _context.Rfqs
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
            ?? throw new NotFoundException($"RFQ {id} was not found.");

        if (rfq.BuyerCompanyId != buyerCompany.Id)
        {
            throw new ForbiddenException("You do not have permission to reopen this RFQ.");
        }

        if (rfq.Status is not (RfqStatus.Closed or RfqStatus.NoAward))
        {
            throw new ConflictException($"Cannot reopen RFQ in {rfq.Status} status. Only Closed or NoAward RFQs can be reopened.");
        }

        rfq.Status = RfqStatus.Published;
        rfq.ClosingDateUtc = now.AddDays(7);
        rfq.ReopenedAtUtc = now;
        rfq.ReopenedCount++;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Reopened RFQ {RfqNumber} ({RfqId})", rfq.RfqNumber, rfq.Id);

        return await GetRfqDetailAsync(rfq.Id, buyerCompany.Id, cancellationToken);
    }

    public async Task<RfqDetailResponse> NoAwardRfqAsync(Guid id, string? reason, CancellationToken cancellationToken = default)
    {
        var (buyerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var rfq = await _context.Rfqs
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
            ?? throw new NotFoundException($"RFQ {id} was not found.");

        if (rfq.BuyerCompanyId != buyerCompany.Id)
        {
            throw new ForbiddenException("You do not have permission to close this RFQ with No Award.");
        }

        if (rfq.Status is not (RfqStatus.Published or RfqStatus.Closed))
        {
            throw new ConflictException($"Cannot set NoAward on an RFQ in {rfq.Status} status.");
        }

        rfq.Status = RfqStatus.NoAward;
        rfq.CancellationReason = reason?.Trim();

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Set NoAward on RFQ {RfqNumber} ({RfqId})", rfq.RfqNumber, rfq.Id);

        return await GetRfqDetailAsync(rfq.Id, buyerCompany.Id, cancellationToken);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

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

    private async Task<RfqItem> BuildRfqItemAsync(
        CreateRfqItemRequest req,
        int lineNumber,
        CancellationToken cancellationToken)
    {
        var category = await _context.MaterialCategories
            .FirstOrDefaultAsync(c => c.Id == req.CategoryId && c.IsActive && !c.IsArchived, cancellationToken)
            ?? throw new NotFoundException($"Active category {req.CategoryId} was not found.");

        Material? material = null;
        if (req.MaterialId.HasValue)
        {
            material = await _context.Materials
                .Include(m => m.DefaultUnit)
                .FirstOrDefaultAsync(m => m.Id == req.MaterialId.Value && m.IsActive && !m.IsArchived, cancellationToken)
                ?? throw new NotFoundException($"Active material {req.MaterialId.Value} was not found.");
        }

        UnitOfMeasure? unit = null;
        if (req.UnitOfMeasureId.HasValue)
        {
            unit = await _context.UnitsOfMeasure
                .FirstOrDefaultAsync(u => u.Id == req.UnitOfMeasureId.Value && u.IsActive, cancellationToken)
                ?? throw new NotFoundException($"Active unit of measure {req.UnitOfMeasureId.Value} was not found.");
        }
        else if (material?.DefaultUnit != null)
        {
            unit = material.DefaultUnit;
        }

        return new RfqItem
        {
            CategoryId = category.Id,
            MaterialId = material?.Id,
            MaterialName = req.MaterialName.Trim(),
            Specifications = req.Specifications.Trim(),
            Quantity = req.Quantity,
            Unit = MaterialUnit.MetricTon, // Backwards compatible fallback
            UnitOfMeasureId = unit?.Id,
            TargetPricePerUnit = req.TargetPricePerUnit,
            Notes = req.Notes?.Trim(),
            LineNumber = lineNumber
        };
    }

    private async Task<RfqItem> BuildRfqItemAsync(
        UpdateRfqItemRequest req,
        int lineNumber,
        CancellationToken cancellationToken)
    {
        var category = await _context.MaterialCategories
            .FirstOrDefaultAsync(c => c.Id == req.CategoryId && c.IsActive && !c.IsArchived, cancellationToken)
            ?? throw new NotFoundException($"Active category {req.CategoryId} was not found.");

        Material? material = null;
        if (req.MaterialId.HasValue)
        {
            material = await _context.Materials
                .Include(m => m.DefaultUnit)
                .FirstOrDefaultAsync(m => m.Id == req.MaterialId.Value && m.IsActive && !m.IsArchived, cancellationToken)
                ?? throw new NotFoundException($"Active material {req.MaterialId.Value} was not found.");
        }

        UnitOfMeasure? unit = null;
        if (req.UnitOfMeasureId.HasValue)
        {
            unit = await _context.UnitsOfMeasure
                .FirstOrDefaultAsync(u => u.Id == req.UnitOfMeasureId.Value && u.IsActive, cancellationToken)
                ?? throw new NotFoundException($"Active unit of measure {req.UnitOfMeasureId.Value} was not found.");
        }
        else if (material?.DefaultUnit != null)
        {
            unit = material.DefaultUnit;
        }

        return new RfqItem
        {
            CategoryId = category.Id,
            MaterialId = material?.Id,
            MaterialName = req.MaterialName.Trim(),
            Specifications = req.Specifications.Trim(),
            Quantity = req.Quantity,
            Unit = MaterialUnit.MetricTon,
            UnitOfMeasureId = unit?.Id,
            TargetPricePerUnit = req.TargetPricePerUnit,
            Notes = req.Notes?.Trim(),
            LineNumber = lineNumber
        };
    }

    private async Task<RfqDetailResponse> GetRfqDetailAsync(
        Guid rfqId,
        Guid callerCompanyId,
        CancellationToken cancellationToken)
    {
        var rfq = await _context.Rfqs
            .AsNoTracking()
            .Include(r => r.BuyerCompany)
            .Include(r => r.TargetCategory)
            .Include(r => r.Items)
                .ThenInclude(i => i.Category)
            .Include(r => r.Items)
                .ThenInclude(i => i.Material)
            .Include(r => r.Items)
                .ThenInclude(i => i.UnitOfMeasure)
            .FirstAsync(r => r.Id == rfqId, cancellationToken);

        var activeOffers = await _context.Offers
            .AsNoTracking()
            .Where(o => o.RfqId == rfqId && (o.Status == OfferStatus.Submitted || o.Status == OfferStatus.UnderReview))
            .ToListAsync(cancellationToken);

        decimal? lowestAmount = activeOffers.Count > 0 ? activeOffers.Min(o => o.TotalAmount) : null;
        int activeOffersCount = activeOffers.Count;

        var isOwner = rfq.BuyerCompanyId == callerCompanyId;
        return MapToDetailResponse(rfq, isOwner, lowestAmount, activeOffersCount);
    }

    private static string GenerateRfqNumber(DateTimeOffset date)
    {
        var prefix = date.ToString("yyyyMM");
        var randomSuffix = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        return $"RFQ-{prefix}-{randomSuffix}";
    }

    private static RfqDetailResponse MapToDetailResponse(
        Rfq rfq,
        bool isOwner,
        decimal? lowestActiveOfferAmount = null,
        int activeOffersCount = 0)
    {
        var items = rfq.Items
            .OrderBy(i => i.LineNumber)
            .Select(i => new RfqItemResponse(
                i.Id,
                i.LineNumber,
                i.CategoryId,
                i.Category?.NameAr ?? string.Empty,
                i.Category?.NameEn ?? string.Empty,
                i.MaterialId,
                i.Material?.Code,
                i.MaterialName,
                i.Specifications,
                i.Quantity,
                i.UnitOfMeasureId,
                i.UnitOfMeasure?.Code ?? i.Unit.ToString(),
                i.UnitOfMeasure?.NameAr ?? string.Empty,
                i.UnitOfMeasure?.NameEn ?? i.Unit.ToString(),
                i.TargetPricePerUnit,
                i.Notes))
            .ToList();

        // Privacy protection: Buyer legal details are never exposed to other companies
        var companyName = isOwner
            ? (string.IsNullOrWhiteSpace(rfq.BuyerCompany?.TradeName) ? rfq.BuyerCompany?.LegalName ?? string.Empty : rfq.BuyerCompany.TradeName)
            : (rfq.BuyerCompany?.TradeName ?? "Verified Buyer");

        return new RfqDetailResponse(
            rfq.Id,
            rfq.RfqNumber,
            rfq.BuyerCompanyId,
            companyName,
            rfq.BuyerCompany?.Governorate ?? rfq.DeliveryGovernorate,
            rfq.BuyerCompany?.City ?? rfq.DeliveryCity,
            rfq.Title,
            rfq.Description,
            rfq.Status.ToString(),
            rfq.TargetCategoryId,
            rfq.TargetCategory?.NameAr,
            rfq.TargetCategory?.NameEn,
            rfq.DeliveryGovernorate,
            rfq.DeliveryCity,
            rfq.DeliveryAddress,
            rfq.RequiredDeliveryDateUtc,
            rfq.ClosingDateUtc,
            rfq.PublishedAtUtc,
            rfq.TargetBudget,
            rfq.Currency,
            rfq.Notes,
            rfq.CreatedAtUtc,
            isOwner,
            items,
            lowestActiveOfferAmount,
            activeOffersCount,
            rfq.AwardedOfferId,
            rfq.AwardRationale);
    }

    private static RfqSummaryResponse MapToSummaryResponse(Rfq rfq)
    {
        var companyName = !string.IsNullOrWhiteSpace(rfq.BuyerCompany?.TradeName)
            ? rfq.BuyerCompany.TradeName
            : "Verified Buyer";

        return new RfqSummaryResponse(
            rfq.Id,
            rfq.RfqNumber,
            rfq.BuyerCompanyId,
            companyName,
            rfq.BuyerCompany?.Governorate ?? rfq.DeliveryGovernorate,
            rfq.BuyerCompany?.City ?? rfq.DeliveryCity,
            rfq.Title,
            rfq.Status.ToString(),
            rfq.TargetCategoryId,
            rfq.TargetCategory?.NameAr,
            rfq.TargetCategory?.NameEn,
            rfq.DeliveryGovernorate,
            rfq.DeliveryCity,
            rfq.Items.Count,
            rfq.ClosingDateUtc,
            rfq.PublishedAtUtc,
            rfq.CreatedAtUtc);
    }
}
