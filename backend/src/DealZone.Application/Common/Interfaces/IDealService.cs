using DealZone.Application.Common.Models;
using DealZone.Application.Deals.DTOs;
using DealZone.Domain.Deals;

namespace DealZone.Application.Common.Interfaces;

public interface IDealService
{
    Task<PagedResult<DealSummaryResponse>> GetMyDealsAsync(
        DealStatus? status,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<DealDetailResponse> GetDealByIdAsync(
        Guid dealId,
        CancellationToken cancellationToken = default);

    Task<DealDetailResponse> ConfirmDealAsync(
        Guid dealId,
        CancellationToken cancellationToken = default);

    Task<DealDetailResponse> StartDealAsync(
        Guid dealId,
        CancellationToken cancellationToken = default);

    Task<DealDetailResponse> CompleteDealAsync(
        Guid dealId,
        CancellationToken cancellationToken = default);

    Task<DealDetailResponse> CancelDealAsync(
        Guid dealId,
        CancelDealRequest request,
        CancellationToken cancellationToken = default);

    // Participant Disputes
    Task<DisputeDetailResponse> OpenDisputeAsync(
        Guid dealId,
        CreateDisputeRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DisputeSummaryResponse>> GetDealDisputesAsync(
        Guid dealId,
        CancellationToken cancellationToken = default);

    // Admin Disputes
    Task<PagedResult<DisputeDetailResponse>> GetAdminDisputesAsync(
        DisputeStatus? status,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<DisputeDetailResponse> GetAdminDisputeByIdAsync(
        Guid disputeId,
        CancellationToken cancellationToken = default);

    Task<DisputeDetailResponse> ResolveDisputeAsync(
        Guid disputeId,
        ResolveDisputeRequest request,
        CancellationToken cancellationToken = default);
}

