using DealZone.Application.Common.Models;
using DealZone.Application.Shipping.DTOs;
using DealZone.Domain.Shipping;

namespace DealZone.Application.Common.Interfaces;

public interface IShippingService
{
    // Participant & Admin Shipment Operations
    Task<ShipmentResponse> CreateShipmentAsync(
        Guid dealId,
        CreateShipmentRequest request,
        CancellationToken cancellationToken = default);

    Task<PagedResult<ShipmentSummaryResponse>> GetMyShipmentsAsync(
        ShipmentFilter filter,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ShipmentResponse>> GetDealShipmentsAsync(
        Guid dealId,
        CancellationToken cancellationToken = default);

    Task<ShipmentResponse> GetShipmentByIdAsync(
        Guid shipmentId,
        CancellationToken cancellationToken = default);

    Task<ShipmentResponse> UpdateTrackingAsync(
        Guid shipmentId,
        UpdateTrackingRequest request,
        CancellationToken cancellationToken = default);

    Task<ShipmentResponse> UpdateStatusAsync(
        Guid shipmentId,
        UpdateShipmentStatusRequest request,
        CancellationToken cancellationToken = default);

    // Admin Shipment Operations
    Task<PagedResult<ShipmentResponse>> GetAdminShipmentsAsync(
        ShipmentStatus? status,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<ShipmentResponse> AssignProviderAsync(
        Guid shipmentId,
        AssignShippingProviderRequest request,
        CancellationToken cancellationToken = default);

    Task<ShipmentResponse> AdminUpdateStatusAsync(
        Guid shipmentId,
        UpdateShipmentStatusRequest request,
        CancellationToken cancellationToken = default);

    // Admin Shipping Provider Management
    Task<ShippingProviderResponse> CreateProviderAsync(
        CreateShippingProviderRequest request,
        CancellationToken cancellationToken = default);

    Task<PagedResult<ShippingProviderResponse>> GetProvidersAsync(
        bool? isActive,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<ShippingProviderResponse> GetProviderByIdAsync(
        Guid providerId,
        CancellationToken cancellationToken = default);

    Task<ShippingProviderResponse> UpdateProviderAsync(
        Guid providerId,
        UpdateShippingProviderRequest request,
        CancellationToken cancellationToken = default);

    Task<ShippingProviderResponse> SetProviderActiveAsync(
        Guid providerId,
        bool isActive,
        CancellationToken cancellationToken = default);

    Task DeleteProviderAsync(
        Guid providerId,
        CancellationToken cancellationToken = default);
}

