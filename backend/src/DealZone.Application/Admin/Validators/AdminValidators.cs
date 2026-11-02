using DealZone.Application.Admin.DTOs;
using FluentValidation;

namespace DealZone.Application.Admin.Validators;

public class RejectCompanyRequestValidator : AbstractValidator<RejectCompanyRequest>
{
    public RejectCompanyRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("A rejection reason is required.")
            .MaximumLength(1000).WithMessage("Reason must not exceed 1000 characters.");
    }
}

public class RequestChangesRequestValidator : AbstractValidator<RequestChangesRequest>
{
    public RequestChangesRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("A reason for requesting changes is required.")
            .MaximumLength(1000).WithMessage("Reason must not exceed 1000 characters.");
    }
}

