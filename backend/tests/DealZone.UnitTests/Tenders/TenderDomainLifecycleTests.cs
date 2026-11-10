using DealZone.Domain.Deals;
using DealZone.Domain.Tenders;
using Xunit;

namespace DealZone.UnitTests.Tenders;

public class TenderDomainLifecycleTests
{
    [Fact]
    public void NewTender_InitializesInDraftStatus()
    {
        var tender = new Tender
        {
            TenderNumber = "TND-202611-0001",
            BuyerCompanyId = Guid.NewGuid(),
            Title = "Industrial Scrap Supply",
            DeliveryGovernorate = "Alexandria",
            DeliveryCity = "Borg El Arab",
            DeliveryAddress = "Zone 4",
            ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(10),
            Currency = "EGP"
        };

        Assert.Equal(TenderStatus.Draft, tender.Status);
        Assert.NotNull(tender.Items);
        Assert.Empty(tender.Items);
        Assert.NotNull(tender.Bids);
        Assert.Empty(tender.Bids);
        Assert.Null(tender.PublishedAtUtc);
        Assert.Null(tender.AwardedBidId);
        Assert.Null(tender.CancelledAtUtc);
        Assert.Equal(0, tender.ReopenedCount);
        Assert.False(tender.IsDeleted);
    }

    [Fact]
    public void NewBid_InitializesInSubmittedStatus()
    {
        var bid = new Bid
        {
            BidNumber = "BID-202611-0001",
            TenderId = Guid.NewGuid(),
            SupplierCompanyId = Guid.NewGuid(),
            RevisionNumber = 1,
            TotalAmount = 1500000m,
            Currency = "EGP",
            ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(15),
            DeliveryLeadTimeDays = 7,
            ShippingIncluded = true,
            PaymentTerms = "Cash on Delivery",
            SubmittedAtUtc = DateTimeOffset.UtcNow
        };

        Assert.Equal(BidStatus.Submitted, bid.Status);
        Assert.Equal(1, bid.RevisionNumber);
        Assert.Null(bid.OriginalBidId);
        Assert.NotNull(bid.Items);
        Assert.Empty(bid.Items);
        Assert.Null(bid.AcceptedAtUtc);
        Assert.Null(bid.RejectedAtUtc);
        Assert.Null(bid.WithdrawnAtUtc);
    }

    [Fact]
    public void Deal_WithTenderSource_HasCorrectDefaults()
    {
        var tenderId = Guid.NewGuid();
        var bidId = Guid.NewGuid();
        var buyerId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();

        var deal = new Deal
        {
            DealNumber = "DL-202611-0001",
            Source = DealSource.Tender,
            TenderId = tenderId,
            BidId = bidId,
            BidRevisionNumber = 1,
            BuyerCompanyId = buyerId,
            SupplierCompanyId = supplierId,
            AgreedPrice = 2500000m,
            Currency = "EGP",
            Status = DealStatus.AwaitingConfirmation,
            RfqId = null,
            OfferId = null,
            OfferRevisionNumber = null
        };

        Assert.Equal(DealSource.Tender, deal.Source);
        Assert.Equal(DealStatus.AwaitingConfirmation, deal.Status);
        Assert.Equal(tenderId, deal.TenderId);
        Assert.Equal(bidId, deal.BidId);
        Assert.Null(deal.RfqId);
        Assert.Null(deal.OfferId);
    }
}
