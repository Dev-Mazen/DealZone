namespace DealZone.Application.Purchasing.DTOs;

public record CreateDirectPurchaseRequest(
    Guid CatalogProductId,
    decimal Quantity,
    string? DeliveryAddress = null,
    string? Notes = null);

public record DirectPurchaseResponse(
    Guid Id,
    string PurchaseNumber,
    Guid BuyerCompanyId,
    string BuyerCompanyName,
    Guid SupplierCompanyId,
    string SupplierCompanyName,
    Guid CatalogProductId,
    string Sku,
    string ProductNameAr,
    string ProductNameEn,
    string MaterialCode,
    string MaterialNameAr,
    string MaterialNameEn,
    string UnitCode,
    string UnitNameAr,
    string UnitNameEn,
    decimal Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    string Currency,
    int DeliveryLeadTimeDays,
    DateTimeOffset? EstimatedDeliveryDateUtc,
    string? DeliveryAddress,
    string? Notes,
    string Status,
    Guid? DealId,
    string? DealNumber,
    DateTimeOffset CreatedAtUtc);

public record DirectPurchaseFilter(
    string? Status = null,
    int PageNumber = 1,
    int PageSize = 20);

public record DirectPurchaseItemSnapshot(
    Guid CatalogProductId,
    string Sku,
    string ProductNameAr,
    string ProductNameEn,
    Guid MaterialId,
    string MaterialCode,
    string MaterialNameAr,
    string MaterialNameEn,
    string UnitCode,
    string UnitNameAr,
    string UnitNameEn,
    string CategoryCode,
    decimal Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    string Currency,
    int DeliveryLeadTimeDays,
    DateTimeOffset CreatedAtUtc);

