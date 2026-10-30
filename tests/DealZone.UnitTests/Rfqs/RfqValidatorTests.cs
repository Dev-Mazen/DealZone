using DealZone.Application.Rfqs.DTOs;
using DealZone.Application.Rfqs.Validators;
using Xunit;

namespace DealZone.UnitTests.Rfqs;

public class RfqValidatorTests
{
    private readonly CreateRfqRequestValidator _createRfqValidator = new();
    private readonly CreateRfqItemRequestValidator _createItemValidator = new();

    [Fact]
    public void CreateRfq_WithValidData_ShouldPass()
    {
        var request = new CreateRfqRequest(
            "Request for 50 Tons Rebar",
            "Needed for construction project in 6th of October City",
            Guid.NewGuid(),
            "Giza",
            "6th of October",
            "Industrial Zone 3, Plot 14",
            DateTimeOffset.UtcNow.AddDays(7),
            DateTimeOffset.UtcNow.AddDays(14),
            1500000m,
            "EGP",
            "Delivery must include mill test certificates",
            PublishImmediately: false,
            Items: new List<CreateRfqItemRequest>
            {
                new(Guid.NewGuid(), null, "Steel Rebar 12mm", "High strength B500DWR", 50, Guid.NewGuid(), 30000, null)
            });

        var result = _createRfqValidator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateRfq_WithClosingDateInPast_ShouldFail()
    {
        var request = new CreateRfqRequest(
            "Past Closing Date RFQ",
            null,
            Guid.NewGuid(),
            "Cairo",
            "Nasr City",
            "Zone 1",
            DateTimeOffset.UtcNow.AddMinutes(-10),
            null,
            null,
            "EGP",
            null,
            false,
            new List<CreateRfqItemRequest>());

        var result = _createRfqValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRfqRequest.ClosingDateUtc));
    }

    [Fact]
    public void CreateRfq_WithDeliveryDateBeforeClosingDate_ShouldFail()
    {
        var closing = DateTimeOffset.UtcNow.AddDays(10);
        var delivery = DateTimeOffset.UtcNow.AddDays(5);

        var request = new CreateRfqRequest(
            "Invalid Dates RFQ",
            null,
            Guid.NewGuid(),
            "Cairo",
            "Nasr City",
            "Zone 1",
            closing,
            delivery,
            null,
            "EGP",
            null,
            false,
            new List<CreateRfqItemRequest>());

        var result = _createRfqValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRfqRequest.RequiredDeliveryDateUtc));
    }

    [Fact]
    public void CreateRfq_WithPublishImmediatelyAndNoItems_ShouldFail()
    {
        var request = new CreateRfqRequest(
            "Immediate Publish RFQ",
            null,
            Guid.NewGuid(),
            "Alexandria",
            "Borg El Arab",
            "Industrial Area",
            DateTimeOffset.UtcNow.AddDays(7),
            null,
            null,
            "EGP",
            null,
            PublishImmediately: true,
            Items: new List<CreateRfqItemRequest>());

        var result = _createRfqValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRfqRequest.Items));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-500)]
    public void CreateRfq_WithNonPositiveBudget_ShouldFail(decimal budget)
    {
        var request = new CreateRfqRequest(
            "Bad Budget RFQ",
            null,
            Guid.NewGuid(),
            "Cairo",
            "Helwan",
            "Factory site",
            DateTimeOffset.UtcNow.AddDays(7),
            null,
            TargetBudget: budget,
            Currency: "EGP",
            Notes: null,
            PublishImmediately: false,
            Items: new List<CreateRfqItemRequest>());

        var result = _createRfqValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRfqRequest.TargetBudget));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10)]
    public void CreateRfqItem_WithZeroOrNegativeQuantity_ShouldFail(decimal quantity)
    {
        var item = new CreateRfqItemRequest(
            Guid.NewGuid(),
            null,
            "Chemical solvent",
            "Purity 99.5%",
            quantity,
            Guid.NewGuid(),
            null,
            null);

        var result = _createItemValidator.Validate(item);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRfqItemRequest.Quantity));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void CreateRfqItem_WithEmptyMaterialName_ShouldFail(string? materialName)
    {
        var item = new CreateRfqItemRequest(
            Guid.NewGuid(),
            null,
            materialName!,
            "Specs",
            100,
            Guid.NewGuid(),
            null,
            null);

        var result = _createItemValidator.Validate(item);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRfqItemRequest.MaterialName));
    }

    [Fact]
    public void CreateRfqItem_WithValidData_ShouldPass()
    {
        var item = new CreateRfqItemRequest(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "HDPE Granules",
            "Blow moulding grade, MFI 0.3",
            25,
            Guid.NewGuid(),
            50000,
            "Prompt delivery required");

        var result = _createItemValidator.Validate(item);

        Assert.True(result.IsValid);
    }
}
