using DealZone.Domain.Deals;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Reviews;

namespace DealZone.UnitTests.Domain;

public class ReviewInvariantsTests
{
    private readonly Guid _buyerCompanyId = Guid.NewGuid();
    private readonly Guid _supplierCompanyId = Guid.NewGuid();
    private readonly Guid _externalCompanyId = Guid.NewGuid();

    private Deal CreateTestDeal(DealStatus status)
    {
        return new Deal
        {
            BuyerCompanyId = _buyerCompanyId,
            SupplierCompanyId = _supplierCompanyId,
            Status = status,
            AgreedPrice = 500000m,
            Currency = "EGP"
        };
    }

    [Fact]
    public void Review_ForCompletedDeal_ShouldSucceed()
    {
        var deal = CreateTestDeal(DealStatus.Completed);

        var review = Review.Create(deal, _buyerCompanyId, _supplierCompanyId, 5, "Excellent raw materials delivered on time.");

        Assert.Equal(deal.Id, review.DealId);
        Assert.Equal(_buyerCompanyId, review.ReviewerCompanyId);
        Assert.Equal(_supplierCompanyId, review.TargetCompanyId);
        Assert.Equal(5, review.Rating);
        Assert.Equal("Excellent raw materials delivered on time.", review.Comment);
    }

    [Theory]
    [InlineData(DealStatus.PendingConfirmation)]
    [InlineData(DealStatus.Confirmed)]
    [InlineData(DealStatus.InProgress)]
    [InlineData(DealStatus.Disputed)]
    [InlineData(DealStatus.Cancelled)]
    public void Review_ForNonCompletedDeal_ShouldThrowDomainException(DealStatus nonCompletedStatus)
    {
        var deal = CreateTestDeal(nonCompletedStatus);

        var exception = Assert.Throws<DomainException>(() =>
            Review.Create(deal, _buyerCompanyId, _supplierCompanyId, 5, "Delivered"));

        Assert.Contains("completed deals", exception.Message);
    }

    [Fact]
    public void Review_ByNonPartyCompany_ShouldThrowDomainException()
    {
        var deal = CreateTestDeal(DealStatus.Completed);

        var exception = Assert.Throws<DomainException>(() =>
            Review.Create(deal, _externalCompanyId, _supplierCompanyId, 5, "Unrelated company"));

        Assert.Contains("participating in the deal", exception.Message);
    }

    [Fact]
    public void Review_SelfReview_ShouldThrowDomainException()
    {
        var deal = CreateTestDeal(DealStatus.Completed);

        var exception = Assert.Throws<DomainException>(() =>
            Review.Create(deal, _buyerCompanyId, _buyerCompanyId, 5, "Self review"));

        Assert.Contains("cannot review itself", exception.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(-1)]
    public void Review_WithInvalidRating_ShouldThrowDomainException(int invalidRating)
    {
        var deal = CreateTestDeal(DealStatus.Completed);

        var exception = Assert.Throws<DomainException>(() =>
            Review.Create(deal, _buyerCompanyId, _supplierCompanyId, invalidRating, "Invalid rating"));

        Assert.Contains("between 1 and 5", exception.Message);
    }
}

