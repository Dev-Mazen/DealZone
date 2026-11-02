using System.Text.Json;
using DealZone.Application.Deals.DTOs;
using DealZone.Application.Deals.Validators;
using DealZone.Domain.Deals;
using Xunit;

namespace DealZone.UnitTests.Deals;

public class DealLifecycleUnitTests
{
    [Fact]
    public void NewDeal_ShouldInitializeWithAwaitingConfirmationStatus()
    {
        var deal = new Deal
        {
            DealNumber = "DEAL-202610-123456",
            RfqId = Guid.NewGuid(),
            OfferId = Guid.NewGuid(),
            BuyerCompanyId = Guid.NewGuid(),
            SupplierCompanyId = Guid.NewGuid(),
            AgreedPrice = 50000m,
            Currency = "EGP"
        };

        Assert.Equal(DealStatus.AwaitingConfirmation, deal.Status);
        Assert.Null(deal.ConfirmedAtUtc);
        Assert.Null(deal.ConfirmedByBuyerAtUtc);
        Assert.Null(deal.ConfirmedBySupplierAtUtc);
        Assert.Null(deal.StartedAtUtc);
        Assert.Null(deal.CompletedAtUtc);
        Assert.Null(deal.CancelledAtUtc);
        Assert.Null(deal.PreviousStatus);
    }

    [Fact]
    public void DealCommercialTermsSnapshot_SerializesAndPreservesFrozenTerms()
    {
        var items = new List<DealItemSnapshot>
        {
            new(Guid.NewGuid(), "Steel Rebar Grade 60", 28000m, 10m, 280000m, "High tensile", "Test spec")
        };

        var snapshot = new DealCommercialTermsSnapshot(
            Guid.NewGuid(),
            1,
            "OFFER-202610-001",
            Guid.NewGuid(),
            "RFQ-202610-001",
            "Steel Supply Request",
            280000m,
            "EGP",
            5,
            true,
            "Net 30",
            "Shipping Included; Payment: Net 30; Lead Time: 5 days",
            DateTimeOffset.UtcNow.AddDays(5),
            DateTimeOffset.UtcNow.AddDays(14),
            "Non-negotiable terms",
            items);

        var json = JsonSerializer.Serialize(snapshot);
        Assert.NotEmpty(json);

        var deserialized = JsonSerializer.Deserialize<DealCommercialTermsSnapshot>(json);
        Assert.NotNull(deserialized);
        Assert.Equal(snapshot.TotalAmount, deserialized.TotalAmount);
        Assert.Equal(snapshot.OfferNumber, deserialized.OfferNumber);
        Assert.Single(deserialized.Items);
        Assert.Equal("Steel Rebar Grade 60", deserialized.Items[0].MaterialName);
        Assert.Equal(28000m, deserialized.Items[0].UnitPrice);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void CancelDealValidator_RequiresNonEmptyReason(string reason)
    {
        var validator = new CancelDealRequestValidator();
        var result = validator.Validate(new CancelDealRequest(reason));
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Reason");
    }

    [Fact]
    public void CancelDealValidator_RejectsOverlyLongReason()
    {
        var validator = new CancelDealRequestValidator();
        var longReason = new string('x', 501);
        var result = validator.Validate(new CancelDealRequest(longReason));
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Reason");
    }

    [Theory]
    [InlineData("")]
    [InlineData("short")]
    public void CreateDisputeValidator_RequiresMinimumDescription(string description)
    {
        var validator = new CreateDisputeRequestValidator();
        var result = validator.Validate(new CreateDisputeRequest(DisputeCategory.QualityDefect, description));
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Description");
    }

    [Fact]
    public void ResolveDisputeValidator_RequiresValidActionAndNotes()
    {
        var validator = new ResolveDisputeRequestValidator();
        var invalid = validator.Validate(new ResolveDisputeRequest((DisputeResolutionAction)999, ""));
        Assert.False(invalid.IsValid);
        Assert.Contains(invalid.Errors, e => e.PropertyName == "Action");
        Assert.Contains(invalid.Errors, e => e.PropertyName == "ResolutionNotes");

        var valid = validator.Validate(new ResolveDisputeRequest(DisputeResolutionAction.ResumeDeal, "Goods verified according to spec."));
        Assert.True(valid.IsValid);
    }
}

