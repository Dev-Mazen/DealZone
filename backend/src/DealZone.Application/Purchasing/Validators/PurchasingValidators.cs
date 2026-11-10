using DealZone.Application.Purchasing.DTOs;
using FluentValidation;

namespace DealZone.Application.Purchasing.Validators;

public class CreateDirectPurchaseRequestValidator : AbstractValidator<CreateDirectPurchaseRequest>
{
    public CreateDirectPurchaseRequestValidator()
    {
        RuleFor(x => x.CatalogProductId)
            .NotEmpty()
            .WithMessage("Catalog product ID is required.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage("Purchase quantity must be greater than zero.");

        RuleFor(x => x.DeliveryAddress)
            .MaximumLength(500)
            .WithMessage("Delivery address must not exceed 500 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .WithMessage("Notes must not exceed 1000 characters.");
    }
}

