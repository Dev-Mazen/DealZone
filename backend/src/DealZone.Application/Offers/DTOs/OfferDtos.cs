namespace DealZone.Application.Offers.DTOs;

public record CreateOfferItemRequest(
    Guid RfqItemId,
    decimal UnitPrice,
    decimal OfferedQuantity,
    string? MaterialSpecifications = null,
    string? Notes = null);

public record CreateOfferRequest(
    int DeliveryLeadTimeDays,
    bool ShippingIncluded,
    string PaymentTerms,
    DateTimeOffset ValidityDateUtc,
    string? Currency,
    string? Notes,
    IReadOnlyList<CreateOfferItemRequest> Items);

public record ReviseOfferRequest(
    int DeliveryLeadTimeDays,
    bool ShippingIncluded,
    string PaymentTerms,
    DateTimeOffset ValidityDateUtc,
    string? Currency,
    string? Notes,
    string? ChangeSummary,
    IReadOnlyList<CreateOfferItemRequest> Items);

public record AcceptOfferRequest(string? Notes = null);

public record RejectOfferRequest(string Reason);

public record WithdrawOfferRequest(string? Reason = null);

public record OfferItemResponse(
    Guid Id,
    Guid RfqItemId,
    string RfqItemMaterialName,
    decimal UnitPrice,
    decimal OfferedQuantity,
    decimal TotalPrice,
    string? MaterialSpecifications,
    string? Notes);

public record OfferDetailResponse(
    Guid Id,
    string OfferNumber,
    Guid RfqId,
    string RfqNumber,
    string RfqTitle,
    Guid SupplierCompanyId,
    string SupplierCompanyName,
    string SupplierGovernorate,
    string SupplierCity,
    Guid? OriginalOfferId,
    int RevisionNumber,
    string Status,
    decimal TotalAmount,
    string Currency,
    DateTimeOffset ValidityDateUtc,
    int DeliveryLeadTimeDays,
    bool ShippingIncluded,
    string PaymentTerms,
    string? Notes,
    string? ChangeSummary,
    string? RejectionReason,
    DateTimeOffset SubmittedAtUtc,
    DateTimeOffset? AcceptedAtUtc,
    DateTimeOffset? RejectedAtUtc,
    bool IsOwner,
    IReadOnlyList<OfferItemResponse> Items,
    Guid? DealId = null,
    DateTimeOffset? WithdrawnAtUtc = null,
    string? WithdrawalReason = null);

public record OfferSummaryResponse(
    Guid Id,
    string OfferNumber,
    Guid RfqId,
    string RfqNumber,
    string RfqTitle,
    Guid SupplierCompanyId,
    string SupplierCompanyName,
    int RevisionNumber,
    string Status,
    decimal TotalAmount,
    string Currency,
    DateTimeOffset ValidityDateUtc,
    int DeliveryLeadTimeDays,
    bool ShippingIncluded,
    int ItemCount,
    DateTimeOffset SubmittedAtUtc);

public record OfferRevisionSummaryResponse(
    Guid Id,
    string OfferNumber,
    int RevisionNumber,
    string Status,
    decimal TotalAmount,
    string Currency,
    DateTimeOffset ValidityDateUtc,
    int DeliveryLeadTimeDays,
    bool ShippingIncluded,
    string PaymentTerms,
    string? ChangeSummary,
    DateTimeOffset SubmittedAtUtc);

public record OfferFilter(
    Guid? RfqId = null,
    string? Status = null,
    int PageNumber = 1,
    int PageSize = 20,
    string? SortBy = null,
    bool SortDescending = false);

