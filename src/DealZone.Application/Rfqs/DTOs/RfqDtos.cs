namespace DealZone.Application.Rfqs.DTOs;

public record CreateRfqItemRequest(
    Guid CategoryId,
    Guid? MaterialId,
    string MaterialName,
    string Specifications,
    decimal Quantity,
    Guid? UnitOfMeasureId,
    decimal? TargetPricePerUnit = null,
    string? Notes = null);

public record CreateRfqRequest(
    string Title,
    string? Description,
    Guid? TargetCategoryId,
    string DeliveryGovernorate,
    string DeliveryCity,
    string DeliveryAddress,
    DateTimeOffset ClosingDateUtc,
    DateTimeOffset? RequiredDeliveryDateUtc,
    decimal? TargetBudget,
    string? Currency,
    string? Notes,
    bool PublishImmediately,
    IReadOnlyList<CreateRfqItemRequest> Items);

public record UpdateRfqItemRequest(
    Guid? Id,
    Guid CategoryId,
    Guid? MaterialId,
    string MaterialName,
    string Specifications,
    decimal Quantity,
    Guid? UnitOfMeasureId,
    decimal? TargetPricePerUnit = null,
    string? Notes = null);

public record UpdateRfqRequest(
    string Title,
    string? Description,
    Guid? TargetCategoryId,
    string DeliveryGovernorate,
    string DeliveryCity,
    string DeliveryAddress,
    DateTimeOffset ClosingDateUtc,
    DateTimeOffset? RequiredDeliveryDateUtc,
    decimal? TargetBudget,
    string? Currency,
    string? Notes,
    IReadOnlyList<UpdateRfqItemRequest>? Items = null);

public record RfqItemResponse(
    Guid Id,
    int LineNumber,
    Guid CategoryId,
    string CategoryNameAr,
    string CategoryNameEn,
    Guid? MaterialId,
    string? MaterialCode,
    string MaterialName,
    string Specifications,
    decimal Quantity,
    Guid? UnitOfMeasureId,
    string UnitCode,
    string UnitNameAr,
    string UnitNameEn,
    decimal? TargetPricePerUnit,
    string? Notes);

public record RfqDetailResponse(
    Guid Id,
    string RfqNumber,
    Guid BuyerCompanyId,
    string BuyerCompanyName,
    string BuyerGovernorate,
    string BuyerCity,
    string Title,
    string? Description,
    string Status,
    Guid? TargetCategoryId,
    string? TargetCategoryNameAr,
    string? TargetCategoryNameEn,
    string DeliveryGovernorate,
    string DeliveryCity,
    string DeliveryAddress,
    DateTimeOffset? RequiredDeliveryDateUtc,
    DateTimeOffset ClosingDateUtc,
    DateTimeOffset? PublishedAtUtc,
    decimal? TargetBudget,
    string Currency,
    string? Notes,
    DateTimeOffset CreatedAtUtc,
    bool IsOwner,
    IReadOnlyList<RfqItemResponse> Items);

public record RfqSummaryResponse(
    Guid Id,
    string RfqNumber,
    Guid BuyerCompanyId,
    string BuyerCompanyName,
    string BuyerGovernorate,
    string BuyerCity,
    string Title,
    string Status,
    Guid? TargetCategoryId,
    string? TargetCategoryNameAr,
    string? TargetCategoryNameEn,
    string DeliveryGovernorate,
    string DeliveryCity,
    int ItemCount,
    DateTimeOffset ClosingDateUtc,
    DateTimeOffset? PublishedAtUtc,
    DateTimeOffset CreatedAtUtc);

public record RfqDiscoveryFilter(
    Guid? CategoryId = null,
    Guid? MaterialId = null,
    string? Governorate = null,
    string? City = null,
    string? SearchTerm = null,
    DateTimeOffset? ClosingBeforeUtc = null,
    int PageNumber = 1,
    int PageSize = 20,
    string? SortBy = null,
    bool SortDescending = false);

public record MyRfqFilter(
    string? Status = null,
    Guid? CategoryId = null,
    string? SearchTerm = null,
    int PageNumber = 1,
    int PageSize = 20,
    string? SortBy = null,
    bool SortDescending = false);

