using System.Text.Json;
using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Application.Deals.DTOs;
using DealZone.Application.Offers.DTOs;
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

public class OfferService : IOfferService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<OfferService> _logger;

    public OfferService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        INotificationService notificationService,
        IEmailService emailService,
        IDateTimeProvider dateTimeProvider,
        ILogger<OfferService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _emailService = emailService;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // 1. Submit Offer
    // -------------------------------------------------------------------------

    public async Task<OfferDetailResponse> SubmitOfferAsync(
        Guid rfqId,
        CreateOfferRequest request,
        CancellationToken cancellationToken = default)
    {
        var (supplierCompany, member) = await RequireSupplierMemberAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;

        if (request.ValidityDateUtc <= now)
        {
            throw new ValidationException(nameof(request.ValidityDateUtc), "Offer validity date must be in the future.");
        }

        var rfq = await _context.Rfqs
            .Include(r => r.Items)
            .Include(r => r.BuyerCompany)
            .FirstOrDefaultAsync(r => r.Id == rfqId && !r.IsDeleted, cancellationToken)
            ?? throw new NotFoundException($"RFQ with ID '{rfqId}' was not found.");

        if (rfq.Status != RfqStatus.Published)
        {
            throw new ConflictException($"Cannot submit an offer to an RFQ with status '{rfq.Status}'. The RFQ must be Published.");
        }

        if (rfq.ClosingDateUtc <= now)
        {
            throw new ConflictException("Cannot submit an offer to an RFQ whose closing date has passed.");
        }

        if (rfq.BuyerCompanyId == supplierCompany.Id)
        {
            throw new ConflictException("A company cannot submit an offer to its own RFQ.");
        }

        // Only one active submitted offer per supplier per RFQ
        var hasActiveOffer = await _context.Offers
            .AnyAsync(o => o.RfqId == rfq.Id &&
                           o.SupplierCompanyId == supplierCompany.Id &&
                           (o.Status == OfferStatus.Submitted || o.Status == OfferStatus.UnderReview),
                      cancellationToken);

        if (hasActiveOffer)
        {
            throw new ConflictException("Your company already has an active offer for this RFQ. Use the revision endpoint to submit updates.");
        }

        ValidateOfferItems(request.Items, rfq.Items);

        var totalAmount = request.Items.Sum(i => i.UnitPrice * i.OfferedQuantity);
        var offerNumber = GenerateOfferNumber(now);

        var offer = new Offer
        {
            RfqId = rfq.Id,
            SupplierCompanyId = supplierCompany.Id,
            OfferNumber = offerNumber,
            RevisionNumber = 1,
            Status = OfferStatus.Submitted,
            TotalAmount = totalAmount,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "EGP" : request.Currency.Trim().ToUpperInvariant(),
            ValidityDateUtc = request.ValidityDateUtc,
            DeliveryLeadTimeDays = request.DeliveryLeadTimeDays,
            ShippingIncluded = request.ShippingIncluded,
            PaymentTerms = request.PaymentTerms.Trim(),
            Notes = request.Notes?.Trim(),
            SubmittedAtUtc = now
        };

        foreach (var itemReq in request.Items)
        {
            var rfqItem = rfq.Items.First(i => i.Id == itemReq.RfqItemId);
            offer.Items.Add(new OfferItem
            {
                RfqItemId = itemReq.RfqItemId,
                UnitPrice = itemReq.UnitPrice,
                OfferedQuantity = itemReq.OfferedQuantity,
                TotalPrice = itemReq.UnitPrice * itemReq.OfferedQuantity,
                MaterialSpecifications = string.IsNullOrWhiteSpace(itemReq.MaterialSpecifications)
                    ? rfqItem.Specifications
                    : itemReq.MaterialSpecifications.Trim(),
                Notes = itemReq.Notes?.Trim()
            });
        }

        _context.Offers.Add(offer);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Offer {OfferNumber} submitted for RFQ {RfqNumber} by Supplier {SupplierId}",
            offer.OfferNumber, rfq.RfqNumber, supplierCompany.Id);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            rfq.BuyerCompanyId,
            [CompanyRole.Owner, CompanyRole.Admin, CompanyRole.ProcurementManager],
            NotificationType.OfferSubmitted,
            "New Offer Received",
            $"Supplier '{supplierCompany.LegalName}' submitted offer {offer.OfferNumber} for RFQ {rfq.RfqNumber}.",
            "Offer",
            offer.Id,
            $"offer_submitted_{offer.Id}",
            cancellationToken);

        return await GetOfferDetailAsync(offer.Id, supplierCompany.Id, cancellationToken);
    }

    // -------------------------------------------------------------------------
    // 2. Get My Offers For RFQ
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<OfferSummaryResponse>> GetMyOffersForRfqAsync(
        Guid rfqId,
        CancellationToken cancellationToken = default)
    {
        var (supplierCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var offers = await _context.Offers
            .AsNoTracking()
            .Include(o => o.Rfq)
            .Include(o => o.SupplierCompany)
            .Include(o => o.Items)
            .Where(o => o.RfqId == rfqId && o.SupplierCompanyId == supplierCompany.Id)
            .OrderByDescending(o => o.RevisionNumber)
            .ToListAsync(cancellationToken);

        return offers.Select(MapToSummaryResponse).ToList();
    }

    // -------------------------------------------------------------------------
    // 3. Get Offer By ID
    // -------------------------------------------------------------------------

    public async Task<OfferDetailResponse> GetOfferByIdAsync(
        Guid offerId,
        CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);
        return await GetOfferDetailAsync(offerId, company.Id, cancellationToken);
    }

    // -------------------------------------------------------------------------
    // 4. Get My Offers (Paged)
    // -------------------------------------------------------------------------

    public async Task<PagedResult<OfferSummaryResponse>> GetMyOffersAsync(
        OfferFilter filter,
        CancellationToken cancellationToken = default)
    {
        var (supplierCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var query = _context.Offers
            .AsNoTracking()
            .Include(o => o.Rfq)
            .Include(o => o.SupplierCompany)
            .Include(o => o.Items)
            .Where(o => o.SupplierCompanyId == supplierCompany.Id);

        if (filter.RfqId.HasValue)
        {
            query = query.Where(o => o.RfqId == filter.RfqId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status) && Enum.TryParse<OfferStatus>(filter.Status, true, out var status))
        {
            query = query.Where(o => o.Status == status);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "amount" => filter.SortDescending ? query.OrderByDescending(o => o.TotalAmount) : query.OrderBy(o => o.TotalAmount),
            "validity" => filter.SortDescending ? query.OrderByDescending(o => o.ValidityDateUtc) : query.OrderBy(o => o.ValidityDateUtc),
            _ => filter.SortDescending ? query.OrderByDescending(o => o.SubmittedAtUtc) : query.OrderBy(o => o.SubmittedAtUtc)
        };

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PagedResult<OfferSummaryResponse>.Create(
            items.Select(MapToSummaryResponse).ToList(),
            pageNumber,
            pageSize,
            totalCount);
    }

    /// <summary>
    /// List all offers received across RFQs published by the current authenticated buyer company.
    /// </summary>
    public async Task<PagedResult<OfferSummaryResponse>> GetReceivedOffersAsync(
        OfferFilter filter,
        CancellationToken cancellationToken = default)
    {
        var (buyerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var query = _context.Offers
            .AsNoTracking()
            .Include(o => o.Rfq)
            .Include(o => o.SupplierCompany)
            .Include(o => o.Items)
            .Where(o => o.Rfq != null && o.Rfq.BuyerCompanyId == buyerCompany.Id && !o.Rfq.IsDeleted);

        if (filter.RfqId.HasValue)
        {
            query = query.Where(o => o.RfqId == filter.RfqId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status) && Enum.TryParse<OfferStatus>(filter.Status, true, out var status))
        {
            query = query.Where(o => o.Status == status);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "amount" => filter.SortDescending ? query.OrderByDescending(o => o.TotalAmount) : query.OrderBy(o => o.TotalAmount),
            "validity" => filter.SortDescending ? query.OrderByDescending(o => o.ValidityDateUtc) : query.OrderBy(o => o.ValidityDateUtc),
            _ => filter.SortDescending ? query.OrderByDescending(o => o.SubmittedAtUtc) : query.OrderBy(o => o.SubmittedAtUtc)
        };

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PagedResult<OfferSummaryResponse>.Create(
            items.Select(MapToSummaryResponse).ToList(),
            pageNumber,
            pageSize,
            totalCount);
    }

    // -------------------------------------------------------------------------
    // 5. Revise Offer
    // -------------------------------------------------------------------------

    public async Task<OfferDetailResponse> ReviseOfferAsync(
        Guid offerId,
        ReviseOfferRequest request,
        CancellationToken cancellationToken = default)
    {
        var (supplierCompany, member) = await RequireSupplierMemberAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;

        if (request.ValidityDateUtc <= now)
        {
            throw new ValidationException(nameof(request.ValidityDateUtc), "Offer validity date must be in the future.");
        }

        var offer = await _context.Offers
            .Include(o => o.Rfq)
                .ThenInclude(r => r!.Items)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == offerId, cancellationToken)
            ?? throw new NotFoundException($"Offer with ID '{offerId}' was not found.");

        if (offer.SupplierCompanyId != supplierCompany.Id)
        {
            throw new ForbiddenException("You are not authorized to revise another company's offer.");
        }

        if (offer.Status != OfferStatus.Submitted && offer.Status != OfferStatus.UnderReview)
        {
            throw new ConflictException($"Cannot revise offer in '{offer.Status}' status. Revisions are only permitted for Submitted or UnderReview offers.");
        }

        var rfq = offer.Rfq
            ?? throw new NotFoundException($"Associated RFQ '{offer.RfqId}' was not found.");

        if (rfq.Status != RfqStatus.Published || rfq.ClosingDateUtc <= now)
        {
            throw new ConflictException("Cannot revise offer because the RFQ is no longer open.");
        }

        ValidateOfferItems(request.Items, rfq.Items);

        var rootOfferId = offer.OriginalOfferId ?? offer.Id;

        // Query the current maximum revision number for this offer lineage
        var maxRevision = await _context.Offers
            .Where(o => o.RfqId == rfq.Id && (o.Id == rootOfferId || o.OriginalOfferId == rootOfferId))
            .MaxAsync(o => o.RevisionNumber, cancellationToken);

        var nextRevNum = maxRevision + 1;

        // Retrieve root offer number for standard suffixing
        var rootOffer = offer.OriginalOfferId.HasValue
            ? await _context.Offers.FirstOrDefaultAsync(o => o.Id == rootOfferId, cancellationToken)
            : offer;

        var rootNumber = rootOffer?.OfferNumber ?? offer.OfferNumber;
        // Strip previous -R suffix if present to avoid compound -R2-R3
        var dashRIndex = rootNumber.IndexOf("-R", StringComparison.Ordinal);
        if (dashRIndex > 0)
        {
            rootNumber = rootNumber[..dashRIndex];
        }

        var newOfferNumber = $"{rootNumber}-R{nextRevNum}";
        var totalAmount = request.Items.Sum(i => i.UnitPrice * i.OfferedQuantity);

        // Supersede previous offer
        offer.Status = OfferStatus.Superseded;

        var newRevision = new Offer
        {
            RfqId = rfq.Id,
            SupplierCompanyId = supplierCompany.Id,
            OriginalOfferId = rootOfferId,
            OfferNumber = newOfferNumber,
            RevisionNumber = nextRevNum,
            Status = OfferStatus.Submitted,
            TotalAmount = totalAmount,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "EGP" : request.Currency.Trim().ToUpperInvariant(),
            ValidityDateUtc = request.ValidityDateUtc,
            DeliveryLeadTimeDays = request.DeliveryLeadTimeDays,
            ShippingIncluded = request.ShippingIncluded,
            PaymentTerms = request.PaymentTerms.Trim(),
            Notes = request.Notes?.Trim(),
            ChangeSummary = request.ChangeSummary?.Trim(),
            SubmittedAtUtc = now
        };

        foreach (var itemReq in request.Items)
        {
            var rfqItem = rfq.Items.First(i => i.Id == itemReq.RfqItemId);
            newRevision.Items.Add(new OfferItem
            {
                RfqItemId = itemReq.RfqItemId,
                UnitPrice = itemReq.UnitPrice,
                OfferedQuantity = itemReq.OfferedQuantity,
                TotalPrice = itemReq.UnitPrice * itemReq.OfferedQuantity,
                MaterialSpecifications = string.IsNullOrWhiteSpace(itemReq.MaterialSpecifications)
                    ? rfqItem.Specifications
                    : itemReq.MaterialSpecifications.Trim(),
                Notes = itemReq.Notes?.Trim()
            });
        }

        _context.Offers.Add(newRevision);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Offer revision {OfferNumber} (rev {RevNum}) submitted by Supplier {SupplierId}",
            newRevision.OfferNumber, nextRevNum, supplierCompany.Id);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            rfq.BuyerCompanyId,
            [CompanyRole.Owner, CompanyRole.Admin, CompanyRole.ProcurementManager],
            NotificationType.OfferRevisionSubmitted,
            "Offer Revision Received",
            $"Supplier '{supplierCompany.LegalName}' submitted revision {nextRevNum} ({newRevision.OfferNumber}) for RFQ {rfq.RfqNumber}.",
            "Offer",
            newRevision.Id,
            $"offer_revised_{newRevision.Id}",
            cancellationToken);

        return await GetOfferDetailAsync(newRevision.Id, supplierCompany.Id, cancellationToken);
    }

    // -------------------------------------------------------------------------
    // 6. Get Offer Revisions Lineage
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<OfferRevisionSummaryResponse>> GetOfferRevisionsAsync(
        Guid offerId,
        CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var offer = await _context.Offers
            .Include(o => o.Rfq)
            .FirstOrDefaultAsync(o => o.Id == offerId, cancellationToken)
            ?? throw new NotFoundException($"Offer with ID '{offerId}' was not found.");

        var isSupplier = offer.SupplierCompanyId == company.Id;
        var isBuyer = offer.Rfq?.BuyerCompanyId == company.Id;

        if (!isSupplier && !isBuyer)
        {
            throw new NotFoundException($"Offer with ID '{offerId}' was not found.");
        }

        var rootId = offer.OriginalOfferId ?? offer.Id;

        var revisions = await _context.Offers
            .AsNoTracking()
            .Where(o => o.Id == rootId || o.OriginalOfferId == rootId)
            .OrderBy(o => o.RevisionNumber)
            .Select(o => new OfferRevisionSummaryResponse(
                o.Id,
                o.OfferNumber,
                o.RevisionNumber,
                o.Status.ToString(),
                o.TotalAmount,
                o.Currency,
                o.ValidityDateUtc,
                o.DeliveryLeadTimeDays,
                o.ShippingIncluded,
                o.PaymentTerms,
                o.ChangeSummary,
                o.SubmittedAtUtc))
            .ToListAsync(cancellationToken);

        return revisions;
    }

    // -------------------------------------------------------------------------
    // 7. Get Offers For RFQ (Buyer View)
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<OfferDetailResponse>> GetOffersForRfqAsync(
        Guid rfqId,
        CancellationToken cancellationToken = default)
    {
        var (buyerCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var rfq = await _context.Rfqs
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == rfqId && !r.IsDeleted, cancellationToken)
            ?? throw new NotFoundException($"RFQ with ID '{rfqId}' was not found.");

        if (rfq.BuyerCompanyId != buyerCompany.Id)
        {
            throw new ForbiddenException("Only the owning buyer company is authorized to view received offers.");
        }

        var offers = await _context.Offers
            .AsNoTracking()
            .Include(o => o.Rfq)
            .Include(o => o.SupplierCompany)
            .Include(o => o.Items)
                .ThenInclude(i => i.RfqItem)
            .Where(o => o.RfqId == rfqId && o.Status != OfferStatus.Superseded)
            .OrderBy(o => o.TotalAmount)
            .ToListAsync(cancellationToken);

        return offers.Select(o => MapToDetailResponse(o, isSupplierOwner: false)).ToList();
    }

    // -------------------------------------------------------------------------
    // 8. Accept Offer
    // -------------------------------------------------------------------------

    public async Task<OfferDetailResponse> AcceptOfferAsync(
        Guid offerId,
        AcceptOfferRequest request,
        CancellationToken cancellationToken = default)
    {
        var (buyerCompany, member) = await RequireBuyerMemberAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id;

        var offer = await _context.Offers
            .Include(o => o.Rfq)
            .Include(o => o.SupplierCompany)
                .ThenInclude(c => c!.PrimaryContactUser)
            .Include(o => o.Items)
                .ThenInclude(i => i.RfqItem)
            .FirstOrDefaultAsync(o => o.Id == offerId, cancellationToken)
            ?? throw new NotFoundException($"Offer with ID '{offerId}' was not found.");

        var rfq = offer.Rfq
            ?? throw new NotFoundException($"Associated RFQ '{offer.RfqId}' was not found.");

        if (rfq.BuyerCompanyId != buyerCompany.Id)
        {
            throw new ForbiddenException("Only the owning buyer company can accept offers for this RFQ.");
        }

        if (rfq.Status != RfqStatus.Published || rfq.ClosingDateUtc <= now)
        {
            throw new ConflictException("Cannot accept an offer because the RFQ is closed, cancelled, or expired.");
        }

        if (offer.Status != OfferStatus.Submitted && offer.Status != OfferStatus.UnderReview)
        {
            throw new ConflictException($"Cannot accept offer in '{offer.Status}' status. Only Submitted or UnderReview offers can be accepted.");
        }

        if (offer.ValidityDateUtc <= now)
        {
            offer.Status = OfferStatus.Expired;
            await _context.SaveChangesAsync(cancellationToken);
            throw new ConflictException("Cannot accept this offer because its validity period has expired.");
        }

        // Concurrency safeguard: ensure no offer for this RFQ is already accepted
        var alreadyAccepted = await _context.Offers
            .AnyAsync(o => o.RfqId == rfq.Id && o.Status == OfferStatus.Accepted, cancellationToken);

        if (alreadyAccepted)
        {
            throw new ConflictException("Another offer has already been accepted for this RFQ.");
        }

        // Concurrency safeguard: ensure no deal already exists for this offer or RFQ
        var dealExists = await _context.Deals
            .AnyAsync(d => d.OfferId == offer.Id || d.RfqId == rfq.Id, cancellationToken);

        if (dealExists)
        {
            throw new ConflictException("A Deal has already been created for this RFQ or offer.");
        }

        // Accept chosen offer
        offer.Status = OfferStatus.Accepted;
        offer.AcceptedAtUtc = now;
        offer.AcceptedByUserId = userId;

        // Reject competing offers atomically
        var competingOffers = await _context.Offers
            .Include(o => o.SupplierCompany)
                .ThenInclude(c => c!.PrimaryContactUser)
            .Where(o => o.RfqId == rfq.Id &&
                        o.Id != offer.Id &&
                        (o.Status == OfferStatus.Submitted || o.Status == OfferStatus.UnderReview))
            .ToListAsync(cancellationToken);

        foreach (var comp in competingOffers)
        {
            comp.Status = OfferStatus.Rejected;
            comp.RejectedAtUtc = now;
            comp.RejectedByUserId = userId;
            comp.RejectionReason = "Another offer was accepted for this RFQ.";
        }

        // Close the RFQ to prevent any further offers or acceptance
        rfq.Status = RfqStatus.Closed;

        // Create the Deal atomically in the same database transaction
        var dealNumber = $"DEAL-{now:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
        var snapshotItems = offer.Items.Select(i => new DealItemSnapshot(
            i.RfqItemId,
            i.RfqItem?.MaterialName ?? "Material",
            i.UnitPrice,
            i.OfferedQuantity,
            i.TotalPrice,
            i.MaterialSpecifications,
            i.Notes)).ToList();

        var deliveryTermsSummary = $"{(offer.ShippingIncluded ? "Shipping Included" : "Ex-Works / Pickup")}; Payment: {offer.PaymentTerms}; Lead Time: {offer.DeliveryLeadTimeDays} days";

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
            CreatedAtUtc = now
        };

        _context.Deals.Add(deal);

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Offer {OfferNumber} accepted by Buyer {BuyerId} for RFQ {RfqNumber}. Deal {DealNumber} created. {CompetingCount} competing offers rejected.",
            offer.OfferNumber, buyerCompany.Id, rfq.RfqNumber, deal.DealNumber, competingOffers.Count);

        // Notify winning supplier
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            offer.SupplierCompanyId,
            null,
            NotificationType.OfferAccepted,
            "Offer Accepted",
            $"Your offer {offer.OfferNumber} for RFQ {rfq.RfqNumber} has been accepted! Deal {deal.DealNumber} has been created.",
            "Deal",
            deal.Id,
            $"offer_accepted_{offer.Id}",
            cancellationToken);

        if (offer.SupplierCompany?.PrimaryContactUser?.Email != null)
        {
            await _emailService.SendOfferAcceptedAsync(
                offer.SupplierCompany.PrimaryContactUser.Email,
                offer.SupplierCompany.LegalName,
                rfq.RfqNumber,
                offer.OfferNumber,
                cancellationToken);
        }

        // Notify buyer company about deal created
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            buyerCompany.Id,
            [CompanyRole.Owner, CompanyRole.Admin, CompanyRole.ProcurementManager],
            NotificationType.DealCreated,
            "Deal Created",
            $"Deal {deal.DealNumber} was created for RFQ {rfq.RfqNumber} and is awaiting mutual confirmation.",
            "Deal",
            deal.Id,
            $"deal_created_{deal.Id}",
            cancellationToken);

        // Notify competing suppliers
        foreach (var comp in competingOffers)
        {
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                comp.SupplierCompanyId,
                null,
                NotificationType.OfferRejected,
                "Offer Not Accepted",
                $"Your offer {comp.OfferNumber} for RFQ {rfq.RfqNumber} was not accepted.",
                "Offer",
                comp.Id,
                $"offer_rejected_{comp.Id}",
                cancellationToken);

            if (comp.SupplierCompany?.PrimaryContactUser?.Email != null)
            {
                await _emailService.SendOfferRejectedAsync(
                    comp.SupplierCompany.PrimaryContactUser.Email,
                    comp.SupplierCompany.LegalName,
                    rfq.RfqNumber,
                    comp.OfferNumber,
                    "Another offer was accepted for this RFQ.",
                    cancellationToken);
            }
        }

        return MapToDetailResponse(offer, isSupplierOwner: false, dealId: deal.Id);
    }

    // -------------------------------------------------------------------------
    // 9. Reject Offer
    // -------------------------------------------------------------------------

    public async Task<OfferDetailResponse> RejectOfferAsync(
        Guid offerId,
        RejectOfferRequest request,
        CancellationToken cancellationToken = default)
    {
        var (buyerCompany, member) = await RequireBuyerMemberAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id;

        var offer = await _context.Offers
            .Include(o => o.Rfq)
            .Include(o => o.SupplierCompany)
                .ThenInclude(c => c!.PrimaryContactUser)
            .Include(o => o.Items)
                .ThenInclude(i => i.RfqItem)
            .FirstOrDefaultAsync(o => o.Id == offerId, cancellationToken)
            ?? throw new NotFoundException($"Offer with ID '{offerId}' was not found.");

        var rfq = offer.Rfq
            ?? throw new NotFoundException($"Associated RFQ '{offer.RfqId}' was not found.");

        if (rfq.BuyerCompanyId != buyerCompany.Id)
        {
            throw new ForbiddenException("Only the owning buyer company can reject offers for this RFQ.");
        }

        if (offer.Status != OfferStatus.Submitted && offer.Status != OfferStatus.UnderReview)
        {
            throw new ConflictException($"Cannot reject offer in '{offer.Status}' status. Only Submitted or UnderReview offers can be rejected.");
        }

        offer.Status = OfferStatus.Rejected;
        offer.RejectedAtUtc = now;
        offer.RejectedByUserId = userId;
        offer.RejectionReason = request.Reason.Trim();

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Offer {OfferNumber} rejected by Buyer {BuyerId}",
            offer.OfferNumber, buyerCompany.Id);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            offer.SupplierCompanyId,
            null,
            NotificationType.OfferRejected,
            "Offer Rejected",
            $"Your offer {offer.OfferNumber} for RFQ {rfq.RfqNumber} was rejected. Reason: {request.Reason}",
            "Offer",
            offer.Id,
            $"offer_rejected_{offer.Id}",
            cancellationToken);

        if (offer.SupplierCompany?.PrimaryContactUser?.Email != null)
        {
            await _emailService.SendOfferRejectedAsync(
                offer.SupplierCompany.PrimaryContactUser.Email,
                offer.SupplierCompany.LegalName,
                rfq.RfqNumber,
                offer.OfferNumber,
                request.Reason,
                cancellationToken);
        }

        return MapToDetailResponse(offer, isSupplierOwner: false);
    }

    public async Task<OfferDetailResponse> WithdrawOfferAsync(
        Guid offerId,
        WithdrawOfferRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        var (supplierCompany, member) = await RequireSupplierMemberAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id;

        var offer = await _context.Offers
            .Include(o => o.Rfq)
            .Include(o => o.SupplierCompany)
            .Include(o => o.Items)
                .ThenInclude(i => i.RfqItem)
            .FirstOrDefaultAsync(o => o.Id == offerId, cancellationToken)
            ?? throw new NotFoundException($"Offer with ID '{offerId}' was not found.");

        if (offer.SupplierCompanyId != supplierCompany.Id)
        {
            throw new ForbiddenException("You are not authorized to withdraw another company's offer.");
        }

        // Idempotency: duplicate withdrawal returns existing state
        if (offer.Status == OfferStatus.Withdrawn)
        {
            return MapToDetailResponse(offer, isSupplierOwner: true);
        }

        if (offer.Status == OfferStatus.Accepted)
        {
            throw new ConflictException("Cannot withdraw an offer that has already been accepted.");
        }

        if (offer.Status == OfferStatus.Superseded)
        {
            throw new ConflictException("Cannot withdraw an offer that has been superseded by a newer revision.");
        }

        if (offer.Status == OfferStatus.Rejected)
        {
            throw new ConflictException("Cannot withdraw an offer that has already been rejected.");
        }

        if (offer.Status == OfferStatus.Expired)
        {
            throw new ConflictException("Cannot withdraw an offer that has already expired.");
        }

        if (offer.Status != OfferStatus.Submitted && offer.Status != OfferStatus.UnderReview)
        {
            throw new ConflictException($"Cannot withdraw offer in '{offer.Status}' status. Only Submitted or UnderReview offers can be withdrawn.");
        }

        var rfq = offer.Rfq
            ?? throw new NotFoundException($"Associated RFQ '{offer.RfqId}' was not found.");

        offer.Status = OfferStatus.Withdrawn;
        offer.WithdrawnAtUtc = now;
        offer.WithdrawnByUserId = userId;
        offer.WithdrawalReason = request?.Reason?.Trim();

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Offer {OfferNumber} ({OfferId}) withdrawn by Supplier {SupplierId}",
            offer.OfferNumber, offer.Id, supplierCompany.Id);

        // Notify the buyer company
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            rfq.BuyerCompanyId,
            null,
            NotificationType.OfferWithdrawn,
            "Offer Withdrawn",
            $"Supplier '{supplierCompany.TradeName}' has withdrawn offer {offer.OfferNumber} for RFQ '{rfq.RfqNumber}'.",
            "Offer",
            offer.Id,
            $"offer_withdrawn_{offer.Id}",
            cancellationToken);

        return MapToDetailResponse(offer, isSupplierOwner: true);
    }

    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------

    private static void ValidateOfferItems(
        IReadOnlyList<CreateOfferItemRequest> offeredItems,
        ICollection<RfqItem> rfqItems)
    {
        if (offeredItems.Count == 0)
        {
            throw new ValidationException("Items", "At least one offer line item is required.");
        }

        var rfqItemIds = rfqItems.Select(i => i.Id).ToHashSet();
        var offeredIds = new HashSet<Guid>();

        foreach (var item in offeredItems)
        {
            if (!rfqItemIds.Contains(item.RfqItemId))
            {
                throw new ValidationException("Items", $"Offered item '{item.RfqItemId}' does not belong to the specified RFQ.");
            }

            if (!offeredIds.Add(item.RfqItemId))
            {
                throw new ValidationException("Items", $"Duplicate line item reference for RFQ item '{item.RfqItemId}'.");
            }
        }

        // All RFQ items must be covered
        if (offeredIds.Count != rfqItemIds.Count)
        {
            throw new ValidationException("Items", "The offer must include pricing for all requested items in the RFQ.");
        }
    }

    private async Task<OfferDetailResponse> GetOfferDetailAsync(
        Guid offerId,
        Guid callerCompanyId,
        CancellationToken cancellationToken)
    {
        var offer = await _context.Offers
            .AsNoTracking()
            .Include(o => o.Rfq)
            .Include(o => o.SupplierCompany)
            .Include(o => o.Items)
                .ThenInclude(i => i.RfqItem)
            .FirstOrDefaultAsync(o => o.Id == offerId, cancellationToken)
            ?? throw new NotFoundException($"Offer with ID '{offerId}' was not found.");

        var isSupplier = offer.SupplierCompanyId == callerCompanyId;
        var isBuyer = offer.Rfq?.BuyerCompanyId == callerCompanyId;

        if (!isSupplier && !isBuyer)
        {
            throw new NotFoundException($"Offer with ID '{offerId}' was not found.");
        }

        return MapToDetailResponse(offer, isSupplierOwner: isSupplier);
    }

    private static string GenerateOfferNumber(DateTimeOffset date)
    {
        var prefix = date.ToString("yyyyMM");
        var randomSuffix = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        return $"OFFER-{prefix}-{randomSuffix}";
    }

    private static OfferDetailResponse MapToDetailResponse(Offer offer, bool isSupplierOwner, Guid? dealId = null)
    {
        var items = offer.Items
            .Select(i => new OfferItemResponse(
                i.Id,
                i.RfqItemId,
                i.RfqItem?.MaterialName ?? string.Empty,
                i.UnitPrice,
                i.OfferedQuantity,
                i.TotalPrice,
                i.MaterialSpecifications,
                i.Notes))
            .ToList();

        // Privacy sanitization: Only show TradeName (or verified fallback) to buyer; never expose tax/phone/address
        var supplierName = isSupplierOwner
            ? (!string.IsNullOrWhiteSpace(offer.SupplierCompany?.TradeName) ? offer.SupplierCompany.TradeName : offer.SupplierCompany?.LegalName ?? string.Empty)
            : (!string.IsNullOrWhiteSpace(offer.SupplierCompany?.TradeName) ? offer.SupplierCompany.TradeName : "Verified Supplier");

        return new OfferDetailResponse(
            offer.Id,
            offer.OfferNumber,
            offer.RfqId,
            offer.Rfq?.RfqNumber ?? string.Empty,
            offer.Rfq?.Title ?? string.Empty,
            offer.SupplierCompanyId,
            supplierName,
            offer.SupplierCompany?.Governorate ?? string.Empty,
            offer.SupplierCompany?.City ?? string.Empty,
            offer.OriginalOfferId,
            offer.RevisionNumber,
            offer.Status.ToString(),
            offer.TotalAmount,
            offer.Currency,
            offer.ValidityDateUtc,
            offer.DeliveryLeadTimeDays,
            offer.ShippingIncluded,
            offer.PaymentTerms,
            offer.Notes,
            offer.ChangeSummary,
            offer.RejectionReason,
            offer.SubmittedAtUtc,
            offer.AcceptedAtUtc,
            offer.RejectedAtUtc,
            isSupplierOwner,
            items,
            dealId,
            offer.WithdrawnAtUtc,
            offer.WithdrawalReason);
    }

    private static OfferSummaryResponse MapToSummaryResponse(Offer offer)
    {
        var supplierName = !string.IsNullOrWhiteSpace(offer.SupplierCompany?.TradeName)
            ? offer.SupplierCompany.TradeName
            : "Verified Supplier";

        return new OfferSummaryResponse(
            offer.Id,
            offer.OfferNumber,
            offer.RfqId,
            offer.Rfq?.RfqNumber ?? string.Empty,
            offer.Rfq?.Title ?? string.Empty,
            offer.SupplierCompanyId,
            supplierName,
            offer.RevisionNumber,
            offer.Status.ToString(),
            offer.TotalAmount,
            offer.Currency,
            offer.ValidityDateUtc,
            offer.DeliveryLeadTimeDays,
            offer.ShippingIncluded,
            offer.Items.Count,
            offer.SubmittedAtUtc);
    }

    private async Task<(Company company, CompanyMember member)> RequireApprovedCompanyAsync(
        CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.Id.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var userId = _currentUser.Id.Value;

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

    private async Task<(Company company, CompanyMember member)> RequireSupplierMemberAsync(
        CancellationToken cancellationToken)
    {
        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);

        if (member.Role != CompanyRole.Owner &&
            member.Role != CompanyRole.Admin &&
            member.Role != CompanyRole.SalesManager)
        {
            throw new ForbiddenException("Only company Owners, Admins, or Sales Managers are authorized to submit or revise offers.");
        }

        return (company, member);
    }

    private async Task<(Company company, CompanyMember member)> RequireBuyerMemberAsync(
        CancellationToken cancellationToken)
    {
        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);

        if (member.Role != CompanyRole.Owner &&
            member.Role != CompanyRole.Admin &&
            member.Role != CompanyRole.ProcurementManager)
        {
            throw new ForbiddenException("Only company Owners, Admins, or Procurement Managers are authorized to accept or reject offers.");
        }

        return (company, member);
    }
}
