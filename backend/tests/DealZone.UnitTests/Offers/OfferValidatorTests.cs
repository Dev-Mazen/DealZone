using DealZone.Application.Offers.DTOs;
using DealZone.Application.Offers.Validators;
using Xunit;

namespace DealZone.UnitTests.Offers;

public class OfferValidatorTests
{
    private readonly CreateOfferRequestValidator _createOfferValidator = new();
    private readonly CreateOfferItemRequestValidator _createItemValidator = new();
    private readonly ReviseOfferRequestValidator _reviseOfferValidator = new();
    private readonly RejectOfferRequestValidator _rejectOfferValidator = new();

    [Fact]
    public void CreateOffer_WithValidData_ShouldPass()
    {
        var request = new CreateOfferRequest(
            DeliveryLeadTimeDays: 7,
            ShippingIncluded: true,
            PaymentTerms: "50% advance, 50% on delivery",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: "Ex-factory delivery option available",
            Items: new List<CreateOfferItemRequest>
            {
                new(Guid.NewGuid(), 35000, 100, "High tensile B500DWR", "Mill certs included")
            });

        var result = _createOfferValidator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void CreateOffer_WithNonPositiveLeadTime_ShouldFail(int leadTime)
    {
        var request = new CreateOfferRequest(
            DeliveryLeadTimeDays: leadTime,
            ShippingIncluded: false,
            PaymentTerms: "Cash",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            Currency: "EGP",
            Notes: null,
            Items: new List<CreateOfferItemRequest>
            {
                new(Guid.NewGuid(), 1000, 10, null, null)
            });

        var result = _createOfferValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateOfferRequest.DeliveryLeadTimeDays));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void CreateOffer_WithEmptyPaymentTerms_ShouldFail(string? paymentTerms)
    {
        var request = new CreateOfferRequest(
            DeliveryLeadTimeDays: 5,
            ShippingIncluded: false,
            PaymentTerms: paymentTerms!,
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            Currency: "EGP",
            Notes: null,
            Items: new List<CreateOfferItemRequest>
            {
                new(Guid.NewGuid(), 1000, 10, null, null)
            });

        var result = _createOfferValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateOfferRequest.PaymentTerms));
    }

    [Fact]
    public void CreateOffer_WithPastValidityDate_ShouldFail()
    {
        var request = new CreateOfferRequest(
            DeliveryLeadTimeDays: 5,
            ShippingIncluded: false,
            PaymentTerms: "Cash",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(-1),
            Currency: "EGP",
            Notes: null,
            Items: new List<CreateOfferItemRequest>
            {
                new(Guid.NewGuid(), 1000, 10, null, null)
            });

        var result = _createOfferValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateOfferRequest.ValidityDateUtc));
    }

    [Fact]
    public void CreateOffer_WithNoItems_ShouldFail()
    {
        var request = new CreateOfferRequest(
            DeliveryLeadTimeDays: 5,
            ShippingIncluded: false,
            PaymentTerms: "Cash",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            Currency: "EGP",
            Notes: null,
            Items: new List<CreateOfferItemRequest>());

        var result = _createOfferValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateOfferRequest.Items));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void CreateOfferItem_WithNonPositivePrice_ShouldFail(decimal price)
    {
        var item = new CreateOfferItemRequest(Guid.NewGuid(), price, 50, null, null);
        var result = _createItemValidator.Validate(item);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateOfferItemRequest.UnitPrice));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void CreateOfferItem_WithNonPositiveQuantity_ShouldFail(decimal quantity)
    {
        var item = new CreateOfferItemRequest(Guid.NewGuid(), 1500, quantity, null, null);
        var result = _createItemValidator.Validate(item);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateOfferItemRequest.OfferedQuantity));
    }

    [Fact]
    public void CreateOfferItem_WithEmptyRfqItemId_ShouldFail()
    {
        var item = new CreateOfferItemRequest(Guid.Empty, 1500, 10, null, null);
        var result = _createItemValidator.Validate(item);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateOfferItemRequest.RfqItemId));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void RejectOffer_WithEmptyReason_ShouldFail(string? reason)
    {
        var request = new RejectOfferRequest(reason!);
        var result = _rejectOfferValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RejectOfferRequest.Reason));
    }

    [Fact]
    public void RejectOffer_WithValidReason_ShouldPass()
    {
        var request = new RejectOfferRequest("Price exceeds project budget.");
        var result = _rejectOfferValidator.Validate(request);

        Assert.True(result.IsValid);
    }
}

