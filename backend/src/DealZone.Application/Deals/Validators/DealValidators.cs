using DealZone.Application.Deals.DTOs;
using FluentValidation;

namespace DealZone.Application.Deals.Validators;

public class CancelDealRequestValidator : AbstractValidator<CancelDealRequest>
{
    public CancelDealRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Cancellation reason is required.")
            .MaximumLength(500).WithMessage("Cancellation reason cannot exceed 500 characters.");
    }
}

public class CreateDisputeRequestValidator : AbstractValidator<CreateDisputeRequest>
{
    public CreateDisputeRequestValidator()
    {
        RuleFor(x => x.Category)
            .IsInEnum().WithMessage("A valid dispute category is required.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Dispute description is required.")
            .MinimumLength(10).WithMessage("Dispute description must be at least 10 characters.")
            .MaximumLength(2000).WithMessage("Dispute description cannot exceed 2000 characters.");
    }
}

public class ResolveDisputeRequestValidator : AbstractValidator<ResolveDisputeRequest>
{
    public ResolveDisputeRequestValidator()
    {
        RuleFor(x => x.Action)
            .IsInEnum().WithMessage("A valid dispute resolution action (ResumeDeal or CancelDeal) is required.");

        RuleFor(x => x.ResolutionNotes)
            .NotEmpty().WithMessage("Resolution notes are required.")
            .MinimumLength(5).WithMessage("Resolution notes must be at least 5 characters.")
            .MaximumLength(2000).WithMessage("Resolution notes cannot exceed 2000 characters.");
    }
}

