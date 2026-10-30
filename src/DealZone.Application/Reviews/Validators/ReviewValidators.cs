using DealZone.Application.Reviews.DTOs;
using FluentValidation;

namespace DealZone.Application.Reviews.Validators;

public class CreateReviewRequestValidator : AbstractValidator<CreateReviewRequest>
{
    public CreateReviewRequestValidator()
    {
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Review rating must be between 1 and 5.");

        RuleFor(x => x.Comment)
            .MaximumLength(1000).WithMessage("Review comment cannot exceed 1000 characters.");
    }
}

