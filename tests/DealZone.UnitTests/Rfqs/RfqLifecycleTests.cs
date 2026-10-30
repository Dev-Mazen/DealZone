using DealZone.Domain.Companies;
using DealZone.Domain.Rfqs;
using Xunit;

namespace DealZone.UnitTests.Rfqs;

public class RfqLifecycleTests
{
    [Fact]
    public void NewRfq_ShouldInitializeWithDraftStatus_AndEmptyItems()
    {
        var rfq = new Rfq
        {
            BuyerCompanyId = Guid.NewGuid(),
            RfqNumber = "RFQ-202610-0001",
            Title = "Test RFQ",
            DeliveryGovernorate = "Cairo",
            DeliveryCity = "Nasr City",
            DeliveryAddress = "Zone 1",
            ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(7),
            Currency = "EGP"
        };

        Assert.Equal(RfqStatus.Draft, rfq.Status);
        Assert.NotNull(rfq.Items);
        Assert.Empty(rfq.Items);
        Assert.False(rfq.IsDeleted);
        Assert.Null(rfq.PublishedAtUtc);
    }

    [Fact]
    public void Company_WithoutApprovedStatus_CannotPerformCommercialActivities()
    {
        var pendingCompany = new Company
        {
            LegalName = "Pending Industrial Ltd",
            TradeName = "Pending",
            IndustrySector = "Manufacturing",
            Governorate = "Cairo",
            City = "Maadi",
            VerificationStatus = CompanyVerificationStatus.Pending,
            IsActive = true
        };

        Assert.False(pendingCompany.CanPerformCommercialActivities);

        var rejectedCompany = new Company
        {
            LegalName = "Rejected Industrial Ltd",
            TradeName = "Rejected",
            IndustrySector = "Chemicals",
            Governorate = "Cairo",
            City = "Maadi",
            VerificationStatus = CompanyVerificationStatus.Rejected,
            IsActive = true
        };

        Assert.False(rejectedCompany.CanPerformCommercialActivities);

        var approvedCompany = new Company
        {
            LegalName = "Approved Industrial Ltd",
            TradeName = "Approved",
            IndustrySector = "Metals",
            Governorate = "Cairo",
            City = "Maadi",
            VerificationStatus = CompanyVerificationStatus.Approved,
            IsActive = true
        };

        Assert.True(approvedCompany.CanPerformCommercialActivities);
    }

    [Fact]
    public void Rfq_CanTransitionToPublished_WithCorrectAuditTimestamps()
    {
        var rfq = new Rfq
        {
            BuyerCompanyId = Guid.NewGuid(),
            RfqNumber = "RFQ-202610-0002",
            Title = "Industrial Rebar RFQ",
            DeliveryGovernorate = "Giza",
            DeliveryCity = "6th of October",
            DeliveryAddress = "Zone 2",
            ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(5),
            Currency = "EGP",
            Status = RfqStatus.Draft
        };

        var publishTime = DateTimeOffset.UtcNow;
        rfq.Status = RfqStatus.Published;
        rfq.PublishedAtUtc = publishTime;

        Assert.Equal(RfqStatus.Published, rfq.Status);
        Assert.NotNull(rfq.PublishedAtUtc);
        Assert.Equal(publishTime, rfq.PublishedAtUtc);
    }

    [Fact]
    public void Rfq_CanTransitionToClosed_OrCancelled()
    {
        var rfq = new Rfq
        {
            BuyerCompanyId = Guid.NewGuid(),
            RfqNumber = "RFQ-202610-0003",
            Title = "Chemicals RFQ",
            DeliveryGovernorate = "Alexandria",
            DeliveryCity = "Borg El Arab",
            DeliveryAddress = "Zone 4",
            ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(3),
            Currency = "EGP",
            Status = RfqStatus.Published
        };

        rfq.Status = RfqStatus.Closed;

        Assert.Equal(RfqStatus.Closed, rfq.Status);

        var rfq2 = new Rfq
        {
            BuyerCompanyId = Guid.NewGuid(),
            RfqNumber = "RFQ-202610-0004",
            Title = "Polymer RFQ",
            DeliveryGovernorate = "Cairo",
            DeliveryCity = "Helwan",
            DeliveryAddress = "Zone 5",
            ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(3),
            Currency = "EGP",
            Status = RfqStatus.Published
        };

        rfq2.Status = RfqStatus.Cancelled;

        Assert.Equal(RfqStatus.Cancelled, rfq2.Status);
    }
}
