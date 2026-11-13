using DealZone.Application.Common.Models;
using DealZone.Application.Purchasing.DTOs;

namespace DealZone.Application.Common.Interfaces;

public interface INegotiationService
{
    Task<ProductNegotiationResponse> CreateNegotiationAsync(
        CreateProductNegotiationRequest request,
        CancellationToken cancellationToken = default);

    Task<PagedResult<ProductNegotiationResponse>> GetMyNegotiationsAsync(
        ProductNegotiationFilter filter,
        CancellationToken cancellationToken = default);

    Task<ProductNegotiationResponse> GetNegotiationByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<ProductNegotiationResponse> CounterNegotiationAsync(
        Guid id,
        CounterNegotiationRequest request,
        CancellationToken cancellationToken = default);

    Task<ProductNegotiationResponse> AcceptNegotiationAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<ProductNegotiationResponse> RejectNegotiationAsync(
        Guid id,
        RejectNegotiationRequest request,
        CancellationToken cancellationToken = default);

    Task<ProductNegotiationResponse> CancelNegotiationAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

