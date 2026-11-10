using DealZone.Domain.Rfqs;
using DealZone.Domain.Tenders;

namespace DealZone.Application.Tenders.DTOs;

// --- Tender Item Requests & Responses ---

public record CreateTenderItemRequest(
    Guid CategoryId,
    Guid? MaterialId,
    string MaterialName,
    string Specifications,
    decimal Quantity,
    MaterialUnit Unit,
    Guid? UnitOfMeasureId,
    decimal? TargetPricePerUnit,
    string? Notes);

public record TenderItemResponse(
    Guid Id,
    Guid TenderId,
    Guid CategoryId,
    string? CategoryName,
    Guid? MaterialId,
    string MaterialName,
    string Specifications,
    decimal Quantity,
    string Unit,
    decimal? TargetPricePerUnit,
    string? Notes,
    int LineNumber);

// --- Tender Requests ---

public record CreateTenderRequest(
    string Title,
    string? Description,
    Guid? TargetCategoryId,
    string DeliveryGovernorate,
    string DeliveryCity,
    string DeliveryAddress,
    DateTimeOffset? RequiredDeliveryDateUtc,
    DateTimeOffset ClosingDateUtc,
    decimal? ReferencePrice,
    string? Notes,
    IReadOnlyList<CreateTenderItemRequest> Items);

public record UpdateTenderRequest(
    string Title,
    string? Description,
    Guid? TargetCategoryId,
    string DeliveryGovernorate,
    string DeliveryCity,
    string DeliveryAddress,
    DateTimeOffset? RequiredDeliveryDateUtc,
    DateTimeOffset ClosingDateUtc,
    decimal? ReferencePrice,
    string? Notes,
    IReadOnlyList<CreateTenderItemRequest> Items);

public record ReopenTenderRequest(
    DateTimeOffset NewClosingDateUtc);

public record CancelTenderRequest(
    string Reason);

public record NoAwardTenderRequest(
    string Reason);

public record AwardTenderRequest(
    Guid BidId,
    string? Rationale);

// --- Bid Item Requests & Responses ---

public record SubmitBidItemRequest(
    Guid TenderItemId,
    decimal UnitPrice,
    string? Notes);

public record BidItemResponse(
    Guid Id,
    Guid BidId,
    Guid TenderItemId,
    string MaterialName,
    decimal Quantity,
    string Unit,
    decimal UnitPrice,
    decimal TotalPrice,
    string? Notes);

// --- Bid Requests ---

public record SubmitBidRequest(
    DateTimeOffset ValidityDateUtc,
    int DeliveryLeadTimeDays,
    bool ShippingIncluded,
    string PaymentTerms,
    string? Notes,
    IReadOnlyList<SubmitBidItemRequest> Items);

public record ReviseBidRequest(
    DateTimeOffset ValidityDateUtc,
    int DeliveryLeadTimeDays,
    bool ShippingIncluded,
    string PaymentTerms,
    string? Notes,
    string? ChangeSummary,
    IReadOnlyList<SubmitBidItemRequest> Items);

public record WithdrawBidRequest(
    string Reason);

// --- Summary & Detail Responses ---

public record TenderSummaryResponse(
    Guid Id,
    string TenderNumber,
    Guid BuyerCompanyId,
    string BuyerCompanyName,
    string Title,
    string? TargetCategoryName,
    string Status,
    string DeliveryGovernorate,
    string DeliveryCity,
    DateTimeOffset? RequiredDeliveryDateUtc,
    DateTimeOffset ClosingDateUtc,
    DateTimeOffset? PublishedAtUtc,
    decimal? ReferencePrice,
    string Currency,
    int ItemsCount,
    int ActiveBidsCount,
    decimal? LowestActiveBidAmount,
    bool IsExpired,
    DateTimeOffset CreatedAtUtc);

public record TenderDetailResponse(
    Guid Id,
    string TenderNumber,
    Guid BuyerCompanyId,
    string BuyerCompanyName,
    string Title,
    string? Description,
    Guid? TargetCategoryId,
    string? TargetCategoryName,
    string Status,
    string DeliveryGovernorate,
    string DeliveryCity,
    string DeliveryAddress,
    DateTimeOffset? RequiredDeliveryDateUtc,
    DateTimeOffset ClosingDateUtc,
    DateTimeOffset? PublishedAtUtc,
    decimal? ReferencePrice,
    string Currency,
    string? Notes,
    Guid? AwardedBidId,
    string? AwardRationale,
    DateTimeOffset? AwardedAtUtc,
    DateTimeOffset? CancelledAtUtc,
    string? CancellationReason,
    DateTimeOffset? ReopenedAtUtc,
    int ReopenedCount,
    int ActiveBidsCount,
    decimal? LowestActiveBidAmount,
    bool IsExpired,
    bool CanManage,
    bool CanBid,
    DateTimeOffset CreatedAtUtc,
    IReadOnlyList<TenderItemResponse> Items,
    BidSummaryResponse? MyActiveBid);

public record BidSummaryResponse(
    Guid Id,
    string BidNumber,
    Guid TenderId,
    string TenderNumber,
    string TenderTitle,
    Guid SupplierCompanyId,
    string? SupplierCompanyName,
    int RevisionNumber,
    string Status,
    decimal TotalAmount,
    string Currency,
    int DeliveryLeadTimeDays,
    bool ShippingIncluded,
    string PaymentTerms,
    DateTimeOffset SubmittedAtUtc,
    DateTimeOffset ValidityDateUtc,
    bool IsLowest);

public record BidDetailResponse(
    Guid Id,
    string BidNumber,
    Guid TenderId,
    string TenderNumber,
    string TenderTitle,
    Guid SupplierCompanyId,
    string? SupplierCompanyName,
    Guid? OriginalBidId,
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
    DateTimeOffset SubmittedAtUtc,
    DateTimeOffset? AcceptedAtUtc,
    DateTimeOffset? RejectedAtUtc,
    string? RejectionReason,
    DateTimeOffset? WithdrawnAtUtc,
    string? WithdrawalReason,
    bool IsLowest,
    IReadOnlyList<BidItemResponse> Items);

// --- Filters ---

public record TenderFilter(
    string? Search = null,
    Guid? CategoryId = null,
    TenderStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 20);

public record BidFilter(
    Guid? TenderId = null,
    BidStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 20);
