using DealZone.Application.Companies.DTOs;
using FluentValidation;

namespace DealZone.Application.Companies.Validators;

public class CreateCompanyRequestValidator : AbstractValidator<CreateCompanyRequest>
{
    public CreateCompanyRequestValidator()
    {
        RuleFor(x => x.LegalName)
            .NotEmpty().WithMessage("Company legal name is required.")
            .MaximumLength(200).WithMessage("Legal name cannot exceed 200 characters.");

        RuleFor(x => x.TradeName)
            .NotEmpty().WithMessage("Company trade name is required.")
            .MaximumLength(200).WithMessage("Trade name cannot exceed 200 characters.");

        RuleFor(x => x.IndustrySector)
            .NotEmpty().WithMessage("Industry sector is required.")
            .MaximumLength(100).WithMessage("Industry sector cannot exceed 100 characters.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(100).WithMessage("City cannot exceed 100 characters.");

        RuleFor(x => x.Governorate)
            .NotEmpty().WithMessage("Governorate is required.")
            .MaximumLength(100).WithMessage("Governorate cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Website)
            .MaximumLength(255).WithMessage("Website URL cannot exceed 255 characters.")
            .When(x => !string.IsNullOrEmpty(x.Website));

        RuleFor(x => x.TaxIdNumber)
            .NotEmpty().WithMessage("Tax ID number is required.")
            .MaximumLength(50).WithMessage("Tax ID cannot exceed 50 characters.");

        RuleFor(x => x.CommercialRegistrationNumber)
            .NotEmpty().WithMessage("Commercial registration number is required.")
            .MaximumLength(50).WithMessage("Commercial registration number cannot exceed 50 characters.");

        RuleFor(x => x.CorporateEmail)
            .NotEmpty().WithMessage("Corporate email is required.")
            .EmailAddress().WithMessage("A valid corporate email address is required.")
            .MaximumLength(256).WithMessage("Corporate email cannot exceed 256 characters.");

        RuleFor(x => x.CorporatePhone)
            .NotEmpty().WithMessage("Corporate phone number is required.")
            .MaximumLength(30).WithMessage("Corporate phone number cannot exceed 30 characters.");

        RuleFor(x => x.AddressLine1)
            .NotEmpty().WithMessage("Address line 1 is required.")
            .MaximumLength(200).WithMessage("Address line 1 cannot exceed 200 characters.");

        RuleFor(x => x.AddressLine2)
            .MaximumLength(200).WithMessage("Address line 2 cannot exceed 200 characters.")
            .When(x => !string.IsNullOrEmpty(x.AddressLine2));

        RuleFor(x => x.PostalCode)
            .MaximumLength(20).WithMessage("Postal code cannot exceed 20 characters.")
            .When(x => !string.IsNullOrEmpty(x.PostalCode));
    }
}

public class UpdateCompanyProfileRequestValidator : AbstractValidator<UpdateCompanyProfileRequest>
{
    public UpdateCompanyProfileRequestValidator()
    {
        RuleFor(x => x.TradeName)
            .NotEmpty().WithMessage("Trade name is required.")
            .MaximumLength(200).WithMessage("Trade name cannot exceed 200 characters.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(100).WithMessage("City cannot exceed 100 characters.");

        RuleFor(x => x.Governorate)
            .NotEmpty().WithMessage("Governorate is required.")
            .MaximumLength(100).WithMessage("Governorate cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Website)
            .MaximumLength(255).WithMessage("Website URL cannot exceed 255 characters.")
            .When(x => !string.IsNullOrEmpty(x.Website));
    }
}

public class AddCompanyMemberRequestValidator : AbstractValidator<AddCompanyMemberRequest>
{
    public AddCompanyMemberRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Member email address is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(256).WithMessage("Email cannot exceed 256 characters.");

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("A valid company role is required.");
    }
}

public class UpdateCompanyMemberRoleRequestValidator : AbstractValidator<UpdateCompanyMemberRoleRequest>
{
    public UpdateCompanyMemberRoleRequestValidator()
    {
        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("A valid company role is required.");
    }
}


