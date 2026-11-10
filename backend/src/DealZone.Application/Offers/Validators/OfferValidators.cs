using DealZone.Application.Offers.DTOs;
using FluentValidation;

namespace DealZone.Application.Offers.Validators;

public class CreateOfferItemRequestValidator : AbstractValidator<CreateOfferItemRequest>
{
    public CreateOfferItemRequestValidator()
    {
        RuleFor(x => x.RfqItemId)
            .NotEmpty().WithMessage("RFQ item ID is required.");

        RuleFor(x => x.UnitPrice)
            .GreaterThan(0).WithMessage("Unit price must be greater than zero.");

        RuleFor(x => x.OfferedQuantity)
            .GreaterThan(0).WithMessage("Offered quantity must be greater than zero.");

        RuleFor(x => x.MaterialSpecifications)
            .MaximumLength(1500).WithMessage("Material specifications must not exceed 1500 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes must not exceed 1000 characters.");
    }
}

public class CreateOfferRequestValidator : AbstractValidator<CreateOfferRequest>
{
    public CreateOfferRequestValidator()
    {
        RuleFor(x => x.DeliveryLeadTimeDays)
            .GreaterThan(0).WithMessage("Delivery lead time must be at least 1 day.");

        RuleFor(x => x.PaymentTerms)
            .NotEmpty().WithMessage("Payment terms are required.")
            .MaximumLength(250).WithMessage("Payment terms must not exceed 250 characters.");

        RuleFor(x => x.ValidityDateUtc)
            .GreaterThan(DateTimeOffset.UtcNow.AddMinutes(5))
            .WithMessage("Offer validity date must be in the future.");

        RuleFor(x => x.Currency)
            .MaximumLength(3).WithMessage("Currency code must not exceed 3 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes must not exceed 1000 characters.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one offer line item is required.");

        RuleForEach(x => x.Items).SetValidator(new CreateOfferItemRequestValidator());
    }
}

public class ReviseOfferRequestValidator : AbstractValidator<ReviseOfferRequest>
{
    public ReviseOfferRequestValidator()
    {
        RuleFor(x => x.DeliveryLeadTimeDays)
            .GreaterThan(0).WithMessage("Delivery lead time must be at least 1 day.");

        RuleFor(x => x.PaymentTerms)
            .NotEmpty().WithMessage("Payment terms are required.")
            .MaximumLength(250).WithMessage("Payment terms must not exceed 250 characters.");

        RuleFor(x => x.ValidityDateUtc)
            .GreaterThan(DateTimeOffset.UtcNow.AddMinutes(5))
            .WithMessage("Offer validity date must be in the future.");

        RuleFor(x => x.Currency)
            .MaximumLength(3).WithMessage("Currency code must not exceed 3 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes must not exceed 1000 characters.");

        RuleFor(x => x.ChangeSummary)
            .MaximumLength(1000).WithMessage("Change summary must not exceed 1000 characters.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one offer line item is required.");

        RuleForEach(x => x.Items).SetValidator(new CreateOfferItemRequestValidator());
    }
}

public class RejectOfferRequestValidator : AbstractValidator<RejectOfferRequest>
{
    public RejectOfferRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Rejection reason is required.")
            .MaximumLength(1000).WithMessage("Rejection reason must not exceed 1000 characters.");
    }
}

public class WithdrawOfferRequestValidator : AbstractValidator<WithdrawOfferRequest>
{
    public WithdrawOfferRequestValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(1000).WithMessage("Withdrawal reason must not exceed 1000 characters.");
    }
}

