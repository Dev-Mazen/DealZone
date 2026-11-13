using DealZone.Application.Common.Models;
using DealZone.Application.Rfqs.DTOs;

namespace DealZone.Application.Common.Interfaces;

public interface IRfqService
{
    Task<RfqDetailResponse> CreateRfqAsync(CreateRfqRequest request, CancellationToken cancellationToken = default);
    Task<RfqDetailResponse> UpdateRfqAsync(Guid id, UpdateRfqRequest request, CancellationToken cancellationToken = default);
    Task<RfqDetailResponse> GetRfqByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<RfqSummaryResponse>> GetMyRfqsAsync(MyRfqFilter filter, CancellationToken cancellationToken = default);
    Task<PagedResult<RfqSummaryResponse>> DiscoverRfqsAsync(RfqDiscoveryFilter filter, CancellationToken cancellationToken = default);
    Task<RfqDetailResponse> PublishRfqAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RfqDetailResponse> CloseRfqAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RfqDetailResponse> CancelRfqAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RfqAwardResponse> AwardRfqAsync(Guid id, AwardRfqRequest request, CancellationToken cancellationToken = default);
    Task<RfqDetailResponse> ReopenRfqAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RfqDetailResponse> NoAwardRfqAsync(Guid id, string? reason, CancellationToken cancellationToken = default);
}
