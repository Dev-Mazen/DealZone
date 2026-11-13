using System.Text.Json;
using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Application.Deals.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Notifications;
using DealZone.Domain.Purchasing;
using DealZone.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Services;

public class DealService : IDealService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<DealService> _logger;
    private readonly IValidator<CancelDealRequest> _cancelDealValidator;
    private readonly IValidator<CreateDisputeRequest> _createDisputeValidator;
    private readonly IValidator<ResolveDisputeRequest> _resolveDisputeValidator;

    public DealService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        INotificationService notificationService,
        IEmailService emailService,
        IDateTimeProvider dateTimeProvider,
        ILogger<DealService> logger,
        IValidator<CancelDealRequest> cancelDealValidator,
        IValidator<CreateDisputeRequest> createDisputeValidator,
        IValidator<ResolveDisputeRequest> resolveDisputeValidator)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _emailService = emailService;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
        _cancelDealValidator = cancelDealValidator;
        _createDisputeValidator = createDisputeValidator;
        _resolveDisputeValidator = resolveDisputeValidator;
    }

    // -------------------------------------------------------------------------
    // 1. Get My Deals (Paginated)
    // -------------------------------------------------------------------------

    public async Task<PagedResult<DealSummaryResponse>> GetMyDealsAsync(
        DealStatus? status,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Deals
            .AsNoTracking()
            .Include(d => d.Rfq)
                .ThenInclude(r => r!.TargetCategory)
            .Include(d => d.Offer)
            .Include(d => d.Tender)
                .ThenInclude(t => t!.TargetCategory)
            .Include(d => d.Bid)
            .Include(d => d.DirectPurchase)
                .ThenInclude(dp => dp!.CatalogProduct)
            .Include(d => d.ProductNegotiation)
                .ThenInclude(pn => pn!.CatalogProduct)
            .Include(d => d.BuyerCompany)
            .Include(d => d.SupplierCompany)
            .Where(d => d.BuyerCompanyId == company.Id || d.SupplierCompanyId == company.Id);

        if (status.HasValue)
        {
            query = query.Where(d => d.Status == status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var deals = await query
            .OrderByDescending(d => d.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = deals.Select(d => MapToSummaryResponse(d, company.Id)).ToList();

        return PagedResult<DealSummaryResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    // -------------------------------------------------------------------------
    // 2. Get Deal By ID
    // -------------------------------------------------------------------------

    public async Task<DealDetailResponse> GetDealByIdAsync(
        Guid dealId,
        CancellationToken cancellationToken = default)
    {
        var deal = await _context.Deals
            .AsNoTracking()
            .Include(d => d.Rfq)
            .Include(d => d.Offer)
            .Include(d => d.Tender)
            .Include(d => d.Bid)
            .Include(d => d.DirectPurchase)
                .ThenInclude(dp => dp!.CatalogProduct)
            .Include(d => d.ProductNegotiation)
                .ThenInclude(pn => pn!.CatalogProduct)
            .Include(d => d.BuyerCompany)
            .Include(d => d.SupplierCompany)
            .Include(d => d.Disputes)
                .ThenInclude(dp => dp.OpenedByCompany)
            .FirstOrDefaultAsync(d => d.Id == dealId || d.DirectPurchaseId == dealId, cancellationToken)
            ?? throw new NotFoundException($"Deal with ID '{dealId}' was not found.");

        Guid? callerCompanyId = null;

        if (!_currentUser.IsSystemAdmin)
        {
            var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);
            callerCompanyId = company.Id;

            if (deal.BuyerCompanyId != company.Id && deal.SupplierCompanyId != company.Id)
            {
                throw new ForbiddenException("You are not a participant in this deal.");
            }
        }

        return MapToDetailResponse(deal, callerCompanyId);
    }

    // -------------------------------------------------------------------------
    // 3. Confirm Deal
    // -------------------------------------------------------------------------

    public async Task<DealDetailResponse> ConfirmDealAsync(
        Guid dealId,
        CancellationToken cancellationToken = default)
    {
        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id;

        var deal = await _context.Deals
            .Include(d => d.Rfq)
            .Include(d => d.Offer)
            .Include(d => d.DirectPurchase)
            .Include(d => d.BuyerCompany)
                .ThenInclude(c => c!.PrimaryContactUser)
            .Include(d => d.SupplierCompany)
                .ThenInclude(c => c!.PrimaryContactUser)
            .Include(d => d.Disputes)
                .ThenInclude(dp => dp.OpenedByCompany)
            .FirstOrDefaultAsync(d => d.Id == dealId || d.DirectPurchaseId == dealId, cancellationToken)
            ?? throw new NotFoundException($"Deal with ID '{dealId}' was not found.");

        if (deal.BuyerCompanyId != company.Id && deal.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("You are not a participant in this deal.");
        }

        if (deal.Status != DealStatus.AwaitingConfirmation)
        {
            throw new ConflictException($"Deal cannot be confirmed in '{deal.Status}' status. It must be in AwaitingConfirmation.");
        }

        var isBuyer = deal.BuyerCompanyId == company.Id;
        var isSupplier = deal.SupplierCompanyId == company.Id;

        if (isBuyer)
        {
            if (member.Role != CompanyRole.Owner &&
                member.Role != CompanyRole.Admin &&
                member.Role != CompanyRole.ProcurementManager)
            {
                throw new ForbiddenException("Only company Owners, Admins, or Procurement Managers are authorized to confirm deals for the buyer.");
            }

            deal.ConfirmedByBuyerAtUtc = now;
            deal.ConfirmedByBuyerUserId = userId;
        }
        else if (isSupplier)
        {
            if (member.Role != CompanyRole.Owner &&
                member.Role != CompanyRole.Admin &&
                member.Role != CompanyRole.SalesManager)
            {
                throw new ForbiddenException("Only company Owners, Admins, or Sales Managers are authorized to confirm deals for the supplier.");
            }

            deal.ConfirmedBySupplierAtUtc = now;
            deal.ConfirmedBySupplierUserId = userId;
        }

        // Mutual confirmation check: both parties must confirm
        if (deal.ConfirmedByBuyerAtUtc.HasValue && deal.ConfirmedBySupplierAtUtc.HasValue)
        {
            deal.Status = DealStatus.Confirmed;
            deal.ConfirmedAtUtc = now;
            if (deal.DirectPurchase != null)
            {
                deal.DirectPurchase.Status = DirectPurchaseStatus.Confirmed;
            }
            _logger.LogInformation("Deal {DealNumber} has been mutually confirmed by both buyer and supplier.", deal.DealNumber);
        }

        await _context.SaveChangesAsync(cancellationToken);

        if (deal.Status == DealStatus.Confirmed)
        {
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                deal.BuyerCompanyId,
                [CompanyRole.Owner, CompanyRole.Admin, CompanyRole.ProcurementManager],
                NotificationType.DealConfirmed,
                "Deal Confirmed",
                $"Deal {deal.DealNumber} has been mutually confirmed by both parties and is ready for fulfillment.",
                "Deal",
                deal.Id,
                $"deal_confirmed_{deal.Id}_buyer",
                cancellationToken);

            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                deal.SupplierCompanyId,
                [CompanyRole.Owner, CompanyRole.Admin, CompanyRole.SalesManager],
                NotificationType.DealConfirmed,
                "Deal Confirmed",
                $"Deal {deal.DealNumber} has been mutually confirmed by both parties and is ready for fulfillment.",
                "Deal",
                deal.Id,
                $"deal_confirmed_{deal.Id}_supplier",
                cancellationToken);

            if (deal.BuyerCompany?.PrimaryContactUser?.Email != null)
            {
                await _emailService.SendDealConfirmationAsync(
                    deal.BuyerCompany.PrimaryContactUser.Email,
                    deal.BuyerCompany.LegalName,
                    deal.DealNumber,
                    "Buyer",
                    cancellationToken);
            }

            if (deal.SupplierCompany?.PrimaryContactUser?.Email != null)
            {
                await _emailService.SendDealConfirmationAsync(
                    deal.SupplierCompany.PrimaryContactUser.Email,
                    deal.SupplierCompany.LegalName,
                    deal.DealNumber,
                    "Supplier",
                    cancellationToken);
            }
        }
        else
        {
            var counterpartyCompanyId = isBuyer ? deal.SupplierCompanyId : deal.BuyerCompanyId;
            var confirmingRole = isBuyer ? "Buyer" : "Supplier";

            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                counterpartyCompanyId,
                null,
                NotificationType.DealConfirmationReceived,
                "Deal Confirmation Received",
                $"The {confirmingRole} has confirmed Deal {deal.DealNumber}. Please review and confirm the deal.",
                "Deal",
                deal.Id,
                $"deal_conf_recv_{deal.Id}_{company.Id}",
                cancellationToken);
        }

        return MapToDetailResponse(deal, company.Id);
    }

    // -------------------------------------------------------------------------
    // 4. Start Deal (InProgress)
    // -------------------------------------------------------------------------

    public async Task<DealDetailResponse> StartDealAsync(
        Guid dealId,
        CancellationToken cancellationToken = default)
    {
        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id;

        var deal = await _context.Deals
            .Include(d => d.Rfq)
            .Include(d => d.Offer)
            .Include(d => d.DirectPurchase)
            .Include(d => d.BuyerCompany)
                .ThenInclude(c => c!.PrimaryContactUser)
            .Include(d => d.SupplierCompany)
                .ThenInclude(c => c!.PrimaryContactUser)
            .Include(d => d.Disputes)
                .ThenInclude(dp => dp.OpenedByCompany)
            .FirstOrDefaultAsync(d => d.Id == dealId || d.DirectPurchaseId == dealId, cancellationToken)
            ?? throw new NotFoundException($"Deal with ID '{dealId}' was not found.");

        if (deal.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("Only the supplier company can start fulfillment on this deal.");
        }

        if (member.Role != CompanyRole.Owner &&
            member.Role != CompanyRole.Admin &&
            member.Role != CompanyRole.SalesManager)
        {
            throw new ForbiddenException("Only supplier Owners, Admins, or Sales Managers can start work on a deal.");
        }

        if (deal.Status != DealStatus.Confirmed)
        {
            throw new ConflictException($"Deal must be in Confirmed status to start work. Current status: '{deal.Status}'.");
        }

        deal.Status = DealStatus.InProgress;
        deal.StartedAtUtc = now;
        deal.StartedByUserId = userId;
        if (deal.DirectPurchase != null)
        {
            deal.DirectPurchase.Status = DirectPurchaseStatus.InProgress;
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Deal {DealNumber} moved to InProgress by Supplier.", deal.DealNumber);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            deal.BuyerCompanyId,
            null,
            NotificationType.DealStarted,
            "Deal Started",
            $"Supplier has started fulfillment on Deal {deal.DealNumber}.",
            "Deal",
            deal.Id,
            $"deal_started_{deal.Id}",
            cancellationToken);

        return MapToDetailResponse(deal, company.Id);
    }

    // -------------------------------------------------------------------------
    // 5. Complete Deal
    // -------------------------------------------------------------------------

    public async Task<DealDetailResponse> CompleteDealAsync(
        Guid dealId,
        CancellationToken cancellationToken = default)
    {
        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id;

        var deal = await _context.Deals
            .Include(d => d.Rfq)
            .Include(d => d.Offer)
            .Include(d => d.DirectPurchase)
            .Include(d => d.BuyerCompany)
                .ThenInclude(c => c!.PrimaryContactUser)
            .Include(d => d.SupplierCompany)
                .ThenInclude(c => c!.PrimaryContactUser)
            .Include(d => d.Disputes)
                .ThenInclude(dp => dp.OpenedByCompany)
            .FirstOrDefaultAsync(d => d.Id == dealId || d.DirectPurchaseId == dealId, cancellationToken)
            ?? throw new NotFoundException($"Deal with ID '{dealId}' was not found.");

        if (deal.BuyerCompanyId != company.Id && deal.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("You are not a participant in this deal.");
        }

        var isBuyer = deal.BuyerCompanyId == company.Id;
        if (isBuyer)
        {
            if (member.Role != CompanyRole.Owner &&
                member.Role != CompanyRole.Admin &&
                member.Role != CompanyRole.ProcurementManager)
            {
                throw new ForbiddenException("Only company Owners, Admins, or Procurement Managers can complete deals.");
            }
        }
        else
        {
            if (member.Role != CompanyRole.Owner &&
                member.Role != CompanyRole.Admin &&
                member.Role != CompanyRole.SalesManager)
            {
                throw new ForbiddenException("Only company Owners, Admins, or Sales Managers can complete deals.");
            }
        }

        if (deal.Status != DealStatus.InProgress)
        {
            throw new ConflictException($"Deal must be in InProgress status to be marked completed. Current status: '{deal.Status}'.");
        }

        deal.Status = DealStatus.Completed;
        deal.CompletedAtUtc = now;
        deal.CompletedByUserId = userId;
        if (deal.DirectPurchase != null)
        {
            deal.DirectPurchase.Status = DirectPurchaseStatus.Completed;
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Deal {DealNumber} has been marked Completed.", deal.DealNumber);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            deal.BuyerCompanyId,
            null,
            NotificationType.DealCompleted,
            "Deal Completed",
            $"Deal {deal.DealNumber} has been marked Completed.",
            "Deal",
            deal.Id,
            $"deal_completed_{deal.Id}_buyer",
            cancellationToken);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            deal.SupplierCompanyId,
            null,
            NotificationType.DealCompleted,
            "Deal Completed",
            $"Deal {deal.DealNumber} has been marked Completed.",
            "Deal",
            deal.Id,
            $"deal_completed_{deal.Id}_supplier",
            cancellationToken);

        return MapToDetailResponse(deal, company.Id);
    }

    // -------------------------------------------------------------------------
    // 6. Cancel Deal
    // -------------------------------------------------------------------------

    public async Task<DealDetailResponse> CancelDealAsync(
        Guid dealId,
        CancelDealRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _cancelDealValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id;

        var deal = await _context.Deals
            .Include(d => d.Rfq)
            .Include(d => d.Offer)
            .Include(d => d.DirectPurchase)
            .Include(d => d.BuyerCompany)
                .ThenInclude(c => c!.PrimaryContactUser)
            .Include(d => d.SupplierCompany)
                .ThenInclude(c => c!.PrimaryContactUser)
            .Include(d => d.Disputes)
                .ThenInclude(dp => dp.OpenedByCompany)
            .FirstOrDefaultAsync(d => d.Id == dealId || d.DirectPurchaseId == dealId, cancellationToken)
            ?? throw new NotFoundException($"Deal with ID '{dealId}' was not found.");

        if (deal.BuyerCompanyId != company.Id && deal.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("You are not a participant in this deal.");
        }

        // Role check
        var isBuyer = deal.BuyerCompanyId == company.Id;
        if (isBuyer)
        {
            if (member.Role != CompanyRole.Owner &&
                member.Role != CompanyRole.Admin &&
                member.Role != CompanyRole.ProcurementManager)
            {
                throw new ForbiddenException("Only company Owners, Admins, or Procurement Managers can cancel deals.");
            }
        }
        else
        {
            if (member.Role != CompanyRole.Owner &&
                member.Role != CompanyRole.Admin &&
                member.Role != CompanyRole.SalesManager)
            {
                throw new ForbiddenException("Only company Owners, Admins, or Sales Managers can cancel deals.");
            }
        }

        if (deal.Status == DealStatus.Completed || deal.Status == DealStatus.Cancelled)
        {
            throw new ConflictException("Cannot cancel a completed or already cancelled deal.");
        }

        if (deal.Status == DealStatus.Disputed)
        {
            throw new ConflictException("Cannot cancel a disputed deal directly. The dispute must be resolved by an administrator.");
        }

        // State-dependent cancellation policy
        if (deal.Status == DealStatus.AwaitingConfirmation)
        {
            // Unilateral cancellation permitted prior to mutual confirmation
            deal.Status = DealStatus.Cancelled;
            deal.CancelledAtUtc = now;
            deal.CancelledByUserId = userId;
            deal.CancelledByCompanyId = company.Id;
            deal.CancellationReason = request.Reason;
            _logger.LogInformation("Deal {DealNumber} cancelled unilaterally while AwaitingConfirmation by company {CompanyId}.", deal.DealNumber, company.Id);
        }
        else if (deal.Status == DealStatus.Confirmed || deal.Status == DealStatus.InProgress)
        {
            // Controlled cancellation workflow
            if (!deal.CancellationRequestedByCompanyId.HasValue)
            {
                // First party requests cancellation
                deal.CancellationRequestedByCompanyId = company.Id;
                deal.CancellationRequestedByUserId = userId;
                deal.CancellationRequestedAtUtc = now;
                deal.CancellationRequestReason = request.Reason;
                _logger.LogInformation("Cancellation requested for Deal {DealNumber} by company {CompanyId}.", deal.DealNumber, company.Id);
            }
            else if (deal.CancellationRequestedByCompanyId.Value != company.Id)
            {
                // Counterparty agrees to the cancellation request -> Deal cancelled
                deal.Status = DealStatus.Cancelled;
                deal.CancelledAtUtc = now;
                deal.CancelledByUserId = userId;
                deal.CancelledByCompanyId = company.Id;
                deal.CancellationReason = $"Mutual agreement: {request.Reason} (Requested originally by counterparty: {deal.CancellationRequestReason})";
                _logger.LogInformation("Deal {DealNumber} cancelled by mutual agreement between buyer and supplier.", deal.DealNumber);
            }
            else
            {
                // Same party already requested cancellation
                throw new ConflictException("A cancellation request is already pending review by the counterparty.");
            }
        }

        if (deal.Status == DealStatus.Cancelled && deal.DirectPurchase != null)
        {
            deal.DirectPurchase.Status = DirectPurchaseStatus.Cancelled;
        }

        await _context.SaveChangesAsync(cancellationToken);

        if (deal.Status == DealStatus.Cancelled)
        {
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                deal.BuyerCompanyId,
                null,
                NotificationType.DealCancelled,
                "Deal Cancelled",
                $"Deal {deal.DealNumber} was cancelled. Reason: {deal.CancellationReason}",
                "Deal",
                deal.Id,
                $"deal_cancelled_{deal.Id}_{now.Ticks}_buyer",
                cancellationToken);

            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                deal.SupplierCompanyId,
                null,
                NotificationType.DealCancelled,
                "Deal Cancelled",
                $"Deal {deal.DealNumber} was cancelled. Reason: {deal.CancellationReason}",
                "Deal",
                deal.Id,
                $"deal_cancelled_{deal.Id}_{now.Ticks}_supplier",
                cancellationToken);
        }
        else if (deal.CancellationRequestedByCompanyId.HasValue)
        {
            var counterpartyCompanyId = isBuyer ? deal.SupplierCompanyId : deal.BuyerCompanyId;
            await _notificationService.CreateNotificationsForCompanyMembersAsync(
                counterpartyCompanyId,
                null,
                NotificationType.DealCancellationRequested,
                "Deal Cancellation Requested",
                $"Cancellation was requested for Deal {deal.DealNumber}. Reason: {request.Reason}",
                "Deal",
                deal.Id,
                $"deal_cancel_req_{deal.Id}_{now.Ticks}",
                cancellationToken);
        }

        return MapToDetailResponse(deal, company.Id);
    }

    // -------------------------------------------------------------------------
    // 7. Open Dispute (Participant)
    // -------------------------------------------------------------------------

    public async Task<DisputeDetailResponse> OpenDisputeAsync(
        Guid dealId,
        CreateDisputeRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _createDisputeValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id!.Value;

        var deal = await _context.Deals
            .Include(d => d.Rfq)
            .Include(d => d.Offer)
            .Include(d => d.DirectPurchase)
            .Include(d => d.BuyerCompany)
            .Include(d => d.SupplierCompany)
            .FirstOrDefaultAsync(d => d.Id == dealId, cancellationToken)
            ?? throw new NotFoundException($"Deal with ID '{dealId}' was not found.");

        if (deal.BuyerCompanyId != company.Id && deal.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("You are not a participant in this deal.");
        }

        var isBuyer = deal.BuyerCompanyId == company.Id;
        if (isBuyer)
        {
            if (member.Role != CompanyRole.Owner &&
                member.Role != CompanyRole.Admin &&
                member.Role != CompanyRole.ProcurementManager)
            {
                throw new ForbiddenException("Only company Owners, Admins, or Procurement Managers can open disputes.");
            }
        }
        else
        {
            if (member.Role != CompanyRole.Owner &&
                member.Role != CompanyRole.Admin &&
                member.Role != CompanyRole.SalesManager)
            {
                throw new ForbiddenException("Only company Owners, Admins, or Sales Managers can open disputes.");
            }
        }

        if (deal.Status == DealStatus.Cancelled)
        {
            throw new ConflictException("Cannot open a dispute for a cancelled deal.");
        }

        if (deal.Status == DealStatus.Disputed)
        {
            throw new ConflictException("An active dispute already exists for this deal.");
        }

        // Preserve previous state for resumption after dispute resolution
        deal.PreviousStatus = deal.Status;
        deal.Status = DealStatus.Disputed;

        var dispute = new DealDispute
        {
            DealId = deal.Id,
            OpenedByCompanyId = company.Id,
            OpenedByUserId = userId,
            Category = request.Category,
            Reason = request.Category.ToString(),
            Description = request.Description,
            Status = DisputeStatus.Open,
            OpenedAtUtc = now
        };

        _context.DealDisputes.Add(dispute);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Dispute opened on Deal {DealNumber} by company {CompanyId} with category {Category}.",
            deal.DealNumber, company.Id, request.Category);

        var otherCompanyId = isBuyer ? deal.SupplierCompanyId : deal.BuyerCompanyId;
        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            otherCompanyId,
            null,
            NotificationType.DealDisputeOpened,
            "Dispute Opened",
            $"A formal dispute was opened on Deal {deal.DealNumber}. Category: {request.Category}",
            "Deal",
            deal.Id,
            $"dispute_opened_{dispute.Id}",
            cancellationToken);

        return MapToDisputeDetailResponse(dispute, deal, company.Id);
    }

    // -------------------------------------------------------------------------
    // 8. Get Deal Disputes (Participant or Admin)
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<DisputeSummaryResponse>> GetDealDisputesAsync(
        Guid dealId,
        CancellationToken cancellationToken = default)
    {
        var deal = await _context.Deals
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == dealId, cancellationToken)
            ?? throw new NotFoundException($"Deal with ID '{dealId}' was not found.");

        Guid? callerCompanyId = null;

        if (!_currentUser.IsSystemAdmin)
        {
            var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);
            callerCompanyId = company.Id;

            if (deal.BuyerCompanyId != company.Id && deal.SupplierCompanyId != company.Id)
            {
                throw new ForbiddenException("You are not a participant in this deal.");
            }
        }

        var disputes = await _context.DealDisputes
            .AsNoTracking()
            .Include(dp => dp.Deal)
            .Include(dp => dp.OpenedByCompany)
            .Where(dp => dp.DealId == dealId)
            .OrderByDescending(dp => dp.OpenedAtUtc)
            .ToListAsync(cancellationToken);

        return disputes.Select(dp => MapToDisputeSummaryResponse(dp, callerCompanyId)).ToList();
    }

    // -------------------------------------------------------------------------
    // 9. Admin: Get Disputes (Paginated)
    // -------------------------------------------------------------------------

    public async Task<PagedResult<DisputeDetailResponse>> GetAdminDisputesAsync(
        DisputeStatus? status,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.DealDisputes
            .AsNoTracking()
            .Include(dp => dp.Deal)
                .ThenInclude(d => d.BuyerCompany)
            .Include(dp => dp.Deal)
                .ThenInclude(d => d.SupplierCompany)
            .Include(dp => dp.OpenedByCompany)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(dp => dp.Status == status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var disputes = await query
            .OrderByDescending(dp => dp.OpenedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = disputes.Select(dp => MapToDisputeDetailResponse(dp, dp.Deal, null)).ToList();

        return PagedResult<DisputeDetailResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    // -------------------------------------------------------------------------
    // 10. Admin: Get Dispute By ID
    // -------------------------------------------------------------------------

    public async Task<DisputeDetailResponse> GetAdminDisputeByIdAsync(
        Guid disputeId,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        var dispute = await _context.DealDisputes
            .AsNoTracking()
            .Include(dp => dp.Deal)
                .ThenInclude(d => d.BuyerCompany)
            .Include(dp => dp.Deal)
                .ThenInclude(d => d.SupplierCompany)
            .Include(dp => dp.OpenedByCompany)
            .FirstOrDefaultAsync(dp => dp.Id == disputeId, cancellationToken)
            ?? throw new NotFoundException($"Dispute with ID '{disputeId}' was not found.");

        return MapToDisputeDetailResponse(dispute, dispute.Deal, null);
    }

    // -------------------------------------------------------------------------
    // 11. Admin: Resolve Dispute
    // -------------------------------------------------------------------------

    public async Task<DisputeDetailResponse> ResolveDisputeAsync(
        Guid disputeId,
        ResolveDisputeRequest request,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        var validationResult = await _resolveDisputeValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var now = _dateTimeProvider.UtcNow;
        var adminUserId = _currentUser.Id;

        var dispute = await _context.DealDisputes
            .Include(dp => dp.Deal)
                .ThenInclude(d => d!.BuyerCompany)
                    .ThenInclude(c => c!.PrimaryContactUser)
            .Include(dp => dp.Deal)
                .ThenInclude(d => d!.SupplierCompany)
                    .ThenInclude(c => c!.PrimaryContactUser)
            .Include(dp => dp.OpenedByCompany)
            .FirstOrDefaultAsync(dp => dp.Id == disputeId, cancellationToken)
            ?? throw new NotFoundException($"Dispute with ID '{disputeId}' was not found.");

        if (dispute.Status == DisputeStatus.Resolved || dispute.Status == DisputeStatus.Dismissed)
        {
            throw new ConflictException("Dispute has already been resolved or closed.");
        }

        var deal = dispute.Deal
            ?? throw new NotFoundException($"Associated deal with ID '{dispute.DealId}' was not found.");

        dispute.Status = DisputeStatus.Resolved;
        dispute.ResolutionAction = request.Action;
        dispute.ResolutionNotes = request.ResolutionNotes;
        dispute.ResolvedAtUtc = now;
        dispute.ResolvedByUserId = adminUserId;

        if (request.Action == DisputeResolutionAction.ResumeDeal)
        {
            // Resume deal to previous state or safely derive from confirmation status
            deal.Status = deal.PreviousStatus ?? (
                deal.ConfirmedByBuyerAtUtc.HasValue && deal.ConfirmedBySupplierAtUtc.HasValue
                    ? DealStatus.Confirmed
                    : DealStatus.AwaitingConfirmation);
            deal.PreviousStatus = null;
            _logger.LogInformation("Dispute {DisputeId} resolved: Deal {DealNumber} resumed to status {Status}.",
                dispute.Id, deal.DealNumber, deal.Status);
        }
        else if (request.Action == DisputeResolutionAction.CancelDeal)
        {
            deal.Status = DealStatus.Cancelled;
            deal.CancelledAtUtc = now;
            deal.CancelledByUserId = adminUserId;
            deal.CancellationReason = $"Resolved by administrator: {request.ResolutionNotes}";
            _logger.LogInformation("Dispute {DisputeId} resolved: Deal {DealNumber} cancelled.",
                dispute.Id, deal.DealNumber);
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Notify both parties of dispute resolution
        var disputeNum = dispute.Id.ToString()[..8];
        var actionText = request.Action.ToString();

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            deal.BuyerCompanyId,
            null,
            NotificationType.DealDisputeResolved,
            "Dispute Resolved",
            $"Dispute on Deal {deal.DealNumber} has been resolved by platform admins. Resolution: {actionText}.",
            "Deal",
            deal.Id,
            $"dispute_resolved_{dispute.Id}_buyer",
            cancellationToken);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            deal.SupplierCompanyId,
            null,
            NotificationType.DealDisputeResolved,
            "Dispute Resolved",
            $"Dispute on Deal {deal.DealNumber} has been resolved by platform admins. Resolution: {actionText}.",
            "Deal",
            deal.Id,
            $"dispute_resolved_{dispute.Id}_supplier",
            cancellationToken);

        if (deal.BuyerCompany?.PrimaryContactUser?.Email != null)
        {
            await _emailService.SendDisputeResolutionAsync(
                deal.BuyerCompany.PrimaryContactUser.Email,
                deal.BuyerCompany.LegalName,
                deal.DealNumber,
                disputeNum,
                actionText,
                request.ResolutionNotes,
                cancellationToken);
        }

        if (deal.SupplierCompany?.PrimaryContactUser?.Email != null)
        {
            await _emailService.SendDisputeResolutionAsync(
                deal.SupplierCompany.PrimaryContactUser.Email,
                deal.SupplierCompany.LegalName,
                deal.DealNumber,
                disputeNum,
                actionText,
                request.ResolutionNotes,
                cancellationToken);
        }

        return MapToDisputeDetailResponse(dispute, deal, null);
    }

    // -------------------------------------------------------------------------
    // Helper Methods & Privacy Mappings
    // -------------------------------------------------------------------------

    private void RequireSystemAdmin()
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.IsSystemAdmin)
        {
            throw new ForbiddenException("Only platform System Administrators are authorized to perform this operation.");
        }
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

    private static DealSummaryResponse MapToSummaryResponse(Deal deal, Guid? callerCompanyId)
    {
        var buyerName = GetSanitizedCompanyName(deal.BuyerCompany, callerCompanyId == deal.BuyerCompanyId);
        var supplierName = GetSanitizedCompanyName(deal.SupplierCompany, callerCompanyId == deal.SupplierCompanyId);

        string? materialCategory = deal.Rfq?.TargetCategory?.NameEn ?? deal.Rfq?.TargetCategory?.NameAr;
        string? deliveryZone = null;
        if (deal.Rfq != null && (!string.IsNullOrWhiteSpace(deal.Rfq.DeliveryCity) || !string.IsNullOrWhiteSpace(deal.Rfq.DeliveryGovernorate)))
        {
            deliveryZone = $"{deal.Rfq.DeliveryCity}, {deal.Rfq.DeliveryGovernorate}".Trim(',', ' ');
        }

        string? paymentTerms = null;
        int? leadTimeDays = null;
        bool? shippingIncluded = null;

        if (!string.IsNullOrWhiteSpace(deal.CommercialTermsSnapshotJson))
        {
            try
            {
                var snapshot = JsonSerializer.Deserialize<DealCommercialTermsSnapshot>(deal.CommercialTermsSnapshotJson);
                if (snapshot != null)
                {
                    paymentTerms = snapshot.PaymentTerms;
                    leadTimeDays = snapshot.DeliveryLeadTimeDays;
                    shippingIncluded = snapshot.ShippingIncluded;
                }
            }
            catch
            {
                // Fallback gracefully if snapshot JSON parsing fails
            }
        }

        var title = deal.Source switch
        {
            DealSource.Tender => deal.Tender?.Title ?? deal.Tender?.TenderNumber ?? string.Empty,
            DealSource.DirectPurchase => deal.DirectPurchase?.CatalogProduct?.NameEn ?? "Direct Purchase",
            DealSource.ProductNegotiation => deal.ProductNegotiation?.CatalogProduct?.NameEn ?? "Negotiated Product Offer",
            _ => deal.Rfq?.Title ?? string.Empty
        };

        var rfqOrTenderNumber = deal.Source switch
        {
            DealSource.Tender => deal.Tender?.TenderNumber ?? string.Empty,
            DealSource.DirectPurchase => deal.DirectPurchase?.PurchaseNumber ?? string.Empty,
            DealSource.ProductNegotiation => deal.ProductNegotiation?.NegotiationNumber ?? string.Empty,
            _ => deal.Rfq?.RfqNumber ?? string.Empty
        };

        var offerOrBidNumber = deal.Source switch
        {
            DealSource.Tender => deal.Bid?.BidNumber ?? string.Empty,
            DealSource.DirectPurchase => deal.DirectPurchase?.CatalogProduct?.Sku ?? string.Empty,
            DealSource.ProductNegotiation => deal.ProductNegotiation?.CatalogProduct?.Sku ?? string.Empty,
            _ => deal.Offer?.OfferNumber ?? string.Empty
        };

        return new DealSummaryResponse(
            deal.Id,
            deal.DealNumber,
            deal.RfqId,
            rfqOrTenderNumber,
            title,
            deal.OfferId,
            offerOrBidNumber,
            deal.BuyerCompanyId,
            buyerName,
            deal.SupplierCompanyId,
            supplierName,
            deal.AgreedPrice,
            deal.Currency,
            deal.Status.ToString(),
            deal.CreatedAtUtc,
            deal.ConfirmedAtUtc,
            deal.CompletedAtUtc,
            deal.CancelledAtUtc,
            materialCategory,
            deliveryZone,
            paymentTerms,
            leadTimeDays,
            shippingIncluded,
            deal.Source.ToString(),
            deal.TenderId,
            deal.Tender?.TenderNumber,
            deal.BidId,
            deal.Bid?.BidNumber,
            deal.DirectPurchaseId,
            deal.DirectPurchase?.PurchaseNumber);
    }

    private static DealDetailResponse MapToDetailResponse(Deal deal, Guid? callerCompanyId)
    {
        var buyerName = GetSanitizedCompanyName(deal.BuyerCompany, callerCompanyId == deal.BuyerCompanyId);
        var supplierName = GetSanitizedCompanyName(deal.SupplierCompany, callerCompanyId == deal.SupplierCompanyId);

        var title = deal.Source switch
        {
            DealSource.Tender => deal.Tender?.Title ?? deal.Tender?.TenderNumber ?? string.Empty,
            DealSource.DirectPurchase => deal.DirectPurchase?.CatalogProduct?.NameEn ?? "Direct Purchase",
            DealSource.ProductNegotiation => deal.ProductNegotiation?.CatalogProduct?.NameEn ?? "Negotiated Product Offer",
            _ => deal.Rfq?.Title ?? string.Empty
        };

        var rfqOrTenderNumber = deal.Source switch
        {
            DealSource.Tender => deal.Tender?.TenderNumber ?? string.Empty,
            DealSource.DirectPurchase => deal.DirectPurchase?.PurchaseNumber ?? string.Empty,
            DealSource.ProductNegotiation => deal.ProductNegotiation?.NegotiationNumber ?? string.Empty,
            _ => deal.Rfq?.RfqNumber ?? string.Empty
        };

        var offerOrBidNumber = deal.Source switch
        {
            DealSource.Tender => deal.Bid?.BidNumber ?? string.Empty,
            DealSource.DirectPurchase => deal.DirectPurchase?.CatalogProduct?.Sku ?? string.Empty,
            DealSource.ProductNegotiation => deal.ProductNegotiation?.CatalogProduct?.Sku ?? string.Empty,
            _ => deal.Offer?.OfferNumber ?? string.Empty
        };

        DealCommercialTermsSnapshot? terms = null;
        if (!string.IsNullOrWhiteSpace(deal.CommercialTermsSnapshotJson))
        {
            try
            {
                terms = JsonSerializer.Deserialize<DealCommercialTermsSnapshot>(deal.CommercialTermsSnapshotJson);
            }
            catch
            {
                // Fallback if parsing fails
            }
        }

        var disputes = deal.Disputes
            .Select(dp => MapToDisputeSummaryResponse(dp, callerCompanyId))
            .ToList();

        return new DealDetailResponse(
            deal.Id,
            deal.DealNumber,
            deal.RfqId,
            rfqOrTenderNumber,
            title,
            deal.OfferId,
            offerOrBidNumber,
            deal.OfferRevisionNumber,
            deal.BuyerCompanyId,
            buyerName,
            deal.SupplierCompanyId,
            supplierName,
            deal.AgreedPrice,
            deal.Currency,
            deal.Status.ToString(),
            deal.ConfirmedByBuyerAtUtc.HasValue,
            deal.ConfirmedByBuyerAtUtc,
            deal.ConfirmedBySupplierAtUtc.HasValue,
            deal.ConfirmedBySupplierAtUtc,
            deal.ConfirmedAtUtc,
            deal.StartedAtUtc,
            deal.CompletedAtUtc,
            deal.CancelledAtUtc,
            deal.CancellationReason,
            deal.CancellationRequestedByCompanyId,
            deal.CancellationRequestReason,
            deal.DeliveryTerms,
            deal.EstimatedDeliveryDateUtc,
            deal.CreatedAtUtc,
            terms,
            disputes,
            deal.Source.ToString(),
            deal.TenderId,
            deal.Tender?.TenderNumber,
            deal.BidId,
            deal.Bid?.BidNumber,
            deal.BidRevisionNumber,
            deal.DirectPurchaseId,
            deal.DirectPurchase?.PurchaseNumber);
    }

    private static DisputeSummaryResponse MapToDisputeSummaryResponse(DealDispute dispute, Guid? callerCompanyId)
    {
        var companyName = GetSanitizedCompanyName(dispute.OpenedByCompany, callerCompanyId == dispute.OpenedByCompanyId);

        return new DisputeSummaryResponse(
            dispute.Id,
            dispute.DealId,
            dispute.Deal?.DealNumber ?? string.Empty,
            dispute.OpenedByCompanyId,
            companyName,
            dispute.Category.ToString(),
            dispute.Reason,
            dispute.Description,
            dispute.Status.ToString(),
            dispute.OpenedAtUtc,
            dispute.ResolvedAtUtc,
            dispute.ResolutionNotes);
    }

    private static DisputeDetailResponse MapToDisputeDetailResponse(DealDispute dispute, Deal deal, Guid? callerCompanyId)
    {
        var companyName = GetSanitizedCompanyName(dispute.OpenedByCompany, callerCompanyId == dispute.OpenedByCompanyId);

        DealSummaryResponse? dealSummary = null;
        if (deal != null)
        {
            dealSummary = MapToSummaryResponse(deal, callerCompanyId);
        }

        return new DisputeDetailResponse(
            dispute.Id,
            dispute.DealId,
            deal?.DealNumber ?? string.Empty,
            dispute.OpenedByCompanyId,
            companyName,
            dispute.Category.ToString(),
            dispute.Reason,
            dispute.Description,
            dispute.Status.ToString(),
            dispute.ResolutionAction?.ToString(),
            dispute.ResolutionNotes,
            dispute.ResolvedByUserId,
            dispute.OpenedAtUtc,
            dispute.ResolvedAtUtc,
            dealSummary);
    }

    private static string GetSanitizedCompanyName(Company? company, bool isCallerCompany)
    {
        if (company == null) return "Verified Company";
        if (isCallerCompany)
        {
            return !string.IsNullOrWhiteSpace(company.TradeName) ? company.TradeName : company.LegalName;
        }
        return !string.IsNullOrWhiteSpace(company.TradeName) ? company.TradeName : "Verified Industrial Partner";
    }
}
