using DealZone.Application.Common.Models;
using DealZone.Application.Offers.DTOs;

namespace DealZone.Application.Common.Interfaces;

public interface IOfferService
{
    /// <summary>
    /// Submit a structured offer for an open RFQ as an approved supplier.
    /// </summary>
    Task<OfferDetailResponse> SubmitOfferAsync(
        Guid rfqId,
        CreateOfferRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all offers and revisions submitted by the current supplier company for a specific RFQ.
    /// </summary>
    Task<IReadOnlyList<OfferSummaryResponse>> GetMyOffersForRfqAsync(
        Guid rfqId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get authorized offer details. Accessible to the owning supplier or the owning buyer of the RFQ.
    /// </summary>
    Task<OfferDetailResponse> GetOfferByIdAsync(
        Guid offerId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// List all offers submitted across RFQs by the current supplier company.
    /// </summary>
    Task<PagedResult<OfferSummaryResponse>> GetMyOffersAsync(
        OfferFilter filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Submit a new immutable revision of an existing offer, superseding the previous version.
    /// </summary>
    Task<OfferDetailResponse> ReviseOfferAsync(
        Guid offerId,
        ReviseOfferRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get complete revision history lineage for an offer.
    /// </summary>
    Task<IReadOnlyList<OfferRevisionSummaryResponse>> GetOfferRevisionsAsync(
        Guid offerId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all submitted offers received for an RFQ. Accessible only to the owning buyer company.
    /// </summary>
    Task<IReadOnlyList<OfferDetailResponse>> GetOffersForRfqAsync(
        Guid rfqId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Accept a submitted offer. Atomically rejects competing offers and closes the RFQ.
    /// Accessible only to the owning buyer company.
    /// </summary>
    Task<OfferDetailResponse> AcceptOfferAsync(
        Guid offerId,
        AcceptOfferRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Reject a submitted offer.
    /// Accessible only to the owning buyer company.
    /// </summary>
    Task<OfferDetailResponse> RejectOfferAsync(
        Guid offerId,
        RejectOfferRequest request,
        CancellationToken cancellationToken = default);
}

