using DealZone.Domain.Shipping;

namespace DealZone.Application.Shipping.DTOs;

public record ShipmentTrackingEventDto(
    string Status,
    string? Location,
    string? Description,
    DateTimeOffset TimestampUtc,
    string UpdatedBy);

public record CreateShipmentRequest(
    ShippingArrangement Arrangement,
    string PickupAddress,
    string DeliveryAddress,
    string? CarrierName = null,
    string? TrackingNumber = null,
    DateTimeOffset? EstimatedDeliveryDateUtc = null,
    string? Notes = null);

public record UpdateTrackingRequest(
    string? TrackingNumber,
    string? CarrierName,
    string? Location = null,
    string? Description = null);

public record UpdateShipmentStatusRequest(
    ShipmentStatus Status,
    string? Location = null,
    string? Description = null);

public record AssignShippingProviderRequest(
    Guid ShippingProviderId,
    string? TrackingNumber = null,
    DateTimeOffset? EstimatedDeliveryDateUtc = null,
    string? Notes = null);

public record CreateShippingProviderRequest(
    string Name,
    string ContactPerson,
    string Phone,
    string Email,
    string? SupportedGovernorates = null);

public record UpdateShippingProviderRequest(
    string Name,
    string ContactPerson,
    string Phone,
    string Email,
    string? SupportedGovernorates = null,
    bool IsActive = true);

public record ShippingProviderResponse(
    Guid Id,
    string Name,
    string ContactPerson,
    string Phone,
    string Email,
    string? SupportedGovernorates,
    bool IsActive,
    DateTimeOffset CreatedAtUtc);

public record ShipmentResponse(
    Guid Id,
    string ShipmentNumber,
    Guid DealId,
    string DealNumber,
    string Arrangement,
    Guid? ShippingProviderId,
    string? ShippingProviderName,
    string? CarrierName,
    string? TrackingNumber,
    string PickupAddress,
    string DeliveryAddress,
    string Status,
    DateTimeOffset? PickupDateUtc,
    DateTimeOffset? EstimatedDeliveryDateUtc,
    DateTimeOffset? ActualDeliveryDateUtc,
    string? Notes,
    DateTimeOffset CreatedAtUtc,
    IReadOnlyList<ShipmentTrackingEventDto> TrackingEvents);

public record ShipmentFilter(
    ShipmentStatus? Status = null,
    string? Role = null,
    int PageNumber = 1,
    int PageSize = 10);

public record ShipmentSummaryResponse(
    Guid Id,
    string ShipmentNumber,
    Guid DealId,
    string DealNumber,
    string MaterialTitle,
    string Arrangement,
    Guid? ShippingProviderId,
    string? ShippingProviderName,
    string? CarrierName,
    string? TrackingNumber,
    string Status,
    string? OriginLocation,
    string? DestinationLocation,
    DateTimeOffset? EstimatedDeliveryDateUtc,
    DateTimeOffset? PickupDateUtc,
    DateTimeOffset? ActualDeliveryDateUtc,
    DateTimeOffset CreatedAtUtc,
    bool IsBuyer,
    bool IsSupplier);

