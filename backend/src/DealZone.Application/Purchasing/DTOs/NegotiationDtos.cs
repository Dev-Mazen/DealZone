namespace DealZone.Application.Purchasing.DTOs;

public record CreateProductNegotiationRequest(
    Guid CatalogProductId,
    decimal ProposedUnitPrice,
    decimal Quantity,
    int DeliveryLeadTimeDays = 7,
    string? DeliveryAddress = null,
    string? Notes = null);

public record CounterNegotiationRequest(
    decimal ProposedUnitPrice,
    decimal? Quantity = null,
    int? DeliveryLeadTimeDays = null,
    string? Notes = null);

public record RejectNegotiationRequest(
    string? Reason = null);

public record ProductNegotiationRevisionDto(
    int RevisionNumber,
    Guid ProposedByCompanyId,
    Guid ProposedByUserId,
    decimal UnitPrice,
    decimal Quantity,
    decimal TotalPrice,
    int DeliveryLeadTimeDays,
    string? Notes,
    DateTimeOffset CreatedAtUtc);

public record ProductNegotiationResponse(
    Guid Id,
    string NegotiationNumber,
    Guid CatalogProductId,
    string ProductSku,
    string ProductNameAr,
    string ProductNameEn,
    Guid CategoryId,
    string CategoryCode,
    string CategoryNameAr,
    string CategoryNameEn,
    Guid BuyerCompanyId,
    string BuyerCompanyName,
    Guid SupplierCompanyId,
    string SupplierCompanyName,
    decimal CurrentUnitPrice,
    decimal Quantity,
    decimal CurrentTotalPrice,
    string Currency,
    int DeliveryLeadTimeDays,
    string? DeliveryAddress,
    string? Notes,
    int Status,
    string StatusName,
    Guid LastActionByCompanyId,
    Guid? DealId,
    string? DealNumber,
    string? RejectionReason,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? RespondedAtUtc,
    IReadOnlyList<ProductNegotiationRevisionDto> Revisions);

public record ProductNegotiationFilter(
    Guid? CatalogProductId = null,
    int? Status = null,
    int PageNumber = 1,
    int PageSize = 20);

