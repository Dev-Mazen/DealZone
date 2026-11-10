using DealZone.Application.Purchasing.DTOs;
using DealZone.Application.Purchasing.Validators;
using Xunit;

namespace DealZone.UnitTests.Purchasing;

public class DirectPurchaseValidatorTests
{
    private readonly CreateDirectPurchaseRequestValidator _validator = new();

    [Fact]
    public void Validate_WithValidRequest_ShouldPass()
    {
        var request = new CreateDirectPurchaseRequest(
            Guid.NewGuid(),
            25m,
            "123 Industrial Area, 10th of Ramadan City",
            "Please deliver during morning hours.");

        var result = _validator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithEmptyCatalogProductId_ShouldFail()
    {
        var request = new CreateDirectPurchaseRequest(
            Guid.Empty,
            10m,
            null,
            null);

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateDirectPurchaseRequest.CatalogProductId));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Validate_WithZeroOrNegativeQuantity_ShouldFail(decimal quantity)
    {
        var request = new CreateDirectPurchaseRequest(
            Guid.NewGuid(),
            quantity,
            null,
            null);

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateDirectPurchaseRequest.Quantity));
    }

    [Fact]
    public void Validate_WithDeliveryAddressExceeding500Chars_ShouldFail()
    {
        var request = new CreateDirectPurchaseRequest(
            Guid.NewGuid(),
            10m,
            new string('A', 501),
            null);

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateDirectPurchaseRequest.DeliveryAddress));
    }

    [Fact]
    public void Validate_WithNotesExceeding1000Chars_ShouldFail()
    {
        var request = new CreateDirectPurchaseRequest(
            Guid.NewGuid(),
            10m,
            null,
            new string('N', 1001));

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateDirectPurchaseRequest.Notes));
    }
}

