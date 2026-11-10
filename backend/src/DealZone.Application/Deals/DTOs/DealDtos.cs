using DealZone.Domain.Deals;

namespace DealZone.Application.Deals.DTOs;

public record DealItemSnapshot(
    Guid RfqItemId,
    string MaterialName,
    decimal UnitPrice,
    decimal OfferedQuantity,
    decimal TotalPrice,
    string? MaterialSpecifications,
    string? Notes);

public record DealCommercialTermsSnapshot(
    Guid OfferId,
    int OfferRevisionNumber,
    string OfferNumber,
    Guid RfqId,
    string RfqNumber,
    string RfqTitle,
    decimal TotalAmount,
    string Currency,
    int DeliveryLeadTimeDays,
    bool ShippingIncluded,
    string PaymentTerms,
    string? DeliveryTerms,
    DateTimeOffset? EstimatedDeliveryDateUtc,
    DateTimeOffset ValidityDateUtc,
    string? Notes,
    IReadOnlyList<DealItemSnapshot> Items);

public record CancelDealRequest(string Reason);

public record CreateDisputeRequest(DisputeCategory Category, string Description);

public record ResolveDisputeRequest(DisputeResolutionAction Action, string ResolutionNotes);

public record DisputeSummaryResponse(
    Guid Id,
    Guid DealId,
    string DealNumber,
    Guid OpenedByCompanyId,
    string OpenedByCompanyName,
    string Category,
    string Reason,
    string Description,
    string Status,
    DateTimeOffset OpenedAtUtc,
    DateTimeOffset? ResolvedAtUtc,
    string? ResolutionNotes);

public record DisputeDetailResponse(
    Guid Id,
    Guid DealId,
    string DealNumber,
    Guid OpenedByCompanyId,
    string OpenedByCompanyName,
    string Category,
    string Reason,
    string Description,
    string Status,
    string? ResolutionAction,
    string? ResolutionNotes,
    Guid? ResolvedByUserId,
    DateTimeOffset OpenedAtUtc,
    DateTimeOffset? ResolvedAtUtc,
    DealSummaryResponse? Deal);

public record DealSummaryResponse(
    Guid Id,
    string DealNumber,
    Guid? RfqId,
    string RfqNumber,
    string RfqTitle,
    Guid? OfferId,
    string OfferNumber,
    Guid BuyerCompanyId,
    string BuyerCompanyName,
    Guid SupplierCompanyId,
    string SupplierCompanyName,
    decimal AgreedPrice,
    string Currency,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? ConfirmedAtUtc,
    DateTimeOffset? CompletedAtUtc,
    DateTimeOffset? CancelledAtUtc,
    string? MaterialCategory = null,
    string? DeliveryZone = null,
    string? PaymentTerms = null,
    int? LeadTimeDays = null,
    bool? ShippingIncluded = null,
    string DealSource = "Rfq",
    Guid? TenderId = null,
    string? TenderNumber = null,
    Guid? BidId = null,
    string? BidNumber = null,
    Guid? DirectPurchaseId = null,
    string? DirectPurchaseNumber = null);

public record DealDetailResponse(
    Guid Id,
    string DealNumber,
    Guid? RfqId,
    string RfqNumber,
    string RfqTitle,
    Guid? OfferId,
    string OfferNumber,
    int? OfferRevisionNumber,
    Guid BuyerCompanyId,
    string BuyerCompanyName,
    Guid SupplierCompanyId,
    string SupplierCompanyName,
    decimal AgreedPrice,
    string Currency,
    string Status,
    bool ConfirmedByBuyer,
    DateTimeOffset? ConfirmedByBuyerAtUtc,
    bool ConfirmedBySupplier,
    DateTimeOffset? ConfirmedBySupplierAtUtc,
    DateTimeOffset? ConfirmedAtUtc,
    DateTimeOffset? StartedAtUtc,
    DateTimeOffset? CompletedAtUtc,
    DateTimeOffset? CancelledAtUtc,
    string? CancellationReason,
    Guid? CancellationRequestedByCompanyId,
    string? CancellationRequestReason,
    string? DeliveryTerms,
    DateTimeOffset? EstimatedDeliveryDateUtc,
    DateTimeOffset CreatedAtUtc,
    DealCommercialTermsSnapshot? CommercialTerms,
    IReadOnlyList<DisputeSummaryResponse> Disputes,
    string DealSource = "Rfq",
    Guid? TenderId = null,
    string? TenderNumber = null,
    Guid? BidId = null,
    string? BidNumber = null,
    int? BidRevisionNumber = null,
    Guid? DirectPurchaseId = null,
    string? DirectPurchaseNumber = null);

