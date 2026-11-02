using DealZone.Application.Shipping.DTOs;
using FluentValidation;

namespace DealZone.Application.Shipping.Validators;

public class CreateShipmentRequestValidator : AbstractValidator<CreateShipmentRequest>
{
    public CreateShipmentRequestValidator()
    {
        RuleFor(x => x.Arrangement)
            .IsInEnum().WithMessage("A valid shipping arrangement is required.");

        RuleFor(x => x.PickupAddress)
            .NotEmpty().WithMessage("Pickup address is required.")
            .MaximumLength(300).WithMessage("Pickup address cannot exceed 300 characters.");

        RuleFor(x => x.DeliveryAddress)
            .NotEmpty().WithMessage("Delivery address is required.")
            .MaximumLength(300).WithMessage("Delivery address cannot exceed 300 characters.");

        RuleFor(x => x.CarrierName)
            .MaximumLength(150).WithMessage("Carrier name cannot exceed 150 characters.");

        RuleFor(x => x.TrackingNumber)
            .MaximumLength(100).WithMessage("Tracking number cannot exceed 100 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters.");
    }
}

public class UpdateTrackingRequestValidator : AbstractValidator<UpdateTrackingRequest>
{
    public UpdateTrackingRequestValidator()
    {
        RuleFor(x => x.TrackingNumber)
            .MaximumLength(100).WithMessage("Tracking number cannot exceed 100 characters.");

        RuleFor(x => x.CarrierName)
            .MaximumLength(150).WithMessage("Carrier name cannot exceed 150 characters.");
    }
}

public class UpdateShipmentStatusRequestValidator : AbstractValidator<UpdateShipmentStatusRequest>
{
    public UpdateShipmentStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("A valid shipment status is required.");
    }
}

public class AssignShippingProviderRequestValidator : AbstractValidator<AssignShippingProviderRequest>
{
    public AssignShippingProviderRequestValidator()
    {
        RuleFor(x => x.ShippingProviderId)
            .NotEmpty().WithMessage("A valid shipping provider ID is required.");

        RuleFor(x => x.TrackingNumber)
            .MaximumLength(100).WithMessage("Tracking number cannot exceed 100 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters.");
    }
}

public class CreateShippingProviderRequestValidator : AbstractValidator<CreateShippingProviderRequest>
{
    public CreateShippingProviderRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Shipping provider name is required.")
            .MaximumLength(150).WithMessage("Shipping provider name cannot exceed 150 characters.");

        RuleFor(x => x.ContactPerson)
            .NotEmpty().WithMessage("Contact person name is required.")
            .MaximumLength(100).WithMessage("Contact person cannot exceed 100 characters.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.")
            .MaximumLength(30).WithMessage("Phone number cannot exceed 30 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(256).WithMessage("Email cannot exceed 256 characters.");

        RuleFor(x => x.SupportedGovernorates)
            .MaximumLength(500).WithMessage("Supported governorates cannot exceed 500 characters.");
    }
}

public class UpdateShippingProviderRequestValidator : AbstractValidator<UpdateShippingProviderRequest>
{
    public UpdateShippingProviderRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Shipping provider name is required.")
            .MaximumLength(150).WithMessage("Shipping provider name cannot exceed 150 characters.");

        RuleFor(x => x.ContactPerson)
            .NotEmpty().WithMessage("Contact person name is required.")
            .MaximumLength(100).WithMessage("Contact person cannot exceed 100 characters.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.")
            .MaximumLength(30).WithMessage("Phone number cannot exceed 30 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(256).WithMessage("Email cannot exceed 256 characters.");

        RuleFor(x => x.SupportedGovernorates)
            .MaximumLength(500).WithMessage("Supported governorates cannot exceed 500 characters.");
    }
}

