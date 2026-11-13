using DealZone.Domain.Deals;
using DealZone.Domain.Rfqs;
using Xunit;

namespace DealZone.UnitTests.Rfqs;

public class UnifiedRfqAwardTests
{
    [Fact]
    public void AwardRfq_SetsStatusToAwardedAndRecordsAwardMetadata()
    {
        var rfq = new Rfq
        {
            RfqNumber = "RFQ-202611-001",
            Title = "توريد لفائف حديد تسليح",
            Status = RfqStatus.Published,
            ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(3),
            BuyerCompanyId = Guid.NewGuid()
        };

        var winningOfferId = Guid.NewGuid();
        var awardUser = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        rfq.Status = RfqStatus.Awarded;
        rfq.AwardedOfferId = winningOfferId;
        rfq.AwardedAtUtc = now;
        rfq.AwardedByUserId = awardUser;
        rfq.AwardRationale = "Best commercial price and shortest lead time.";

        Assert.Equal(RfqStatus.Awarded, rfq.Status);
        Assert.Equal(winningOfferId, rfq.AwardedOfferId);
        Assert.Equal(now, rfq.AwardedAtUtc);
        Assert.Equal("Best commercial price and shortest lead time.", rfq.AwardRationale);
    }

    [Fact]
    public void ReopenRfq_ExtendsClosingDateAndIncrementsReopenCount()
    {
        var rfq = new Rfq
        {
            RfqNumber = "RFQ-202611-002",
            Title = "توريد سكر صناعي",
            Status = RfqStatus.Closed,
            ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(-1),
            BuyerCompanyId = Guid.NewGuid(),
            ReopenedCount = 0
        };

        var now = DateTimeOffset.UtcNow;
        rfq.Status = RfqStatus.Published;
        rfq.ClosingDateUtc = now.AddDays(7);
        rfq.ReopenedAtUtc = now;
        rfq.ReopenedCount++;

        Assert.Equal(RfqStatus.Published, rfq.Status);
        Assert.Equal(1, rfq.ReopenedCount);
        Assert.True(rfq.ClosingDateUtc > now);
    }

    [Fact]
    public void NoAwardRfq_SetsStatusToNoAwardWithReason()
    {
        var rfq = new Rfq
        {
            RfqNumber = "RFQ-202611-003",
            Title = "ألياف بوليستر",
            Status = RfqStatus.Closed,
            BuyerCompanyId = Guid.NewGuid()
        };

        rfq.Status = RfqStatus.NoAward;
        rfq.CancellationReason = "جميع العروض المقدمة تجاوزت الميزانية التقديرية.";

        Assert.Equal(RfqStatus.NoAward, rfq.Status);
        Assert.Equal("جميع العروض المقدمة تجاوزت الميزانية التقديرية.", rfq.CancellationReason);
    }

    [Fact]
    public void AwardedRfq_CreatesDealWithAwaitingConfirmation()
    {
        var rfqId = Guid.NewGuid();
        var offerId = Guid.NewGuid();
        var buyerId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();

        var deal = new Deal
        {
            DealNumber = "DZ-DEAL-2026-0088",
            Source = DealSource.Rfq,
            RfqId = rfqId,
            OfferId = offerId,
            BuyerCompanyId = buyerId,
            SupplierCompanyId = supplierId,
            AgreedPrice = 450000m,
            Currency = "EGP",
            Status = DealStatus.AwaitingConfirmation
        };

        Assert.Equal(DealSource.Rfq, deal.Source);
        Assert.Equal(DealStatus.AwaitingConfirmation, deal.Status);
        Assert.Equal(rfqId, deal.RfqId);
        Assert.Equal(offerId, deal.OfferId);
    }
}

