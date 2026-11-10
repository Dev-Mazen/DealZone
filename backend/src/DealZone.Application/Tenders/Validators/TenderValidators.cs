using DealZone.Application.Tenders.DTOs;
using FluentValidation;

namespace DealZone.Application.Tenders.Validators;

public class CreateTenderItemRequestValidator : AbstractValidator<CreateTenderItemRequest>
{
    public CreateTenderItemRequestValidator()
    {
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required.");

        RuleFor(x => x.MaterialName)
            .NotEmpty().WithMessage("Material name is required.")
            .MaximumLength(200).WithMessage("Material name must not exceed 200 characters.");

        RuleFor(x => x.Specifications)
            .NotEmpty().WithMessage("Specifications are required.")
            .MaximumLength(1000).WithMessage("Specifications must not exceed 1000 characters.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");

        RuleFor(x => x.Unit)
            .IsInEnum().WithMessage("A valid unit of measure is required.");

        RuleFor(x => x.TargetPricePerUnit)
            .GreaterThan(0).When(x => x.TargetPricePerUnit.HasValue)
            .WithMessage("Target price per unit must be greater than zero.");
    }
}

public class CreateTenderRequestValidator : AbstractValidator<CreateTenderRequest>
{
    public CreateTenderRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tender title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.DeliveryGovernorate)
            .NotEmpty().WithMessage("Delivery governorate is required.")
            .MaximumLength(100).WithMessage("Delivery governorate must not exceed 100 characters.");

        RuleFor(x => x.DeliveryCity)
            .NotEmpty().WithMessage("Delivery city is required.")
            .MaximumLength(100).WithMessage("Delivery city must not exceed 100 characters.");

        RuleFor(x => x.DeliveryAddress)
            .NotEmpty().WithMessage("Delivery address is required.")
            .MaximumLength(300).WithMessage("Delivery address must not exceed 300 characters.");

        RuleFor(x => x.ClosingDateUtc)
            .GreaterThan(DateTimeOffset.UtcNow)
            .WithMessage("Closing date must be in the future.");

        RuleFor(x => x.ReferencePrice)
            .GreaterThan(0).When(x => x.ReferencePrice.HasValue)
            .WithMessage("Reference price must be greater than zero.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("A tender must contain at least one item.");

        RuleForEach(x => x.Items).SetValidator(new CreateTenderItemRequestValidator());
    }
}

public class UpdateTenderRequestValidator : AbstractValidator<UpdateTenderRequest>
{
    public UpdateTenderRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tender title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.DeliveryGovernorate)
            .NotEmpty().WithMessage("Delivery governorate is required.")
            .MaximumLength(100).WithMessage("Delivery governorate must not exceed 100 characters.");

        RuleFor(x => x.DeliveryCity)
            .NotEmpty().WithMessage("Delivery city is required.")
            .MaximumLength(100).WithMessage("Delivery city must not exceed 100 characters.");

        RuleFor(x => x.DeliveryAddress)
            .NotEmpty().WithMessage("Delivery address is required.")
            .MaximumLength(300).WithMessage("Delivery address must not exceed 300 characters.");

        RuleFor(x => x.ClosingDateUtc)
            .GreaterThan(DateTimeOffset.UtcNow)
            .WithMessage("Closing date must be in the future.");

        RuleFor(x => x.ReferencePrice)
            .GreaterThan(0).When(x => x.ReferencePrice.HasValue)
            .WithMessage("Reference price must be greater than zero.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("A tender must contain at least one item.");

        RuleForEach(x => x.Items).SetValidator(new CreateTenderItemRequestValidator());
    }
}

public class ReopenTenderRequestValidator : AbstractValidator<ReopenTenderRequest>
{
    public ReopenTenderRequestValidator()
    {
        RuleFor(x => x.NewClosingDateUtc)
            .GreaterThan(DateTimeOffset.UtcNow)
            .WithMessage("New closing date must be in the future.");
    }
}

public class CancelTenderRequestValidator : AbstractValidator<CancelTenderRequest>
{
    public CancelTenderRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Cancellation reason is required.")
            .MinimumLength(5).WithMessage("Cancellation reason must be at least 5 characters.")
            .MaximumLength(500).WithMessage("Cancellation reason must not exceed 500 characters.");
    }
}

public class NoAwardTenderRequestValidator : AbstractValidator<NoAwardTenderRequest>
{
    public NoAwardTenderRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("No-award rationale is required.")
            .MinimumLength(5).WithMessage("No-award rationale must be at least 5 characters.")
            .MaximumLength(500).WithMessage("No-award rationale must not exceed 500 characters.");
    }
}

public class AwardTenderRequestValidator : AbstractValidator<AwardTenderRequest>
{
    public AwardTenderRequestValidator()
    {
        RuleFor(x => x.BidId)
            .NotEmpty().WithMessage("Bid ID is required to award a tender.");
    }
}

public class SubmitBidItemRequestValidator : AbstractValidator<SubmitBidItemRequest>
{
    public SubmitBidItemRequestValidator()
    {
        RuleFor(x => x.TenderItemId)
            .NotEmpty().WithMessage("Tender item ID is required.");

        RuleFor(x => x.UnitPrice)
            .GreaterThan(0).WithMessage("Unit price must be strictly greater than zero.");
    }
}

public class SubmitBidRequestValidator : AbstractValidator<SubmitBidRequest>
{
    public SubmitBidRequestValidator()
    {
        RuleFor(x => x.ValidityDateUtc)
            .GreaterThan(DateTimeOffset.UtcNow)
            .WithMessage("Validity date must be in the future.");

        RuleFor(x => x.DeliveryLeadTimeDays)
            .GreaterThan(0).WithMessage("Delivery lead time days must be greater than zero.");

        RuleFor(x => x.PaymentTerms)
            .NotEmpty().WithMessage("Payment terms are required.")
            .MaximumLength(200).WithMessage("Payment terms must not exceed 200 characters.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Bid must price all items in the tender.");

        RuleForEach(x => x.Items).SetValidator(new SubmitBidItemRequestValidator());
    }
}

public class ReviseBidRequestValidator : AbstractValidator<ReviseBidRequest>
{
    public ReviseBidRequestValidator()
    {
        RuleFor(x => x.ValidityDateUtc)
            .GreaterThan(DateTimeOffset.UtcNow)
            .WithMessage("Validity date must be in the future.");

        RuleFor(x => x.DeliveryLeadTimeDays)
            .GreaterThan(0).WithMessage("Delivery lead time days must be greater than zero.");

        RuleFor(x => x.PaymentTerms)
            .NotEmpty().WithMessage("Payment terms are required.")
            .MaximumLength(200).WithMessage("Payment terms must not exceed 200 characters.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Revised bid must price all items in the tender.");

        RuleForEach(x => x.Items).SetValidator(new SubmitBidItemRequestValidator());
    }
}

public class WithdrawBidRequestValidator : AbstractValidator<WithdrawBidRequest>
{
    public WithdrawBidRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Withdrawal reason is required.")
            .MinimumLength(5).WithMessage("Withdrawal reason must be at least 5 characters.")
            .MaximumLength(500).WithMessage("Withdrawal reason must not exceed 500 characters.");
    }
}
