using System.Text.Json;
using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Application.Deals.DTOs;
using DealZone.Application.Tenders.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Notifications;
using DealZone.Domain.Tenders;
using DealZone.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ValidationException = DealZone.Application.Common.Exceptions.ValidationException;

namespace DealZone.Infrastructure.Services;

public class TenderService : ITenderService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly ITenderNumberGenerator _numberGenerator;
    private readonly INotificationService _notificationService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<TenderService> _logger;

    private readonly IValidator<CreateTenderRequest> _createTenderValidator;
    private readonly IValidator<UpdateTenderRequest> _updateTenderValidator;
    private readonly IValidator<ReopenTenderRequest> _reopenTenderValidator;
    private readonly IValidator<CancelTenderRequest> _cancelTenderValidator;
    private readonly IValidator<NoAwardTenderRequest> _noAwardTenderValidator;
    private readonly IValidator<AwardTenderRequest> _awardTenderValidator;
    private readonly IValidator<SubmitBidRequest> _submitBidValidator;
    private readonly IValidator<ReviseBidRequest> _reviseBidValidator;
    private readonly IValidator<WithdrawBidRequest> _withdrawBidValidator;

    public TenderService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        ITenderNumberGenerator numberGenerator,
        INotificationService notificationService,
        IDateTimeProvider dateTimeProvider,
        ILogger<TenderService> logger,
        IValidator<CreateTenderRequest> createTenderValidator,
        IValidator<UpdateTenderRequest> updateTenderValidator,
        IValidator<ReopenTenderRequest> reopenTenderValidator,
        IValidator<CancelTenderRequest> cancelTenderValidator,
        IValidator<NoAwardTenderRequest> noAwardTenderValidator,
        IValidator<AwardTenderRequest> awardTenderValidator,
        IValidator<SubmitBidRequest> submitBidValidator,
        IValidator<ReviseBidRequest> reviseBidValidator,
        IValidator<WithdrawBidRequest> withdrawBidValidator)
    {
        _context = context;
        _currentUser = currentUser;
        _numberGenerator = numberGenerator;
        _notificationService = notificationService;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
        _createTenderValidator = createTenderValidator;
        _updateTenderValidator = updateTenderValidator;
        _reopenTenderValidator = reopenTenderValidator;
        _cancelTenderValidator = cancelTenderValidator;
        _noAwardTenderValidator = noAwardTenderValidator;
        _awardTenderValidator = awardTenderValidator;
        _submitBidValidator = submitBidValidator;
        _reviseBidValidator = reviseBidValidator;
        _withdrawBidValidator = withdrawBidValidator;
    }

    // =========================================================================
    // BUYER OPERATIONS
    // =========================================================================

    public async Task<TenderDetailResponse> CreateTenderAsync(CreateTenderRequest request, CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var valResult = await _createTenderValidator.ValidateAsync(request, cancellationToken);
        if (!valResult.IsValid)
            throw new ValidationException(valResult.Errors);

        var tenderNumber = await _numberGenerator.NextTenderNumberAsync(cancellationToken);

        var tender = new Tender
        {
            TenderNumber = tenderNumber,
            BuyerCompanyId = company.Id,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            TargetCategoryId = request.TargetCategoryId,
            DeliveryGovernorate = request.DeliveryGovernorate.Trim(),
            DeliveryCity = request.DeliveryCity.Trim(),
            DeliveryAddress = request.DeliveryAddress.Trim(),
            RequiredDeliveryDateUtc = request.RequiredDeliveryDateUtc,
            ClosingDateUtc = request.ClosingDateUtc,
            ReferencePrice = request.ReferencePrice,
            Currency = "EGP",
            Notes = request.Notes?.Trim(),
            Status = TenderStatus.Draft
        };

        int line = 1;
        foreach (var itemReq in request.Items)
        {
            tender.Items.Add(new TenderItem
            {
                CategoryId = itemReq.CategoryId,
                MaterialId = itemReq.MaterialId,
                MaterialName = itemReq.MaterialName.Trim(),
                Specifications = itemReq.Specifications.Trim(),
                Quantity = itemReq.Quantity,
                Unit = itemReq.Unit,
                UnitOfMeasureId = itemReq.UnitOfMeasureId,
                TargetPricePerUnit = itemReq.TargetPricePerUnit,
                Notes = itemReq.Notes?.Trim(),
                LineNumber = line++
            });
        }

        _context.Tenders.Add(tender);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Company {CompanyId} created Tender {TenderNumber} (Draft)", company.Id, tender.TenderNumber);

        return await GetTenderByIdInternalAsync(tender.Id, company.Id, cancellationToken);
    }

    public async Task<TenderDetailResponse> UpdateTenderAsync(Guid id, UpdateTenderRequest request, CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var valResult = await _updateTenderValidator.ValidateAsync(request, cancellationToken);
        if (!valResult.IsValid)
            throw new ValidationException(valResult.Errors);

        var tender = await _context.Tenders
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Tender with ID '{id}' was not found.");

        if (tender.BuyerCompanyId != company.Id && !_currentUser.IsSystemAdmin)
            throw new ForbiddenException("You can only modify tenders owned by your company.");

        if (tender.Status != TenderStatus.Draft)
            throw new DomainException("Only Draft tenders can be updated. Published tenders are immutable.");

        tender.Title = request.Title.Trim();
        tender.Description = request.Description?.Trim();
        tender.TargetCategoryId = request.TargetCategoryId;
        tender.DeliveryGovernorate = request.DeliveryGovernorate.Trim();
        tender.DeliveryCity = request.DeliveryCity.Trim();
        tender.DeliveryAddress = request.DeliveryAddress.Trim();
        tender.RequiredDeliveryDateUtc = request.RequiredDeliveryDateUtc;
        tender.ClosingDateUtc = request.ClosingDateUtc;
        tender.ReferencePrice = request.ReferencePrice;
        tender.Notes = request.Notes?.Trim();

        _context.TenderItems.RemoveRange(tender.Items);
        tender.Items.Clear();

        int line = 1;
        foreach (var itemReq in request.Items)
        {
            tender.Items.Add(new TenderItem
            {
                CategoryId = itemReq.CategoryId,
                MaterialId = itemReq.MaterialId,
                MaterialName = itemReq.MaterialName.Trim(),
                Specifications = itemReq.Specifications.Trim(),
                Quantity = itemReq.Quantity,
                Unit = itemReq.Unit,
                UnitOfMeasureId = itemReq.UnitOfMeasureId,
                TargetPricePerUnit = itemReq.TargetPricePerUnit,
                Notes = itemReq.Notes?.Trim(),
                LineNumber = line++
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
        return await GetTenderByIdInternalAsync(tender.Id, company.Id, cancellationToken);
    }

    public async Task<TenderDetailResponse> PublishTenderAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var tender = await _context.Tenders
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Tender with ID '{id}' was not found.");

        if (tender.BuyerCompanyId != company.Id && !_currentUser.IsSystemAdmin)
            throw new ForbiddenException("You can only publish tenders owned by your company.");

        if (tender.Status != TenderStatus.Draft)
            throw new DomainException($"Cannot publish tender in status '{tender.Status}'. Only Draft tenders can be published.");

        if (!tender.Items.Any())
            throw new DomainException("Cannot publish a tender without any line items.");

        if (tender.ClosingDateUtc <= _dateTimeProvider.UtcNow)
            throw new DomainException("Tender closing date must be in the future.");

        tender.Status = TenderStatus.Published;
        tender.PublishedAtUtc = _dateTimeProvider.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Tender {TenderNumber} published by Company {CompanyId}", tender.TenderNumber, company.Id);

        return await GetTenderByIdInternalAsync(tender.Id, company.Id, cancellationToken);
    }

    public async Task<TenderDetailResponse> CloseTenderAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var tender = await _context.Tenders
            .Include(t => t.Bids)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Tender with ID '{id}' was not found.");

        if (tender.BuyerCompanyId != company.Id && !_currentUser.IsSystemAdmin)
            throw new ForbiddenException("You can only close tenders owned by your company.");

        if (tender.Status != TenderStatus.Published)
            throw new DomainException($"Cannot close tender in status '{tender.Status}'. Only Published tenders can be closed.");

        tender.Status = TenderStatus.Closed;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Tender {TenderNumber} closed by Company {CompanyId}", tender.TenderNumber, company.Id);

        // Notify participating suppliers
        var activeSuppliers = tender.Bids
            .Where(b => b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview)
            .Select(b => b.SupplierCompanyId)
            .Distinct();

        foreach (var suppId in activeSuppliers)
        {
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                suppId,
                null,
                NotificationType.TenderClosed,
                "Tender Closed",
                $"Tender {tender.TenderNumber} has closed. No further bids or revisions can be submitted.",
                $"/tenders/{tender.Id}",
                tender.Id,
                "Tender",
                cancellationToken);
        }

        return await GetTenderByIdInternalAsync(tender.Id, company.Id, cancellationToken);
    }

    public async Task<TenderDetailResponse> ReopenTenderAsync(Guid id, ReopenTenderRequest request, CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var valResult = await _reopenTenderValidator.ValidateAsync(request, cancellationToken);
        if (!valResult.IsValid)
            throw new ValidationException(valResult.Errors);

        var tender = await _context.Tenders
            .Include(t => t.Bids)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Tender with ID '{id}' was not found.");

        if (tender.BuyerCompanyId != company.Id && !_currentUser.IsSystemAdmin)
            throw new ForbiddenException("You can only reopen tenders owned by your company.");

        if (tender.Status != TenderStatus.Closed)
            throw new DomainException($"Cannot reopen tender in status '{tender.Status}'. Only Closed tenders can be reopened.");

        if (tender.ClosingDateUtc >= request.NewClosingDateUtc)
            throw new DomainException("The new closing date must be later than the previous closing date.");

        tender.Status = TenderStatus.Published;
        tender.ClosingDateUtc = request.NewClosingDateUtc;
        tender.ReopenedAtUtc = _dateTimeProvider.UtcNow;
        tender.ReopenedCount++;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Tender {TenderNumber} reopened by Company {CompanyId} until {NewClosing}", tender.TenderNumber, company.Id, request.NewClosingDateUtc);

        // Notify existing active bidders
        var activeSuppliers = tender.Bids
            .Where(b => b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview)
            .Select(b => b.SupplierCompanyId)
            .Distinct();

        foreach (var suppId in activeSuppliers)
        {
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                suppId,
                null,
                NotificationType.TenderReopened,
                "Tender Reopened",
                $"Tender {tender.TenderNumber} has been reopened with a new closing deadline of {request.NewClosingDateUtc:yyyy-MM-dd HH:mm} UTC.",
                $"/tenders/{tender.Id}",
                tender.Id,
                "Tender",
                cancellationToken);
        }

        return await GetTenderByIdInternalAsync(tender.Id, company.Id, cancellationToken);
    }

    public async Task<TenderDetailResponse> CancelTenderAsync(Guid id, CancelTenderRequest request, CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var valResult = await _cancelTenderValidator.ValidateAsync(request, cancellationToken);
        if (!valResult.IsValid)
            throw new ValidationException(valResult.Errors);

        var tender = await _context.Tenders
            .Include(t => t.Bids)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Tender with ID '{id}' was not found.");

        if (tender.BuyerCompanyId != company.Id && !_currentUser.IsSystemAdmin)
            throw new ForbiddenException("You can only cancel tenders owned by your company.");

        if (tender.Status == TenderStatus.Awarded)
            throw new DomainException("Cannot cancel an already awarded tender.");

        if (tender.Status == TenderStatus.Cancelled || tender.Status == TenderStatus.NoAward)
            throw new DomainException($"Tender is already in a terminal state ({tender.Status}).");

        tender.Status = TenderStatus.Cancelled;
        tender.CancelledAtUtc = _dateTimeProvider.UtcNow;
        tender.CancellationReason = request.Reason.Trim();
        tender.CancelledByUserId = _currentUser.Id;

        // Mark active bids as rejected
        var activeBids = tender.Bids
            .Where(b => b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview)
            .ToList();

        foreach (var bid in activeBids)
        {
            bid.Status = BidStatus.Rejected;
            bid.RejectedAtUtc = _dateTimeProvider.UtcNow;
            bid.RejectedByUserId = _currentUser.Id;
            bid.RejectionReason = $"Tender was cancelled by the buyer: {request.Reason.Trim()}";
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Tender {TenderNumber} cancelled by Company {CompanyId}. Reason: {Reason}", tender.TenderNumber, company.Id, request.Reason);

        // Notify suppliers
        var notifiedSuppliers = activeBids.Select(b => b.SupplierCompanyId).Distinct();
        foreach (var suppId in notifiedSuppliers)
        {
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                suppId,
                null,
                NotificationType.TenderCancelled,
                "Tender Cancelled",
                $"Tender {tender.TenderNumber} was cancelled by the buyer: {request.Reason.Trim()}",
                $"/tenders/{tender.Id}",
                tender.Id,
                "Tender",
                cancellationToken);
        }

        return await GetTenderByIdInternalAsync(tender.Id, company.Id, cancellationToken);
    }

    public async Task<TenderDetailResponse> MarkNoAwardAsync(Guid id, NoAwardTenderRequest request, CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var valResult = await _noAwardTenderValidator.ValidateAsync(request, cancellationToken);
        if (!valResult.IsValid)
            throw new ValidationException(valResult.Errors);

        var tender = await _context.Tenders
            .Include(t => t.Bids)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Tender with ID '{id}' was not found.");

        if (tender.BuyerCompanyId != company.Id && !_currentUser.IsSystemAdmin)
            throw new ForbiddenException("You can only mark tenders owned by your company as No-Award.");

        if (tender.Status != TenderStatus.Closed && !(tender.Status == TenderStatus.Published && tender.ClosingDateUtc <= _dateTimeProvider.UtcNow))
            throw new DomainException("Cannot mark tender No-Award before the tender closing deadline.");

        if (tender.Status == TenderStatus.Awarded || tender.Status == TenderStatus.Cancelled || tender.Status == TenderStatus.NoAward)
            throw new DomainException($"Tender is already in a terminal state ({tender.Status}).");

        tender.Status = TenderStatus.NoAward;
        tender.CancellationReason = request.Reason.Trim();

        var activeBids = tender.Bids
            .Where(b => b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview)
            .ToList();

        foreach (var bid in activeBids)
        {
            bid.Status = BidStatus.Rejected;
            bid.RejectedAtUtc = _dateTimeProvider.UtcNow;
            bid.RejectedByUserId = _currentUser.Id;
            bid.RejectionReason = $"Tender closed with No Award: {request.Reason.Trim()}";
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Tender {TenderNumber} marked No-Award by Company {CompanyId}. Reason: {Reason}", tender.TenderNumber, company.Id, request.Reason);

        var notifiedSuppliers = activeBids.Select(b => b.SupplierCompanyId).Distinct();
        foreach (var suppId in notifiedSuppliers)
        {
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                suppId,
                null,
                NotificationType.TenderNoAward,
                "Tender Closed (No Award)",
                $"Tender {tender.TenderNumber} concluded without awarding a contract: {request.Reason.Trim()}",
                $"/tenders/{tender.Id}",
                tender.Id,
                "Tender",
                cancellationToken);
        }

        return await GetTenderByIdInternalAsync(tender.Id, company.Id, cancellationToken);
    }

    public async Task<DealDetailResponse> AwardTenderAsync(Guid id, AwardTenderRequest request, CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var valResult = await _awardTenderValidator.ValidateAsync(request, cancellationToken);
        if (!valResult.IsValid)
            throw new ValidationException(valResult.Errors);

        var tender = await _context.Tenders
            .Include(t => t.Items)
            .Include(t => t.Bids)
                .ThenInclude(b => b.Items)
            .Include(t => t.BuyerCompany)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Tender with ID '{id}' was not found.");

        if (tender.BuyerCompanyId != company.Id && !_currentUser.IsSystemAdmin)
            throw new ForbiddenException("You can only award tenders owned by your company.");

        if (tender.Status == TenderStatus.Awarded)
            throw new DomainException("This tender has already been awarded.");

        if (tender.Status == TenderStatus.Cancelled || tender.Status == TenderStatus.NoAward || tender.Status == TenderStatus.Draft)
            throw new DomainException($"Cannot award tender in status '{tender.Status}'.");

        var winningBid = tender.Bids.FirstOrDefault(b => b.Id == request.BidId)
            ?? throw new NotFoundException($"Bid with ID '{request.BidId}' does not belong to this tender.");

        if (winningBid.Status != BidStatus.Submitted && winningBid.Status != BidStatus.UnderReview)
            throw new DomainException($"Cannot award bid in status '{winningBid.Status}'. Only active bids can be awarded.");

        var supplierCompany = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == winningBid.SupplierCompanyId, cancellationToken)
            ?? throw new NotFoundException("Winning supplier company was not found.");

        if (!supplierCompany.CanPerformCommercialActivities)
            throw new DomainException("The selected supplier must be an approved, verified company.");

        var now = _dateTimeProvider.UtcNow;

        // Check if a Deal already exists for this tender
        var existingDeal = await _context.Deals.AnyAsync(d => d.TenderId == tender.Id, cancellationToken);
        if (existingDeal)
            throw new ConflictException("A commercial agreement deal has already been created for this tender.");

        // 1. Update Winning Bid
        winningBid.Status = BidStatus.Accepted;
        winningBid.AcceptedAtUtc = now;
        winningBid.AcceptedByUserId = _currentUser.Id;

        // 2. Update Tender
        tender.Status = TenderStatus.Awarded;
        tender.AwardedBidId = winningBid.Id;
        tender.AwardedAtUtc = now;
        tender.AwardedByUserId = _currentUser.Id;
        tender.AwardRationale = request.Rationale?.Trim();

        // 3. Reject Competing Active Bids
        var competingBids = tender.Bids
            .Where(b => b.Id != winningBid.Id && (b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview))
            .ToList();

        foreach (var compBid in competingBids)
        {
            compBid.Status = BidStatus.Rejected;
            compBid.RejectedAtUtc = now;
            compBid.RejectedByUserId = _currentUser.Id;
            compBid.RejectionReason = "Another bid was selected by the buyer.";
        }

        // 4. ATOMIC DEAL CREATION (Reusing existing Deal lifecycle, starting at AwaitingConfirmation)
        var dealNumber = $"DEAL-{now:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        var snapshotItems = winningBid.Items.Select(bi =>
        {
            var tenderItem = tender.Items.FirstOrDefault(ti => ti.Id == bi.TenderItemId);
            return new DealItemSnapshot(
                bi.TenderItemId,
                tenderItem?.MaterialName ?? "Material",
                bi.UnitPrice,
                bi.Quantity,
                bi.TotalPrice,
                tenderItem?.Specifications,
                bi.Notes);
        }).ToList();

        var deliveryTermsSummary = $"{(winningBid.ShippingIncluded ? "Shipping Included" : "Ex-Works / Pickup")}; Payment: {winningBid.PaymentTerms}; Lead Time: {winningBid.DeliveryLeadTimeDays} days";

        var termsSnapshot = new DealCommercialTermsSnapshot(
            winningBid.Id,
            winningBid.RevisionNumber,
            winningBid.BidNumber,
            tender.Id,
            tender.TenderNumber,
            tender.Title,
            winningBid.TotalAmount,
            winningBid.Currency,
            winningBid.DeliveryLeadTimeDays,
            winningBid.ShippingIncluded,
            winningBid.PaymentTerms,
            deliveryTermsSummary,
            now.AddDays(winningBid.DeliveryLeadTimeDays),
            winningBid.ValidityDateUtc,
            winningBid.Notes,
            snapshotItems);

        var deal = new Deal
        {
            DealNumber = dealNumber,
            Source = DealSource.Tender,
            TenderId = tender.Id,
            BidId = winningBid.Id,
            BidRevisionNumber = winningBid.RevisionNumber,
            BuyerCompanyId = tender.BuyerCompanyId,
            SupplierCompanyId = winningBid.SupplierCompanyId,
            AgreedPrice = winningBid.TotalAmount,
            Currency = winningBid.Currency,
            Status = DealStatus.AwaitingConfirmation,
            DeliveryTerms = deliveryTermsSummary,
            EstimatedDeliveryDateUtc = now.AddDays(winningBid.DeliveryLeadTimeDays),
            CommercialTermsSnapshotJson = JsonSerializer.Serialize(termsSnapshot),
            CreatedAtUtc = now
        };

        _context.Deals.Add(deal);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Tender {TenderNumber} awarded to Bid {BidNumber}. Deal {DealNumber} created in AwaitingConfirmation.",
            tender.TenderNumber, winningBid.BidNumber, deal.DealNumber);

        // Notifications
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            winningBid.SupplierCompanyId,
            null,
            NotificationType.BidAwarded,
            "Tender Bid Awarded! 🎉",
            $"Congratulations! Your bid {winningBid.BidNumber} has won Tender {tender.TenderNumber}. Commercial deal {deal.DealNumber} has been created and awaits confirmation.",
            $"/deals/{deal.Id}",
            deal.Id,
            "Deal",
            cancellationToken);

        foreach (var compBid in competingBids)
        {
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                compBid.SupplierCompanyId,
                null,
                NotificationType.BidRejected,
                "Tender Award Decision",
                $"Tender {tender.TenderNumber} has been awarded to another competitive offer. Thank you for participating.",
                $"/tenders/{tender.Id}",
                tender.Id,
                "Tender",
                cancellationToken);
        }

        return new DealDetailResponse(
            deal.Id,
            deal.DealNumber,
            null,
            tender.TenderNumber,
            tender.Title,
            null,
            winningBid.BidNumber,
            null,
            tender.BuyerCompanyId,
            company.TradeName,
            winningBid.SupplierCompanyId,
            supplierCompany.TradeName,
            deal.AgreedPrice,
            deal.Currency,
            deal.Status.ToString(),
            false,
            null,
            false,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            deal.DeliveryTerms,
            deal.EstimatedDeliveryDateUtc,
            deal.CreatedAtUtc,
            termsSnapshot,
            [],
            deal.Source.ToString(),
            tender.Id,
            tender.TenderNumber,
            winningBid.Id,
            winningBid.BidNumber,
            winningBid.RevisionNumber);
    }

    public async Task<PagedResult<TenderSummaryResponse>> GetMyTendersAsync(TenderFilter filter, CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var query = _context.Tenders
            .AsNoTracking()
            .Include(t => t.TargetCategory)
            .Include(t => t.BuyerCompany)
            .Include(t => t.Items)
            .Include(t => t.Bids)
            .Where(t => t.BuyerCompanyId == company.Id);

        if (filter.Status.HasValue)
        {
            query = query.Where(t => t.Status == filter.Status.Value);
        }

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(t => t.TargetCategoryId == filter.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(search) || t.TenderNumber.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var tenders = await query
            .OrderByDescending(t => t.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var now = _dateTimeProvider.UtcNow;
        var items = tenders.Select(t => MapToSummaryResponse(t, now)).ToList();

        return PagedResult<TenderSummaryResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    public async Task<IReadOnlyList<BidSummaryResponse>> GetTenderBidsAsync(Guid tenderId, CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var tender = await _context.Tenders
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenderId, cancellationToken)
            ?? throw new NotFoundException($"Tender with ID '{tenderId}' was not found.");

        if (tender.BuyerCompanyId != company.Id && !_currentUser.IsSystemAdmin)
            throw new ForbiddenException("Only the tender owner or an administrator can view all submitted bids.");

        var bids = await _context.Bids
            .AsNoTracking()
            .Include(b => b.SupplierCompany)
            .Include(b => b.Tender)
            .Where(b => b.TenderId == tenderId)
            .OrderBy(b => b.TotalAmount)
            .ThenBy(b => b.SubmittedAtUtc)
            .ToListAsync(cancellationToken);

        var lowestActiveAmount = bids
            .Where(b => b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview)
            .Select(b => (decimal?)b.TotalAmount)
            .Min();

        return bids.Select(b => new BidSummaryResponse(
            b.Id,
            b.BidNumber,
            b.TenderId,
            tender.TenderNumber,
            tender.Title,
            b.SupplierCompanyId,
            b.SupplierCompany?.TradeName ?? b.SupplierCompany?.LegalName,
            b.RevisionNumber,
            b.Status.ToString(),
            b.TotalAmount,
            b.Currency,
            b.DeliveryLeadTimeDays,
            b.ShippingIncluded,
            b.PaymentTerms,
            b.SubmittedAtUtc,
            b.ValidityDateUtc,
            lowestActiveAmount.HasValue && b.TotalAmount == lowestActiveAmount.Value && (b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview)
        )).ToList();
    }

    // =========================================================================
    // SUPPLIER & DISCOVERY OPERATIONS
    // =========================================================================

    public async Task<PagedResult<TenderSummaryResponse>> DiscoverTendersAsync(TenderFilter filter, CancellationToken cancellationToken = default)
    {
        // Public discovery or supplier browsing
        var now = _dateTimeProvider.UtcNow;

        var query = _context.Tenders
            .AsNoTracking()
            .Include(t => t.TargetCategory)
            .Include(t => t.BuyerCompany)
            .Include(t => t.Items)
            .Include(t => t.Bids)
            .Where(t => t.Status == TenderStatus.Published);

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(t => t.TargetCategoryId == filter.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(search) || t.TenderNumber.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var tenders = await query
            .OrderByDescending(t => t.PublishedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = tenders.Select(t => MapToSummaryResponse(t, now)).ToList();
        return PagedResult<TenderSummaryResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    public async Task<TenderDetailResponse> GetTenderByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        Guid? callerCompanyId = null;
        if (_currentUser.IsAuthenticated && _currentUser.Id.HasValue)
        {
            var member = await _context.CompanyMembers
                .FirstOrDefaultAsync(m => m.UserId == _currentUser.Id.Value && m.IsActive, cancellationToken);
            callerCompanyId = member?.CompanyId;
        }

        return await GetTenderByIdInternalAsync(id, callerCompanyId, cancellationToken);
    }

    public async Task<BidDetailResponse> SubmitBidAsync(Guid tenderId, SubmitBidRequest request, CancellationToken cancellationToken = default)
    {
        var (supplierCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var valResult = await _submitBidValidator.ValidateAsync(request, cancellationToken);
        if (!valResult.IsValid)
            throw new ValidationException(valResult.Errors);

        var tender = await _context.Tenders
            .Include(t => t.Items)
            .Include(t => t.Bids)
            .FirstOrDefaultAsync(t => t.Id == tenderId, cancellationToken)
            ?? throw new NotFoundException($"Tender with ID '{tenderId}' was not found.");

        // Rule: Self-bidding prevention
        if (tender.BuyerCompanyId == supplierCompany.Id)
            throw new ForbiddenException("A company cannot submit bids for its own tender.");

        // Rule: Independent deadline and status enforcement
        if (tender.Status != TenderStatus.Published || tender.ClosingDateUtc <= _dateTimeProvider.UtcNow)
            throw new DomainException("This tender is closed for bidding. No new bids can be submitted.");

        // Rule: One active bid per supplier company
        var hasActiveBid = tender.Bids.Any(b =>
            b.SupplierCompanyId == supplierCompany.Id &&
            (b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview));

        if (hasActiveBid)
            throw new DomainException("Your company already has an active bid for this tender. Please submit a revision instead.");

        // Rule: Every tender item must be priced
        var tenderItemIds = tender.Items.Select(i => i.Id).ToHashSet();
        var bidItemMap = request.Items.ToDictionary(i => i.TenderItemId);

        if (tenderItemIds.Count != request.Items.Count || !tenderItemIds.All(id => bidItemMap.ContainsKey(id)))
            throw new DomainException("A bid must provide positive unit pricing for every item in the tender.");

        // Server-calculated total amount: SUM(Quantity * UnitPrice)
        decimal calculatedTotal = 0;
        var bidItems = new List<BidItem>();

        foreach (var tItem in tender.Items)
        {
            var itemReq = bidItemMap[tItem.Id];
            if (itemReq.UnitPrice <= 0)
                throw new DomainException($"Unit price for '{tItem.MaterialName}' must be strictly greater than zero.");

            var itemTotal = Math.Round(tItem.Quantity * itemReq.UnitPrice, 2, MidpointRounding.AwayFromZero);
            calculatedTotal += itemTotal;

            bidItems.Add(new BidItem
            {
                TenderItemId = tItem.Id,
                UnitPrice = itemReq.UnitPrice,
                Quantity = tItem.Quantity,
                TotalPrice = itemTotal,
                Notes = itemReq.Notes?.Trim()
            });
        }

        // Rule: Open Reverse Bidding price competition
        // Subsequent bids must have a total lower than the current lowest active competing bid
        var activeCompetingBids = tender.Bids
            .Where(b => b.SupplierCompanyId != supplierCompany.Id && (b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview))
            .ToList();

        if (activeCompetingBids.Any())
        {
            var currentLowest = activeCompetingBids.Min(b => b.TotalAmount);
            if (calculatedTotal >= currentLowest)
            {
                throw new DomainException(
                    $"Reverse bidding rule: Your bid total ({calculatedTotal:N2} EGP) must be strictly lower than the current lowest competing bid ({currentLowest:N2} EGP).");
            }
        }

        var bidNumber = await _numberGenerator.NextBidNumberAsync(cancellationToken);

        var bid = new Bid
        {
            BidNumber = bidNumber,
            TenderId = tender.Id,
            SupplierCompanyId = supplierCompany.Id,
            RevisionNumber = 1,
            Status = BidStatus.Submitted,
            TotalAmount = calculatedTotal,
            Currency = "EGP",
            ValidityDateUtc = request.ValidityDateUtc,
            DeliveryLeadTimeDays = request.DeliveryLeadTimeDays,
            ShippingIncluded = request.ShippingIncluded,
            PaymentTerms = request.PaymentTerms.Trim(),
            Notes = request.Notes?.Trim(),
            SubmittedAtUtc = _dateTimeProvider.UtcNow,
            Items = bidItems
        };

        _context.Bids.Add(bid);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Company {SupplierId} submitted Bid {BidNumber} for Tender {TenderNumber} (Total: {Total:N2} EGP)",
            supplierCompany.Id, bid.BidNumber, tender.TenderNumber, calculatedTotal);

        // Notify Buyer
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            tender.BuyerCompanyId,
            null,
            NotificationType.BidSubmitted,
            "New Competitive Bid Received",
            $"A new bid of {calculatedTotal:N2} EGP was submitted on your tender {tender.TenderNumber}.",
            $"/tenders/{tender.Id}",
            tender.Id,
            "Tender",
            cancellationToken);

        return await GetBidByIdInternalAsync(bid.Id, supplierCompany.Id, cancellationToken);
    }

    public async Task<BidDetailResponse> ReviseBidAsync(Guid bidId, ReviseBidRequest request, CancellationToken cancellationToken = default)
    {
        var (supplierCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var valResult = await _reviseBidValidator.ValidateAsync(request, cancellationToken);
        if (!valResult.IsValid)
            throw new ValidationException(valResult.Errors);

        var previousBid = await _context.Bids
            .Include(b => b.Tender)
                .ThenInclude(t => t!.Items)
            .Include(b => b.Tender)
                .ThenInclude(t => t!.Bids)
            .FirstOrDefaultAsync(b => b.Id == bidId, cancellationToken)
            ?? throw new NotFoundException($"Bid with ID '{bidId}' was not found.");

        if (previousBid.SupplierCompanyId != supplierCompany.Id && !_currentUser.IsSystemAdmin)
            throw new ForbiddenException("You can only revise bids submitted by your company.");

        if (previousBid.Status != BidStatus.Submitted && previousBid.Status != BidStatus.UnderReview)
            throw new DomainException($"Cannot revise bid in status '{previousBid.Status}'. Only active bids can be revised.");

        var tender = previousBid.Tender
            ?? throw new DomainException("Tender associated with this bid was not found.");

        // Rule: Revisions allowed only before tender closing
        if (tender.Status != TenderStatus.Published || tender.ClosingDateUtc <= _dateTimeProvider.UtcNow)
            throw new DomainException("This tender is closed. Bids cannot be revised after the closing deadline.");

        // Server-calculated total
        var tenderItemIds = tender.Items.Select(i => i.Id).ToHashSet();
        var bidItemMap = request.Items.ToDictionary(i => i.TenderItemId);

        if (tenderItemIds.Count != request.Items.Count || !tenderItemIds.All(id => bidItemMap.ContainsKey(id)))
            throw new DomainException("Revised bid must provide positive unit pricing for every item in the tender.");

        decimal calculatedTotal = 0;
        var bidItems = new List<BidItem>();

        foreach (var tItem in tender.Items)
        {
            var itemReq = bidItemMap[tItem.Id];
            if (itemReq.UnitPrice <= 0)
                throw new DomainException($"Unit price for '{tItem.MaterialName}' must be strictly greater than zero.");

            var itemTotal = Math.Round(tItem.Quantity * itemReq.UnitPrice, 2, MidpointRounding.AwayFromZero);
            calculatedTotal += itemTotal;

            bidItems.Add(new BidItem
            {
                TenderItemId = tItem.Id,
                UnitPrice = itemReq.UnitPrice,
                Quantity = tItem.Quantity,
                TotalPrice = itemTotal,
                Notes = itemReq.Notes?.Trim()
            });
        }

        // Rule: Self-Comparison Exemption & Reverse Bidding revision rules:
        // 1. Exclude this supplier's own active bid from competing-bid comparison
        var activeCompetingBids = tender.Bids
            .Where(b => b.SupplierCompanyId != supplierCompany.Id && (b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview))
            .ToList();

        if (activeCompetingBids.Any())
        {
            var lowestCompeting = activeCompetingBids.Min(b => b.TotalAmount);
            if (calculatedTotal >= lowestCompeting)
            {
                throw new DomainException(
                    $"Reverse bidding rule: Your revised bid total ({calculatedTotal:N2} EGP) must be strictly lower than the lowest competing bid ({lowestCompeting:N2} EGP).");
            }
        }
        else
        {
            // If no competing active bids exist, require revised total to be lower than supplier's previous total
            if (calculatedTotal >= previousBid.TotalAmount)
            {
                throw new DomainException(
                    $"Your revised bid total ({calculatedTotal:N2} EGP) must be lower than your previous bid ({previousBid.TotalAmount:N2} EGP).");
            }
        }

        // Never allow a revision to increase supplier's own total
        if (calculatedTotal >= previousBid.TotalAmount)
        {
            throw new DomainException("A revised bid cannot equal or exceed your previous bid total.");
        }

        // Mark previous bid as Superseded
        previousBid.Status = BidStatus.Superseded;

        var rootBidId = previousBid.OriginalBidId ?? previousBid.Id;
        var newBidNumber = await _numberGenerator.NextBidNumberAsync(cancellationToken);

        var revisedBid = new Bid
        {
            BidNumber = newBidNumber,
            TenderId = tender.Id,
            SupplierCompanyId = supplierCompany.Id,
            OriginalBidId = rootBidId,
            RevisionNumber = previousBid.RevisionNumber + 1,
            Status = BidStatus.Submitted,
            TotalAmount = calculatedTotal,
            Currency = "EGP",
            ValidityDateUtc = request.ValidityDateUtc,
            DeliveryLeadTimeDays = request.DeliveryLeadTimeDays,
            ShippingIncluded = request.ShippingIncluded,
            PaymentTerms = request.PaymentTerms.Trim(),
            Notes = request.Notes?.Trim(),
            ChangeSummary = request.ChangeSummary?.Trim(),
            SubmittedAtUtc = _dateTimeProvider.UtcNow,
            Items = bidItems
        };

        _context.Bids.Add(revisedBid);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Company {SupplierId} revised Bid {OldBidNumber} -> {NewBidNumber} (Rev {Rev}, Total: {Total:N2} EGP)",
            supplierCompany.Id, previousBid.BidNumber, revisedBid.BidNumber, revisedBid.RevisionNumber, calculatedTotal);

        // Notify Buyer
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            tender.BuyerCompanyId,
            null,
            NotificationType.BidRevised,
            "Bid Revised Downward",
            $"A revised lower bid of {calculatedTotal:N2} EGP (Rev {revisedBid.RevisionNumber}) was submitted on tender {tender.TenderNumber}.",
            $"/tenders/{tender.Id}",
            tender.Id,
            "Tender",
            cancellationToken);

        return await GetBidByIdInternalAsync(revisedBid.Id, supplierCompany.Id, cancellationToken);
    }

    public async Task<BidDetailResponse> WithdrawBidAsync(Guid bidId, WithdrawBidRequest request, CancellationToken cancellationToken = default)
    {
        var (supplierCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var valResult = await _withdrawBidValidator.ValidateAsync(request, cancellationToken);
        if (!valResult.IsValid)
            throw new ValidationException(valResult.Errors);

        var bid = await _context.Bids
            .Include(b => b.Tender)
            .FirstOrDefaultAsync(b => b.Id == bidId, cancellationToken)
            ?? throw new NotFoundException($"Bid with ID '{bidId}' was not found.");

        if (bid.SupplierCompanyId != supplierCompany.Id && !_currentUser.IsSystemAdmin)
            throw new ForbiddenException("You can only withdraw bids submitted by your company.");

        if (bid.Status != BidStatus.Submitted && bid.Status != BidStatus.UnderReview)
            throw new DomainException($"Cannot withdraw bid in status '{bid.Status}'.");

        var tender = bid.Tender
            ?? throw new DomainException("Tender associated with this bid was not found.");

        if (tender.Status != TenderStatus.Published || tender.ClosingDateUtc <= _dateTimeProvider.UtcNow)
            throw new DomainException("Bids cannot be withdrawn after the tender has closed.");

        bid.Status = BidStatus.Withdrawn;
        bid.WithdrawnAtUtc = _dateTimeProvider.UtcNow;
        bid.WithdrawnByUserId = _currentUser.Id;
        bid.WithdrawalReason = request.Reason.Trim();

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Bid {BidNumber} withdrawn by Company {SupplierId}. Reason: {Reason}", bid.BidNumber, supplierCompany.Id, request.Reason);

        // Notify Buyer
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            tender.BuyerCompanyId,
            null,
            NotificationType.BidWithdrawn,
            "Bid Withdrawn",
            $"A bid of {bid.TotalAmount:N2} EGP on tender {tender.TenderNumber} was withdrawn by the supplier.",
            $"/tenders/{tender.Id}",
            tender.Id,
            "Tender",
            cancellationToken);

        return await GetBidByIdInternalAsync(bid.Id, supplierCompany.Id, cancellationToken);
    }

    public async Task<PagedResult<BidSummaryResponse>> GetMyBidsAsync(BidFilter filter, CancellationToken cancellationToken = default)
    {
        var (supplierCompany, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var query = _context.Bids
            .AsNoTracking()
            .Include(b => b.Tender)
            .Include(b => b.SupplierCompany)
            .Where(b => b.SupplierCompanyId == supplierCompany.Id);

        if (filter.TenderId.HasValue)
        {
            query = query.Where(b => b.TenderId == filter.TenderId.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(b => b.Status == filter.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var bids = await query
            .OrderByDescending(b => b.SubmittedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = bids.Select(b => new BidSummaryResponse(
            b.Id,
            b.BidNumber,
            b.TenderId,
            b.Tender?.TenderNumber ?? string.Empty,
            b.Tender?.Title ?? string.Empty,
            b.SupplierCompanyId,
            supplierCompany.TradeName,
            b.RevisionNumber,
            b.Status.ToString(),
            b.TotalAmount,
            b.Currency,
            b.DeliveryLeadTimeDays,
            b.ShippingIncluded,
            b.PaymentTerms,
            b.SubmittedAtUtc,
            b.ValidityDateUtc,
            false
        )).ToList();

        return PagedResult<BidSummaryResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    public async Task<BidDetailResponse> GetBidByIdAsync(Guid bidId, CancellationToken cancellationToken = default)
    {
        Guid? callerCompanyId = null;
        if (_currentUser.IsAuthenticated && _currentUser.Id.HasValue)
        {
            var member = await _context.CompanyMembers
                .FirstOrDefaultAsync(m => m.UserId == _currentUser.Id.Value && m.IsActive, cancellationToken);
            callerCompanyId = member?.CompanyId;
        }

        return await GetBidByIdInternalAsync(bidId, callerCompanyId, cancellationToken);
    }

    // =========================================================================
    // INTERNAL HELPERS & PROJECTIONS
    // =========================================================================

    private async Task<TenderDetailResponse> GetTenderByIdInternalAsync(Guid id, Guid? callerCompanyId, CancellationToken cancellationToken)
    {
        var tender = await _context.Tenders
            .AsNoTracking()
            .Include(t => t.TargetCategory)
            .Include(t => t.BuyerCompany)
            .Include(t => t.Items)
                .ThenInclude(i => i.Category)
            .Include(t => t.Bids)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Tender with ID '{id}' was not found.");

        var now = _dateTimeProvider.UtcNow;
        var isExpired = tender.ClosingDateUtc <= now;

        var activeBids = tender.Bids
            .Where(b => b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview)
            .ToList();

        var activeBidsCount = activeBids.Count;
        var lowestActiveBidAmount = activeBids.Any()
            ? (decimal?)activeBids.Min(b => b.TotalAmount)
            : null;

        var canManage = callerCompanyId.HasValue && (callerCompanyId == tender.BuyerCompanyId || _currentUser.IsSystemAdmin);
        var canBid = callerCompanyId.HasValue && callerCompanyId != tender.BuyerCompanyId && tender.Status == TenderStatus.Published && !isExpired;

        BidSummaryResponse? myActiveBid = null;
        if (callerCompanyId.HasValue && callerCompanyId != tender.BuyerCompanyId)
        {
            var userBid = activeBids.FirstOrDefault(b => b.SupplierCompanyId == callerCompanyId.Value);
            if (userBid != null)
            {
                myActiveBid = new BidSummaryResponse(
                    userBid.Id,
                    userBid.BidNumber,
                    tender.Id,
                    tender.TenderNumber,
                    tender.Title,
                    userBid.SupplierCompanyId,
                    null, // redacted
                    userBid.RevisionNumber,
                    userBid.Status.ToString(),
                    userBid.TotalAmount,
                    userBid.Currency,
                    userBid.DeliveryLeadTimeDays,
                    userBid.ShippingIncluded,
                    userBid.PaymentTerms,
                    userBid.SubmittedAtUtc,
                    userBid.ValidityDateUtc,
                    lowestActiveBidAmount.HasValue && userBid.TotalAmount == lowestActiveBidAmount.Value
                );
            }
        }

        var items = tender.Items.OrderBy(i => i.LineNumber).Select(i => new TenderItemResponse(
            i.Id,
            i.TenderId,
            i.CategoryId,
            i.Category?.NameEn ?? i.Category?.NameAr,
            i.MaterialId,
            i.MaterialName,
            i.Specifications,
            i.Quantity,
            i.Unit.ToString(),
            i.TargetPricePerUnit,
            i.Notes,
            i.LineNumber
        )).ToList();

        var buyerName = GetSanitizedCompanyName(tender.BuyerCompany, canManage);

        return new TenderDetailResponse(
            tender.Id,
            tender.TenderNumber,
            tender.BuyerCompanyId,
            buyerName,
            tender.Title,
            tender.Description,
            tender.TargetCategoryId,
            tender.TargetCategory?.NameEn ?? tender.TargetCategory?.NameAr,
            tender.Status.ToString(),
            tender.DeliveryGovernorate,
            tender.DeliveryCity,
            tender.DeliveryAddress,
            tender.RequiredDeliveryDateUtc,
            tender.ClosingDateUtc,
            tender.PublishedAtUtc,
            tender.ReferencePrice,
            tender.Currency,
            tender.Notes,
            tender.AwardedBidId,
            canManage ? tender.AwardRationale : null,
            tender.AwardedAtUtc,
            tender.CancelledAtUtc,
            tender.CancellationReason,
            tender.ReopenedAtUtc,
            tender.ReopenedCount,
            activeBidsCount,
            lowestActiveBidAmount,
            isExpired,
            canManage,
            canBid,
            tender.CreatedAtUtc,
            items,
            myActiveBid
        );
    }

    private async Task<BidDetailResponse> GetBidByIdInternalAsync(Guid bidId, Guid? callerCompanyId, CancellationToken cancellationToken)
    {
        var bid = await _context.Bids
            .AsNoTracking()
            .Include(b => b.SupplierCompany)
            .Include(b => b.Tender)
                .ThenInclude(t => t!.Items)
            .Include(b => b.Items)
                .ThenInclude(bi => bi.TenderItem)
            .FirstOrDefaultAsync(b => b.Id == bidId, cancellationToken)
            ?? throw new NotFoundException($"Bid with ID '{bidId}' was not found.");

        var isOwnerSupplier = callerCompanyId.HasValue && callerCompanyId.Value == bid.SupplierCompanyId;
        var isOwnerBuyer = callerCompanyId.HasValue && callerCompanyId.Value == bid.Tender?.BuyerCompanyId;

        if (!isOwnerSupplier && !isOwnerBuyer && !_currentUser.IsSystemAdmin)
        {
            throw new ForbiddenException("You are not authorized to view the details of this bid.");
        }

        var tender = bid.Tender!;
        var lowestActiveAmount = await _context.Bids
            .Where(b => b.TenderId == bid.TenderId && (b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview))
            .Select(b => (decimal?)b.TotalAmount)
            .MinAsync(cancellationToken);

        var supplierName = GetSanitizedCompanyName(bid.SupplierCompany, isOwnerSupplier || isOwnerBuyer || _currentUser.IsSystemAdmin);

        var items = bid.Items.Select(bi => new BidItemResponse(
            bi.Id,
            bi.BidId,
            bi.TenderItemId,
            bi.TenderItem?.MaterialName ?? "Item",
            bi.Quantity,
            bi.TenderItem?.Unit.ToString() ?? "Unit",
            bi.UnitPrice,
            bi.TotalPrice,
            bi.Notes
        )).ToList();

        return new BidDetailResponse(
            bid.Id,
            bid.BidNumber,
            bid.TenderId,
            tender.TenderNumber,
            tender.Title,
            bid.SupplierCompanyId,
            supplierName,
            bid.OriginalBidId,
            bid.RevisionNumber,
            bid.Status.ToString(),
            bid.TotalAmount,
            bid.Currency,
            bid.ValidityDateUtc,
            bid.DeliveryLeadTimeDays,
            bid.ShippingIncluded,
            bid.PaymentTerms,
            bid.Notes,
            bid.ChangeSummary,
            bid.SubmittedAtUtc,
            bid.AcceptedAtUtc,
            bid.RejectedAtUtc,
            bid.RejectionReason,
            bid.WithdrawnAtUtc,
            bid.WithdrawalReason,
            lowestActiveAmount.HasValue && bid.TotalAmount == lowestActiveAmount.Value && (bid.Status == BidStatus.Submitted || bid.Status == BidStatus.UnderReview),
            items
        );
    }

    private static TenderSummaryResponse MapToSummaryResponse(Tender t, DateTimeOffset now)
    {
        var activeBids = t.Bids.Where(b => b.Status == BidStatus.Submitted || b.Status == BidStatus.UnderReview).ToList();
        var lowestAmount = activeBids.Any() ? (decimal?)activeBids.Min(b => b.TotalAmount) : null;

        return new TenderSummaryResponse(
            t.Id,
            t.TenderNumber,
            t.BuyerCompanyId,
            t.BuyerCompany?.TradeName ?? t.BuyerCompany?.LegalName ?? "Buyer",
            t.Title,
            t.TargetCategory?.NameEn ?? t.TargetCategory?.NameAr,
            t.Status.ToString(),
            t.DeliveryGovernorate,
            t.DeliveryCity,
            t.RequiredDeliveryDateUtc,
            t.ClosingDateUtc,
            t.PublishedAtUtc,
            t.ReferencePrice,
            t.Currency,
            t.Items.Count,
            activeBids.Count,
            lowestAmount,
            t.ClosingDateUtc <= now,
            t.CreatedAtUtc
        );
    }

    private static string GetSanitizedCompanyName(Company? company, bool canSeeDetails)
    {
        if (company == null) return "Verified Company";
        if (canSeeDetails) return company.TradeName ?? company.LegalName;
        return company.TradeName ?? "Verified Company";
    }

    private async Task<(Company Company, CompanyMember Member)> RequireApprovedCompanyAsync(CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.Id.HasValue)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        var member = await _context.CompanyMembers
            .Include(m => m.Company)
            .FirstOrDefaultAsync(m => m.UserId == _currentUser.Id.Value && m.IsActive, cancellationToken)
            ?? throw new ForbiddenException("You are not associated with any active company.");

        var company = member.Company;
        if (!company.CanPerformCommercialActivities)
        {
            throw new ForbiddenException("Your company must complete verification before accessing tender operations.");
        }

        return (company, member);
    }
}
