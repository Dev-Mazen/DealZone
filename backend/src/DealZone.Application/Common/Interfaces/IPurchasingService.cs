using DealZone.Application.Common.Models;
using DealZone.Application.Purchasing.DTOs;

namespace DealZone.Application.Common.Interfaces;

public interface IPurchasingService
{
    Task<DirectPurchaseResponse> CreateDirectPurchaseAsync(
        CreateDirectPurchaseRequest request,
        CancellationToken cancellationToken = default);

    Task<PagedResult<DirectPurchaseResponse>> GetDirectPurchasesAsync(
        DirectPurchaseFilter filter,
        CancellationToken cancellationToken = default);

    Task<DirectPurchaseResponse> GetDirectPurchaseByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

