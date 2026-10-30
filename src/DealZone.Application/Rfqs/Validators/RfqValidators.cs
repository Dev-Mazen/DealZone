using DealZone.Application.Rfqs.DTOs;
using FluentValidation;

namespace DealZone.Application.Rfqs.Validators;

public class CreateRfqItemRequestValidator : AbstractValidator<CreateRfqItemRequest>
{
    public CreateRfqItemRequestValidator()
    {
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category ID is required for each line item.");

        RuleFor(x => x.MaterialName)
            .NotEmpty().WithMessage("Material name is required.")
            .MaximumLength(200).WithMessage("Material name must not exceed 200 characters.");

        RuleFor(x => x.Specifications)
            .NotEmpty().WithMessage("Technical specifications are required.")
            .MaximumLength(1500).WithMessage("Specifications must not exceed 1500 characters.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");

        RuleFor(x => x.TargetPricePerUnit)
            .GreaterThan(0).When(x => x.TargetPricePerUnit.HasValue)
            .WithMessage("Target price per unit must be greater than zero.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Item notes must not exceed 1000 characters.");
    }
}

public class CreateRfqRequestValidator : AbstractValidator<CreateRfqRequest>
{
    public CreateRfqRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("RFQ title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.DeliveryGovernorate)
            .NotEmpty().WithMessage("Delivery governorate is required.")
            .MaximumLength(100).WithMessage("Governorate must not exceed 100 characters.");

        RuleFor(x => x.DeliveryCity)
            .NotEmpty().WithMessage("Delivery city is required.")
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.");

        RuleFor(x => x.DeliveryAddress)
            .NotEmpty().WithMessage("Delivery address is required.")
            .MaximumLength(300).WithMessage("Address must not exceed 300 characters.");

        RuleFor(x => x.ClosingDateUtc)
            .GreaterThan(DateTimeOffset.UtcNow.AddMinutes(5))
            .WithMessage("Closing date must be in the future.");

        RuleFor(x => x.RequiredDeliveryDateUtc)
            .GreaterThanOrEqualTo(x => x.ClosingDateUtc)
            .When(x => x.RequiredDeliveryDateUtc.HasValue)
            .WithMessage("Required delivery date must be on or after the closing date.");

        RuleFor(x => x.TargetBudget)
            .GreaterThan(0).When(x => x.TargetBudget.HasValue)
            .WithMessage("Target budget must be greater than zero.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notes must not exceed 2000 characters.");

        RuleFor(x => x.Items)
            .NotEmpty().When(x => x.PublishImmediately)
            .WithMessage("At least one RFQ item is required when publishing an RFQ.");

        RuleForEach(x => x.Items).SetValidator(new CreateRfqItemRequestValidator());
    }
}

public class UpdateRfqItemRequestValidator : AbstractValidator<UpdateRfqItemRequest>
{
    public UpdateRfqItemRequestValidator()
    {
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category ID is required for each line item.");

        RuleFor(x => x.MaterialName)
            .NotEmpty().WithMessage("Material name is required.")
            .MaximumLength(200).WithMessage("Material name must not exceed 200 characters.");

        RuleFor(x => x.Specifications)
            .NotEmpty().WithMessage("Technical specifications are required.")
            .MaximumLength(1500).WithMessage("Specifications must not exceed 1500 characters.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");

        RuleFor(x => x.TargetPricePerUnit)
            .GreaterThan(0).When(x => x.TargetPricePerUnit.HasValue)
            .WithMessage("Target price per unit must be greater than zero.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Item notes must not exceed 1000 characters.");
    }
}

public class UpdateRfqRequestValidator : AbstractValidator<UpdateRfqRequest>
{
    public UpdateRfqRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("RFQ title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.DeliveryGovernorate)
            .NotEmpty().WithMessage("Delivery governorate is required.")
            .MaximumLength(100).WithMessage("Governorate must not exceed 100 characters.");

        RuleFor(x => x.DeliveryCity)
            .NotEmpty().WithMessage("Delivery city is required.")
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.");

        RuleFor(x => x.DeliveryAddress)
            .NotEmpty().WithMessage("Delivery address is required.")
            .MaximumLength(300).WithMessage("Address must not exceed 300 characters.");

        RuleFor(x => x.ClosingDateUtc)
            .GreaterThan(DateTimeOffset.UtcNow)
            .WithMessage("Closing date must be in the future.");

        RuleFor(x => x.RequiredDeliveryDateUtc)
            .GreaterThanOrEqualTo(x => x.ClosingDateUtc)
            .When(x => x.RequiredDeliveryDateUtc.HasValue)
            .WithMessage("Required delivery date must be on or after the closing date.");

        RuleFor(x => x.TargetBudget)
            .GreaterThan(0).When(x => x.TargetBudget.HasValue)
            .WithMessage("Target budget must be greater than zero.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notes must not exceed 2000 characters.");

        RuleForEach(x => x.Items).SetValidator(new UpdateRfqItemRequestValidator())
            .When(x => x.Items != null);
    }
}

