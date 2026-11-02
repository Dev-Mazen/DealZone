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
}

