using DealZone.Application.Reviews.DTOs;
using DealZone.Application.Reviews.Validators;
using DealZone.Domain.Deals;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Reviews;
using Xunit;

namespace DealZone.UnitTests.Reviews;

public class ReviewUnitTests
{
    private static Deal CreateTestDeal(DealStatus status, Guid buyerCompanyId, Guid supplierCompanyId)
    {
        return new Deal
        {
            DealNumber = "DEAL-202610-999999",
            BuyerCompanyId = buyerCompanyId,
            SupplierCompanyId = supplierCompanyId,
            Status = status,
            AgreedPrice = 100000m,
            Currency = "EGP"
        };
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(-1)]
    public void Review_RatingOutside1To5_ThrowsDomainException(int rating)
    {
        var buyerId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var deal = CreateTestDeal(DealStatus.Completed, buyerId, supplierId);

        var ex = Assert.Throws<DomainException>(() =>
            Review.Create(deal, buyerId, supplierId, rating, "Good"));

        Assert.Contains("between 1 and 5", ex.Message);
    }

    [Theory]
    [InlineData(DealStatus.AwaitingConfirmation)]
    [InlineData(DealStatus.Confirmed)]
    [InlineData(DealStatus.InProgress)]
    [InlineData(DealStatus.Disputed)]
    [InlineData(DealStatus.Cancelled)]
    public void Review_ForNonCompletedDeal_ThrowsDomainException(DealStatus status)
    {
        var buyerId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var deal = CreateTestDeal(status, buyerId, supplierId);

        var ex = Assert.Throws<DomainException>(() =>
            Review.Create(deal, buyerId, supplierId, 5, "Premature review"));

        Assert.Contains("completed deals", ex.Message);
    }

    [Fact]
    public void Review_SelfReview_ThrowsDomainException()
    {
        var buyerId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var deal = CreateTestDeal(DealStatus.Completed, buyerId, supplierId);

        var ex = Assert.Throws<DomainException>(() =>
            Review.Create(deal, buyerId, buyerId, 5, "Self review"));

        Assert.Contains("cannot review itself", ex.Message);
    }

    [Fact]
    public void Review_NonParticipant_ThrowsDomainException()
    {
        var buyerId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var thirdPartyId = Guid.NewGuid();
        var deal = CreateTestDeal(DealStatus.Completed, buyerId, supplierId);

        var ex = Assert.Throws<DomainException>(() =>
            Review.Create(deal, thirdPartyId, supplierId, 5, "Third party review"));

        Assert.Contains("participating in the deal", ex.Message);
    }

    [Fact]
    public void CreateReviewValidator_RejectsInvalidRatings()
    {
        var validator = new CreateReviewRequestValidator();

        var low = validator.Validate(new CreateReviewRequest(0, "Too low"));
        Assert.False(low.IsValid);

        var high = validator.Validate(new CreateReviewRequest(6, "Too high"));
        Assert.False(high.IsValid);

        var valid = validator.Validate(new CreateReviewRequest(4, "Great supplier"));
        Assert.True(valid.IsValid);
    }
}
