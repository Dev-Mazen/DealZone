using DealZone.Application.Common.Models;
using DealZone.Application.Deals.DTOs;
using DealZone.Application.Tenders.DTOs;

namespace DealZone.Application.Common.Interfaces;

public interface ITenderService
{
    // Buyer Operations
    Task<TenderDetailResponse> CreateTenderAsync(CreateTenderRequest request, CancellationToken cancellationToken = default);
    Task<TenderDetailResponse> UpdateTenderAsync(Guid id, UpdateTenderRequest request, CancellationToken cancellationToken = default);
    Task<TenderDetailResponse> PublishTenderAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TenderDetailResponse> CloseTenderAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TenderDetailResponse> ReopenTenderAsync(Guid id, ReopenTenderRequest request, CancellationToken cancellationToken = default);
    Task<TenderDetailResponse> CancelTenderAsync(Guid id, CancelTenderRequest request, CancellationToken cancellationToken = default);
    Task<TenderDetailResponse> MarkNoAwardAsync(Guid id, NoAwardTenderRequest request, CancellationToken cancellationToken = default);
    Task<DealDetailResponse> AwardTenderAsync(Guid id, AwardTenderRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<TenderSummaryResponse>> GetMyTendersAsync(TenderFilter filter, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BidSummaryResponse>> GetTenderBidsAsync(Guid tenderId, CancellationToken cancellationToken = default);

    // Supplier & Discovery Operations
    Task<PagedResult<TenderSummaryResponse>> DiscoverTendersAsync(TenderFilter filter, CancellationToken cancellationToken = default);
    Task<TenderDetailResponse> GetTenderByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BidDetailResponse> SubmitBidAsync(Guid tenderId, SubmitBidRequest request, CancellationToken cancellationToken = default);
    Task<BidDetailResponse> ReviseBidAsync(Guid bidId, ReviseBidRequest request, CancellationToken cancellationToken = default);
    Task<BidDetailResponse> WithdrawBidAsync(Guid bidId, WithdrawBidRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<BidSummaryResponse>> GetMyBidsAsync(BidFilter filter, CancellationToken cancellationToken = default);
    Task<BidDetailResponse> GetBidByIdAsync(Guid bidId, CancellationToken cancellationToken = default);
}
