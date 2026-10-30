using DealZone.Application.Shipping.DTOs;
using DealZone.Application.Shipping.Validators;
using DealZone.Domain.Shipping;
using Xunit;

namespace DealZone.UnitTests.Shipping;

public class ShippingUnitTests
{
    [Fact]
    public void CreateShipmentValidator_RequiresAddresses()
    {
        var validator = new CreateShipmentRequestValidator();

        var invalid = validator.Validate(new CreateShipmentRequest(
            ShippingArrangement.SupplierArranged,
            "",
            ""));

        Assert.False(invalid.IsValid);
        Assert.Contains(invalid.Errors, e => e.PropertyName == "PickupAddress");
        Assert.Contains(invalid.Errors, e => e.PropertyName == "DeliveryAddress");

        var valid = validator.Validate(new CreateShipmentRequest(
            ShippingArrangement.SupplierArranged,
            "10th of Ramadan Zone 3",
            "Helwan Iron Works"));

        Assert.True(valid.IsValid);
    }

    [Fact]
    public void CreateShippingProviderValidator_RequiresNameContactAndValidEmail()
    {
        var validator = new CreateShippingProviderRequestValidator();

        var invalid = validator.Validate(new CreateShippingProviderRequest(
            "",
            "",
            "",
            "not-an-email"));

        Assert.False(invalid.IsValid);
        Assert.Contains(invalid.Errors, e => e.PropertyName == "Name");
        Assert.Contains(invalid.Errors, e => e.PropertyName == "Email");

        var valid = validator.Validate(new CreateShippingProviderRequest(
            "Egypt Express Cargo",
            "Ahmed Mostafa",
            "+201012345678",
            "info@egyptexpress.eg",
            "Cairo, Sharqia, Giza"));

        Assert.True(valid.IsValid);
    }

    [Fact]
    public void NewShipment_InitializesWithPendingStatus()
    {
        var shipment = new Shipment
        {
            ShipmentNumber = "SHIP-202610-000001",
            DealId = Guid.NewGuid(),
            Arrangement = ShippingArrangement.DealZoneArranged,
            PickupAddress = "Origin",
            DeliveryAddress = "Destination"
        };

        Assert.Equal(ShipmentStatus.Pending, shipment.Status);
        Assert.Null(shipment.ShippingProviderId);
        Assert.Null(shipment.PickupDateUtc);
        Assert.Null(shipment.ActualDeliveryDateUtc);
        Assert.Equal("[]", shipment.TrackingEventsJson);
    }
}

