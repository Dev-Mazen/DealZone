using System.Text.Json;
using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Application.Shipping.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Notifications;
using DealZone.Domain.Shipping;
using DealZone.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Services;

public class ShippingService : IShippingService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly INotificationService _notificationService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<ShippingService> _logger;
    private readonly IValidator<CreateShipmentRequest> _createShipmentValidator;
    private readonly IValidator<UpdateTrackingRequest> _updateTrackingValidator;
    private readonly IValidator<UpdateShipmentStatusRequest> _updateStatusValidator;
    private readonly IValidator<AssignShippingProviderRequest> _assignProviderValidator;
    private readonly IValidator<CreateShippingProviderRequest> _createProviderValidator;
    private readonly IValidator<UpdateShippingProviderRequest> _updateProviderValidator;

    public ShippingService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        INotificationService notificationService,
        IDateTimeProvider dateTimeProvider,
        ILogger<ShippingService> logger,
        IValidator<CreateShipmentRequest> createShipmentValidator,
        IValidator<UpdateTrackingRequest> updateTrackingValidator,
        IValidator<UpdateShipmentStatusRequest> updateStatusValidator,
        IValidator<AssignShippingProviderRequest> assignProviderValidator,
        IValidator<CreateShippingProviderRequest> createProviderValidator,
        IValidator<UpdateShippingProviderRequest> updateProviderValidator)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
        _createShipmentValidator = createShipmentValidator;
        _updateTrackingValidator = updateTrackingValidator;
        _updateStatusValidator = updateStatusValidator;
        _assignProviderValidator = assignProviderValidator;
        _createProviderValidator = createProviderValidator;
        _updateProviderValidator = updateProviderValidator;
    }

    // -------------------------------------------------------------------------
    // 1. Create Shipment (Supplier or Admin)
    // -------------------------------------------------------------------------

    public async Task<ShipmentResponse> CreateShipmentAsync(
        Guid dealId,
        CreateShipmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _createShipmentValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);
        var now = _dateTimeProvider.UtcNow;
        var userId = _currentUser.Id;

        var deal = await _context.Deals
            .Include(d => d.BuyerCompany)
            .Include(d => d.SupplierCompany)
            .FirstOrDefaultAsync(d => d.Id == dealId, cancellationToken)
            ?? throw new NotFoundException($"Deal with ID '{dealId}' was not found.");

        if (deal.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("Only the supplier company is authorized to arrange shipments for this deal.");
        }

        if (member.Role != CompanyRole.Owner &&
            member.Role != CompanyRole.Admin &&
            member.Role != CompanyRole.SalesManager)
        {
            throw new ForbiddenException("Only supplier Owners, Admins, or Sales Managers are authorized to create shipments.");
        }

        if (deal.Status != DealStatus.Confirmed && deal.Status != DealStatus.InProgress)
        {
            throw new ConflictException($"Shipments can only be created for Confirmed or InProgress deals. Current deal status: '{deal.Status}'.");
        }

        // Prevent duplicate active shipments for the same deal
        var hasActiveShipment = await _context.Shipments
            .AnyAsync(s => s.DealId == dealId &&
                           s.Status != ShipmentStatus.Failed &&
                           s.Status != ShipmentStatus.Cancelled, cancellationToken);

        if (hasActiveShipment)
        {
            throw new ConflictException("An active shipment already exists for this deal.");
        }

        var shipmentNumber = $"SHIP-{now:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        var initialEvents = new List<ShipmentTrackingEventDto>
        {
            new(
                Status: ShipmentStatus.Pending.ToString(),
                Location: request.PickupAddress,
                Description: $"Shipment created ({request.Arrangement}).",
                TimestampUtc: now,
                UpdatedBy: _currentUser.Email ?? "Supplier"
            )
        };

        var shipment = new Shipment
        {
            ShipmentNumber = shipmentNumber,
            DealId = deal.Id,
            Arrangement = request.Arrangement,
            PickupAddress = request.PickupAddress,
            DeliveryAddress = request.DeliveryAddress,
            CarrierName = request.Arrangement == ShippingArrangement.SupplierArranged ? request.CarrierName : null,
            TrackingNumber = request.Arrangement == ShippingArrangement.SupplierArranged ? request.TrackingNumber : null,
            Status = ShipmentStatus.Pending,
            EstimatedDeliveryDateUtc = request.EstimatedDeliveryDateUtc,
            Notes = request.Notes,
            TrackingEventsJson = JsonSerializer.Serialize(initialEvents),
            CreatedAtUtc = now
        };

        // If deal is Confirmed, move it to InProgress as shipping has been arranged
        if (deal.Status == DealStatus.Confirmed)
        {
            deal.Status = DealStatus.InProgress;
            deal.StartedAtUtc = now;
            deal.StartedByUserId = userId;
        }

        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Shipment {ShipmentNumber} created for Deal {DealNumber} with arrangement {Arrangement}.",
            shipment.ShipmentNumber, deal.DealNumber, shipment.Arrangement);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            deal.BuyerCompanyId,
            null,
            NotificationType.ShipmentCreated,
            "Shipment Created",
            $"A shipment ({shipment.ShipmentNumber}) has been created for Deal {deal.DealNumber}.",
            "Shipment",
            shipment.Id,
            $"shipment_created_{shipment.Id}",
            cancellationToken);

        return MapToShipmentResponse(shipment, deal, null);
    }

    // -------------------------------------------------------------------------
    // 1b. Get My Shipments (Buyer or Supplier Company)
    // -------------------------------------------------------------------------

    public async Task<PagedResult<ShipmentSummaryResponse>> GetMyShipmentsAsync(
        ShipmentFilter filter,
        CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var query = _context.Shipments
            .AsNoTracking()
            .Include(s => s.Deal)
                .ThenInclude(d => d.Rfq)
            .Include(s => s.Deal)
                .ThenInclude(d => d.BuyerCompany)
            .Include(s => s.Deal)
                .ThenInclude(d => d.SupplierCompany)
            .Include(s => s.ShippingProvider)
            .Where(s => s.Deal.BuyerCompanyId == company.Id || s.Deal.SupplierCompanyId == company.Id);

        if (filter.Status.HasValue)
        {
            query = query.Where(s => s.Status == filter.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Role))
        {
            if (filter.Role.Equals("buyer", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(s => s.Deal.BuyerCompanyId == company.Id);
            }
            else if (filter.Role.Equals("supplier", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(s => s.Deal.SupplierCompanyId == company.Id);
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var shipments = await query
            .OrderByDescending(s => s.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = shipments.Select(s => new ShipmentSummaryResponse(
            s.Id,
            s.ShipmentNumber,
            s.DealId,
            s.Deal.DealNumber,
            s.Deal.Rfq?.Title ?? s.Deal.DealNumber,
            s.Arrangement.ToString(),
            s.ShippingProviderId,
            s.ShippingProvider?.Name,
            s.CarrierName,
            s.TrackingNumber,
            s.Status.ToString(),
            s.Deal.SupplierCompany != null ? $"{s.Deal.SupplierCompany.City}, {s.Deal.SupplierCompany.Governorate}".Trim(',', ' ') : null,
            s.Deal.Rfq != null ? $"{s.Deal.Rfq.DeliveryCity}, {s.Deal.Rfq.DeliveryGovernorate}".Trim(',', ' ') : null,
            s.EstimatedDeliveryDateUtc,
            s.PickupDateUtc,
            s.ActualDeliveryDateUtc,
            s.CreatedAtUtc,
            s.Deal.BuyerCompanyId == company.Id,
            s.Deal.SupplierCompanyId == company.Id
        )).ToList();

        return PagedResult<ShipmentSummaryResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    // -------------------------------------------------------------------------
    // 2. Get Deal Shipments (Participant or Admin)
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<ShipmentResponse>> GetDealShipmentsAsync(
        Guid dealId,
        CancellationToken cancellationToken = default)
    {
        var deal = await _context.Deals
            .AsNoTracking()
            .Include(d => d.BuyerCompany)
            .Include(d => d.SupplierCompany)
            .FirstOrDefaultAsync(d => d.Id == dealId, cancellationToken)
            ?? throw new NotFoundException($"Deal with ID '{dealId}' was not found.");

        if (!_currentUser.IsSystemAdmin)
        {
            var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);
            if (deal.BuyerCompanyId != company.Id && deal.SupplierCompanyId != company.Id)
            {
                throw new ForbiddenException("You are not a participant in this deal.");
            }
        }

        var shipments = await _context.Shipments
            .AsNoTracking()
            .Include(s => s.Deal)
            .Include(s => s.ShippingProvider)
            .Where(s => s.DealId == dealId)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return shipments.Select(s => MapToShipmentResponse(s, deal, s.ShippingProvider)).ToList();
    }

    // -------------------------------------------------------------------------
    // 3. Get Shipment By ID
    // -------------------------------------------------------------------------

    public async Task<ShipmentResponse> GetShipmentByIdAsync(
        Guid shipmentId,
        CancellationToken cancellationToken = default)
    {
        var shipment = await _context.Shipments
            .AsNoTracking()
            .Include(s => s.Deal)
            .Include(s => s.ShippingProvider)
            .FirstOrDefaultAsync(s => s.Id == shipmentId, cancellationToken)
            ?? throw new NotFoundException($"Shipment with ID '{shipmentId}' was not found.");

        if (!_currentUser.IsSystemAdmin)
        {
            var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);
            if (shipment.Deal.BuyerCompanyId != company.Id && shipment.Deal.SupplierCompanyId != company.Id)
            {
                throw new ForbiddenException("You are not a participant in this deal.");
            }
        }

        return MapToShipmentResponse(shipment, shipment.Deal, shipment.ShippingProvider);
    }

    // -------------------------------------------------------------------------
    // 4. Update Tracking (Supplier or Admin)
    // -------------------------------------------------------------------------

    public async Task<ShipmentResponse> UpdateTrackingAsync(
        Guid shipmentId,
        UpdateTrackingRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _updateTrackingValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var shipment = await _context.Shipments
            .Include(s => s.Deal)
            .Include(s => s.ShippingProvider)
            .FirstOrDefaultAsync(s => s.Id == shipmentId, cancellationToken)
            ?? throw new NotFoundException($"Shipment with ID '{shipmentId}' was not found.");

        var now = _dateTimeProvider.UtcNow;

        if (!_currentUser.IsSystemAdmin)
        {
            var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);
            if (shipment.Deal.SupplierCompanyId != company.Id)
            {
                throw new ForbiddenException("Only the supplier company is authorized to update shipment tracking.");
            }

            if (member.Role != CompanyRole.Owner &&
                member.Role != CompanyRole.Admin &&
                member.Role != CompanyRole.SalesManager)
            {
                throw new ForbiddenException("Only supplier Owners, Admins, or Sales Managers can update tracking.");
            }

            if (shipment.Arrangement == ShippingArrangement.DealZoneArranged)
            {
                throw new ForbiddenException("Tracking for DealZone-arranged shipments is managed by platform administrators.");
            }
        }

        if (shipment.Status == ShipmentStatus.Delivered || shipment.Status == ShipmentStatus.Cancelled)
        {
            throw new ConflictException("Cannot update tracking information for delivered or cancelled shipments.");
        }

        if (!string.IsNullOrWhiteSpace(request.TrackingNumber))
        {
            shipment.TrackingNumber = request.TrackingNumber;
        }

        if (!string.IsNullOrWhiteSpace(request.CarrierName))
        {
            shipment.CarrierName = request.CarrierName;
        }

        AppendTrackingEvent(shipment, shipment.Status, request.Location, request.Description ?? "Tracking details updated.", now);

        await _context.SaveChangesAsync(cancellationToken);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            shipment.Deal.BuyerCompanyId,
            null,
            NotificationType.ShipmentTrackingUpdated,
            "Shipment Tracking Updated",
            $"Tracking information updated for shipment {shipment.ShipmentNumber} on Deal {shipment.Deal.DealNumber}.",
            "Shipment",
            shipment.Id,
            $"shipment_tracking_{shipment.Id}_{now.Ticks}",
            cancellationToken);

        return MapToShipmentResponse(shipment, shipment.Deal, shipment.ShippingProvider);
    }

    // -------------------------------------------------------------------------
    // 5. Update Status (Supplier for Supplier-Arranged)
    // -------------------------------------------------------------------------

    public async Task<ShipmentResponse> UpdateStatusAsync(
        Guid shipmentId,
        UpdateShipmentStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _updateStatusValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var shipment = await _context.Shipments
            .Include(s => s.Deal)
            .Include(s => s.ShippingProvider)
            .FirstOrDefaultAsync(s => s.Id == shipmentId, cancellationToken)
            ?? throw new NotFoundException($"Shipment with ID '{shipmentId}' was not found.");

        var (company, member) = await RequireApprovedCompanyAsync(cancellationToken);
        if (shipment.Deal.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("Only the supplier company is authorized to update status for supplier-arranged shipments.");
        }

        if (member.Role != CompanyRole.Owner &&
            member.Role != CompanyRole.Admin &&
            member.Role != CompanyRole.SalesManager)
        {
            throw new ForbiddenException("Only supplier Owners, Admins, or Sales Managers can update shipment status.");
        }

        if (shipment.Arrangement == ShippingArrangement.DealZoneArranged)
        {
            throw new ForbiddenException("DealZone-arranged shipment status transitions must be executed by platform administrators.");
        }

        ValidateStatusTransition(shipment.Status, request.Status, shipment.Arrangement, isAdmin: false);

        var now = _dateTimeProvider.UtcNow;
        ApplyStatusChange(shipment, request.Status, request.Location, request.Description, now);

        await _context.SaveChangesAsync(cancellationToken);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            shipment.Deal.BuyerCompanyId,
            null,
            NotificationType.ShipmentStatusChanged,
            "Shipment Status Updated",
            $"Shipment {shipment.ShipmentNumber} for Deal {shipment.Deal.DealNumber} status updated to {request.Status}.",
            "Shipment",
            shipment.Id,
            $"shipment_status_{shipment.Id}_{request.Status}_{now.Ticks}_buyer",
            cancellationToken);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            shipment.Deal.SupplierCompanyId,
            null,
            NotificationType.ShipmentStatusChanged,
            "Shipment Status Updated",
            $"Shipment {shipment.ShipmentNumber} for Deal {shipment.Deal.DealNumber} status updated to {request.Status}.",
            "Shipment",
            shipment.Id,
            $"shipment_status_{shipment.Id}_{request.Status}_{now.Ticks}_supplier",
            cancellationToken);

        return MapToShipmentResponse(shipment, shipment.Deal, shipment.ShippingProvider);
    }

    // -------------------------------------------------------------------------
    // 6. Admin: Get Shipments (Paginated)
    // -------------------------------------------------------------------------

    public async Task<PagedResult<ShipmentResponse>> GetAdminShipmentsAsync(
        ShipmentStatus? status,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Shipments
            .AsNoTracking()
            .Include(s => s.Deal)
            .Include(s => s.ShippingProvider)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var shipments = await query
            .OrderByDescending(s => s.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = shipments.Select(s => MapToShipmentResponse(s, s.Deal, s.ShippingProvider)).ToList();

        return PagedResult<ShipmentResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    // -------------------------------------------------------------------------
    // 7. Admin: Assign Shipping Provider
    // -------------------------------------------------------------------------

    public async Task<ShipmentResponse> AssignProviderAsync(
        Guid shipmentId,
        AssignShippingProviderRequest request,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        var validationResult = await _assignProviderValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var shipment = await _context.Shipments
            .Include(s => s.Deal)
            .Include(s => s.ShippingProvider)
            .FirstOrDefaultAsync(s => s.Id == shipmentId, cancellationToken)
            ?? throw new NotFoundException($"Shipment with ID '{shipmentId}' was not found.");

        var provider = await _context.ShippingProviders
            .FirstOrDefaultAsync(sp => sp.Id == request.ShippingProviderId, cancellationToken)
            ?? throw new NotFoundException($"Shipping provider with ID '{request.ShippingProviderId}' was not found.");

        if (!provider.IsActive)
        {
            throw new ConflictException("Cannot assign an inactive shipping provider.");
        }

        if (shipment.Status == ShipmentStatus.Delivered || shipment.Status == ShipmentStatus.Cancelled)
        {
            throw new ConflictException("Cannot assign a provider to a delivered or cancelled shipment.");
        }

        var now = _dateTimeProvider.UtcNow;
        shipment.ShippingProviderId = provider.Id;
        shipment.ShippingProvider = provider;
        shipment.Status = ShipmentStatus.Assigned;

        if (!string.IsNullOrWhiteSpace(request.TrackingNumber))
        {
            shipment.TrackingNumber = request.TrackingNumber;
        }

        if (request.EstimatedDeliveryDateUtc.HasValue)
        {
            shipment.EstimatedDeliveryDateUtc = request.EstimatedDeliveryDateUtc;
        }

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            shipment.Notes = request.Notes;
        }

        AppendTrackingEvent(shipment, ShipmentStatus.Assigned, null, $"Provider assigned: {provider.Name}.", now);

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Provider {ProviderName} assigned to Shipment {ShipmentNumber}.", provider.Name, shipment.ShipmentNumber);

        return MapToShipmentResponse(shipment, shipment.Deal, provider);
    }

    // -------------------------------------------------------------------------
    // 8. Admin: Update Shipment Status
    // -------------------------------------------------------------------------

    public async Task<ShipmentResponse> AdminUpdateStatusAsync(
        Guid shipmentId,
        UpdateShipmentStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        var validationResult = await _updateStatusValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var shipment = await _context.Shipments
            .Include(s => s.Deal)
            .Include(s => s.ShippingProvider)
            .FirstOrDefaultAsync(s => s.Id == shipmentId, cancellationToken)
            ?? throw new NotFoundException($"Shipment with ID '{shipmentId}' was not found.");

        ValidateStatusTransition(shipment.Status, request.Status, shipment.Arrangement, isAdmin: true);

        var now = _dateTimeProvider.UtcNow;
        ApplyStatusChange(shipment, request.Status, request.Location, request.Description, now);

        await _context.SaveChangesAsync(cancellationToken);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            shipment.Deal.BuyerCompanyId,
            null,
            NotificationType.ShipmentStatusChanged,
            "Shipment Status Updated",
            $"Shipment {shipment.ShipmentNumber} for Deal {shipment.Deal.DealNumber} status updated to {request.Status}.",
            "Shipment",
            shipment.Id,
            $"shipment_status_{shipment.Id}_{request.Status}_{now.Ticks}_buyer",
            cancellationToken);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            shipment.Deal.SupplierCompanyId,
            null,
            NotificationType.ShipmentStatusChanged,
            "Shipment Status Updated",
            $"Shipment {shipment.ShipmentNumber} for Deal {shipment.Deal.DealNumber} status updated to {request.Status}.",
            "Shipment",
            shipment.Id,
            $"shipment_status_{shipment.Id}_{request.Status}_{now.Ticks}_supplier",
            cancellationToken);

        return MapToShipmentResponse(shipment, shipment.Deal, shipment.ShippingProvider);
    }

    // -------------------------------------------------------------------------
    // 9. Admin: Provider Management
    // -------------------------------------------------------------------------

    public async Task<ShippingProviderResponse> CreateProviderAsync(
        CreateShippingProviderRequest request,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        var validationResult = await _createProviderValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var exists = await _context.ShippingProviders
            .AnyAsync(sp => sp.Name == request.Name.Trim(), cancellationToken);

        if (exists)
        {
            throw new ConflictException($"Shipping provider with name '{request.Name}' already exists.");
        }

        var provider = new ShippingProvider
        {
            Name = request.Name.Trim(),
            ContactPerson = request.ContactPerson.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email.Trim(),
            SupportedGovernorates = request.SupportedGovernorates?.Trim(),
            IsActive = true,
            CreatedAtUtc = _dateTimeProvider.UtcNow
        };

        _context.ShippingProviders.Add(provider);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToProviderResponse(provider);
    }

    public async Task<PagedResult<ShippingProviderResponse>> GetProvidersAsync(
        bool? isActive,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.ShippingProviders.AsNoTracking().AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(sp => sp.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var providers = await query
            .OrderBy(sp => sp.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = providers.Select(MapToProviderResponse).ToList();

        return PagedResult<ShippingProviderResponse>.Create(items, pageNumber, pageSize, totalCount);
    }

    public async Task<ShippingProviderResponse> GetProviderByIdAsync(
        Guid providerId,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        var provider = await _context.ShippingProviders
            .AsNoTracking()
            .FirstOrDefaultAsync(sp => sp.Id == providerId, cancellationToken)
            ?? throw new NotFoundException($"Shipping provider with ID '{providerId}' was not found.");

        return MapToProviderResponse(provider);
    }

    public async Task<ShippingProviderResponse> UpdateProviderAsync(
        Guid providerId,
        UpdateShippingProviderRequest request,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        var validationResult = await _updateProviderValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var provider = await _context.ShippingProviders
            .FirstOrDefaultAsync(sp => sp.Id == providerId, cancellationToken)
            ?? throw new NotFoundException($"Shipping provider with ID '{providerId}' was not found.");

        var duplicateName = await _context.ShippingProviders
            .AnyAsync(sp => sp.Name == request.Name.Trim() && sp.Id != providerId, cancellationToken);

        if (duplicateName)
        {
            throw new ConflictException($"Another shipping provider with name '{request.Name}' already exists.");
        }

        provider.Name = request.Name.Trim();
        provider.ContactPerson = request.ContactPerson.Trim();
        provider.Phone = request.Phone.Trim();
        provider.Email = request.Email.Trim();
        provider.SupportedGovernorates = request.SupportedGovernorates?.Trim();
        provider.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToProviderResponse(provider);
    }

    public async Task<ShippingProviderResponse> SetProviderActiveAsync(
        Guid providerId,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        var provider = await _context.ShippingProviders
            .FirstOrDefaultAsync(sp => sp.Id == providerId, cancellationToken)
            ?? throw new NotFoundException($"Shipping provider with ID '{providerId}' was not found.");

        provider.IsActive = isActive;
        await _context.SaveChangesAsync(cancellationToken);

        return MapToProviderResponse(provider);
    }

    public async Task DeleteProviderAsync(
        Guid providerId,
        CancellationToken cancellationToken = default)
    {
        RequireSystemAdmin();

        var provider = await _context.ShippingProviders
            .FirstOrDefaultAsync(sp => sp.Id == providerId, cancellationToken)
            ?? throw new NotFoundException($"Shipping provider with ID '{providerId}' was not found.");

        var isReferenced = await _context.Shipments
            .AnyAsync(s => s.ShippingProviderId == providerId, cancellationToken);

        if (isReferenced)
        {
            throw new ConflictException("Cannot delete shipping provider because it is referenced by existing shipments. Deactivate it instead.");
        }

        _context.ShippingProviders.Remove(provider);
        await _context.SaveChangesAsync(cancellationToken);
    }

    // -------------------------------------------------------------------------
    // Helper Methods & Lifecycle Rules
    // -------------------------------------------------------------------------

    private static void ValidateStatusTransition(
        ShipmentStatus current,
        ShipmentStatus next,
        ShippingArrangement arrangement,
        bool isAdmin)
    {
        if (current == next) return;

        if (current == ShipmentStatus.Delivered || current == ShipmentStatus.Cancelled)
        {
            throw new ConflictException($"Cannot transition shipment from terminal status '{current}' to '{next}'.");
        }

        var isAllowed = (current, next) switch
        {
            (ShipmentStatus.Pending, ShipmentStatus.Assigned) => isAdmin,
            (ShipmentStatus.Pending, ShipmentStatus.PickedUp) => arrangement == ShippingArrangement.SupplierArranged || isAdmin,
            (ShipmentStatus.Pending, ShipmentStatus.Cancelled) => true,
            (ShipmentStatus.Assigned, ShipmentStatus.PickedUp) => true,
            (ShipmentStatus.Assigned, ShipmentStatus.Cancelled) => true,
            (ShipmentStatus.PickedUp, ShipmentStatus.InTransit) => true,
            (ShipmentStatus.PickedUp, ShipmentStatus.Failed) => true,
            (ShipmentStatus.InTransit, ShipmentStatus.OutForDelivery) => true,
            (ShipmentStatus.InTransit, ShipmentStatus.Delivered) => true,
            (ShipmentStatus.InTransit, ShipmentStatus.Failed) => true,
            (ShipmentStatus.OutForDelivery, ShipmentStatus.Delivered) => true,
            (ShipmentStatus.OutForDelivery, ShipmentStatus.Failed) => true,
            (ShipmentStatus.Failed, ShipmentStatus.PickedUp) => true, // Retry pickup
            (ShipmentStatus.Failed, ShipmentStatus.InTransit) => true, // Retry transit
            (ShipmentStatus.Failed, ShipmentStatus.Cancelled) => true,
            _ => false
        };

        if (!isAllowed)
        {
            throw new ConflictException($"Invalid shipment status transition from '{current}' to '{next}'.");
        }
    }

    private void ApplyStatusChange(
        Shipment shipment,
        ShipmentStatus newStatus,
        string? location,
        string? description,
        DateTimeOffset now)
    {
        shipment.Status = newStatus;

        if (newStatus == ShipmentStatus.PickedUp && !shipment.PickupDateUtc.HasValue)
        {
            shipment.PickupDateUtc = now;
        }

        if (newStatus == ShipmentStatus.Delivered)
        {
            shipment.ActualDeliveryDateUtc = now;
        }

        AppendTrackingEvent(shipment, newStatus, location, description ?? $"Shipment status updated to {newStatus}.", now);
    }

    private void AppendTrackingEvent(
        Shipment shipment,
        ShipmentStatus status,
        string? location,
        string? description,
        DateTimeOffset now)
    {
        List<ShipmentTrackingEventDto> events;
        try
        {
            events = JsonSerializer.Deserialize<List<ShipmentTrackingEventDto>>(shipment.TrackingEventsJson) ?? [];
        }
        catch
        {
            events = [];
        }

        events.Add(new ShipmentTrackingEventDto(
            Status: status.ToString(),
            Location: location,
            Description: description,
            TimestampUtc: now,
            UpdatedBy: _currentUser.Email ?? (_currentUser.IsSystemAdmin ? "Administrator" : "User")
        ));

        shipment.TrackingEventsJson = JsonSerializer.Serialize(events);
    }

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

    private static ShipmentResponse MapToShipmentResponse(
        Shipment shipment,
        Deal? deal,
        ShippingProvider? provider)
    {
        List<ShipmentTrackingEventDto> events;
        try
        {
            events = JsonSerializer.Deserialize<List<ShipmentTrackingEventDto>>(shipment.TrackingEventsJson) ?? [];
        }
        catch
        {
            events = [];
        }

        return new ShipmentResponse(
            shipment.Id,
            shipment.ShipmentNumber,
            shipment.DealId,
            deal?.DealNumber ?? string.Empty,
            shipment.Arrangement.ToString(),
            shipment.ShippingProviderId,
            provider?.Name,
            shipment.CarrierName,
            shipment.TrackingNumber,
            shipment.PickupAddress,
            shipment.DeliveryAddress,
            shipment.Status.ToString(),
            shipment.PickupDateUtc,
            shipment.EstimatedDeliveryDateUtc,
            shipment.ActualDeliveryDateUtc,
            shipment.Notes,
            shipment.CreatedAtUtc,
            events);
    }

    private static ShippingProviderResponse MapToProviderResponse(ShippingProvider provider)
    {
        return new ShippingProviderResponse(
            provider.Id,
            provider.Name,
            provider.ContactPerson,
            provider.Phone,
            provider.Email,
            provider.SupportedGovernorates,
            provider.IsActive,
            provider.CreatedAtUtc);
    }
}

