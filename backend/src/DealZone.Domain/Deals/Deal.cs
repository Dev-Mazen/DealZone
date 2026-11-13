using DealZone.Domain.Common;
using DealZone.Domain.Companies;
using DealZone.Domain.Offers;
using DealZone.Domain.Purchasing;
using DealZone.Domain.Rfqs;
using DealZone.Domain.Tenders;

namespace DealZone.Domain.Deals;

public class Deal : AuditableEntity, IConcurrencyToken
{
    public string DealNumber { get; set; } = string.Empty;

    public DealSource Source { get; set; } = DealSource.Rfq;

    // RFQ Source
    public Guid? RfqId { get; set; }
    public Rfq? Rfq { get; set; }

    public Guid? OfferId { get; set; }
    public Offer? Offer { get; set; }

    public int? OfferRevisionNumber { get; set; }

    // Tender Source
    public Guid? TenderId { get; set; }
    public Tender? Tender { get; set; }

    public Guid? BidId { get; set; }
    public Bid? Bid { get; set; }

    public int? BidRevisionNumber { get; set; }

    // Direct Catalog Purchase Source
    public Guid? DirectPurchaseId { get; set; }
    public DirectPurchase? DirectPurchase { get; set; }

    // Product Price Negotiation Source
    public Guid? ProductNegotiationId { get; set; }
    public ProductNegotiation? ProductNegotiation { get; set; }

    public Guid BuyerCompanyId { get; set; }
    public Company? BuyerCompany { get; set; }

    public Guid SupplierCompanyId { get; set; }
    public Company? SupplierCompany { get; set; }

    public decimal AgreedPrice { get; set; }
    public string Currency { get; set; } = "EGP";

    public DealStatus Status { get; set; } = DealStatus.AwaitingConfirmation;
    public DealStatus? PreviousStatus { get; set; } // Preserved during disputes

    // Confirmations
    public DateTimeOffset? ConfirmedByBuyerAtUtc { get; set; }
    public Guid? ConfirmedByBuyerUserId { get; set; }
    public DateTimeOffset? ConfirmedBySupplierAtUtc { get; set; }
    public Guid? ConfirmedBySupplierUserId { get; set; }
    public DateTimeOffset? ConfirmedAtUtc { get; set; }

    // Execution
    public DateTimeOffset? StartedAtUtc { get; set; }
    public Guid? StartedByUserId { get; set; }

    // Completion
    public DateTimeOffset? CompletedAtUtc { get; set; }
    public Guid? CompletedByUserId { get; set; }

    // Cancellation
    public DateTimeOffset? CancelledAtUtc { get; set; }
    public Guid? CancelledByUserId { get; set; }
    public Guid? CancelledByCompanyId { get; set; }
    public string? CancellationReason { get; set; }

    // Controlled cancellation request (when Confirmed or InProgress)
    public Guid? CancellationRequestedByCompanyId { get; set; }
    public Guid? CancellationRequestedByUserId { get; set; }
    public DateTimeOffset? CancellationRequestedAtUtc { get; set; }
    public string? CancellationRequestReason { get; set; }

    // Frozen commercial terms snapshot
    public string? DeliveryTerms { get; set; }
    public DateTimeOffset? EstimatedDeliveryDateUtc { get; set; }
    public string CommercialTermsSnapshotJson { get; set; } = string.Empty;

    // IConcurrencyToken
    public byte[] RowVersion { get; set; } = [];

    // Disputes
    public ICollection<DealDispute> Disputes { get; set; } = [];
}
