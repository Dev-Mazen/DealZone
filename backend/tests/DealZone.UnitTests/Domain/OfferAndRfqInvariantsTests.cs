using DealZone.Domain.Offers;
using DealZone.Domain.Rfqs;

namespace DealZone.UnitTests.Domain;

public class OfferAndRfqInvariantsTests
{
    [Fact]
    public void Rfq_InitialState_ShouldBeDraft()
    {
        var rfq = new Rfq();

        Assert.Equal(RfqStatus.Draft, rfq.Status);
        Assert.NotNull(rfq.Items);
        Assert.Empty(rfq.Items);
        Assert.False(rfq.IsDeleted);
    }

    [Fact]
    public void Offer_InitialState_ShouldHaveDefaultRevisionAndCurrency()
    {
        var offer = new Offer();

        Assert.Equal(OfferStatus.Submitted, offer.Status);
        Assert.Equal(1, offer.RevisionNumber);
        Assert.Equal("EGP", offer.Currency);
        Assert.NotNull(offer.Items);
        Assert.Empty(offer.Items);
    }

    [Fact]
    public void Offer_WithdrawalInvariants_ShouldSetWithdrawnStatusAndMetadata()
    {
        var now = DateTimeOffset.UtcNow;
        var userId = Guid.NewGuid();
        var offer = new Offer
        {
            Status = OfferStatus.Withdrawn,
            WithdrawnAtUtc = now,
            WithdrawnByUserId = userId,
            WithdrawalReason = "Supplier stock exhausted"
        };

        Assert.Equal(OfferStatus.Withdrawn, offer.Status);
        Assert.Equal(now, offer.WithdrawnAtUtc);
        Assert.Equal(userId, offer.WithdrawnByUserId);
        Assert.Equal("Supplier stock exhausted", offer.WithdrawalReason);
    }
}

