using DealZone.Application.Catalog.DTOs;
using FluentValidation;

namespace DealZone.Application.Catalog.Validators;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Category code is required.")
            .MaximumLength(50).WithMessage("Category code must not exceed 50 characters.");

        RuleFor(x => x.NameAr)
            .NotEmpty().WithMessage("Arabic category name is required.")
            .MaximumLength(150).WithMessage("Arabic category name must not exceed 150 characters.");

        RuleFor(x => x.NameEn)
            .NotEmpty().WithMessage("English category name is required.")
            .MaximumLength(150).WithMessage("English category name must not exceed 150 characters.");

        RuleFor(x => x.DescriptionAr)
            .MaximumLength(500).WithMessage("Arabic description must not exceed 500 characters.");

        RuleFor(x => x.DescriptionEn)
            .MaximumLength(500).WithMessage("English description must not exceed 500 characters.");
    }
}

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Category code is required.")
            .MaximumLength(50).WithMessage("Category code must not exceed 50 characters.");

        RuleFor(x => x.NameAr)
            .NotEmpty().WithMessage("Arabic category name is required.")
            .MaximumLength(150).WithMessage("Arabic category name must not exceed 150 characters.");

        RuleFor(x => x.NameEn)
            .NotEmpty().WithMessage("English category name is required.")
            .MaximumLength(150).WithMessage("English category name must not exceed 150 characters.");

        RuleFor(x => x.DescriptionAr)
            .MaximumLength(500).WithMessage("Arabic description must not exceed 500 characters.");

        RuleFor(x => x.DescriptionEn)
            .MaximumLength(500).WithMessage("English description must not exceed 500 characters.");
    }
}

public class CreateUnitRequestValidator : AbstractValidator<CreateUnitRequest>
{
    public CreateUnitRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Unit code is required.")
            .MaximumLength(20).WithMessage("Unit code must not exceed 20 characters.");

        RuleFor(x => x.NameAr)
            .NotEmpty().WithMessage("Arabic unit name is required.")
            .MaximumLength(100).WithMessage("Arabic unit name must not exceed 100 characters.");

        RuleFor(x => x.NameEn)
            .NotEmpty().WithMessage("English unit name is required.")
            .MaximumLength(100).WithMessage("English unit name must not exceed 100 characters.");

        RuleFor(x => x.SymbolAr)
            .NotEmpty().WithMessage("Arabic symbol is required.")
            .MaximumLength(20).WithMessage("Arabic symbol must not exceed 20 characters.");

        RuleFor(x => x.SymbolEn)
            .NotEmpty().WithMessage("English symbol is required.")
            .MaximumLength(20).WithMessage("English symbol must not exceed 20 characters.");
    }
}

public class UpdateUnitRequestValidator : AbstractValidator<UpdateUnitRequest>
{
    public UpdateUnitRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Unit code is required.")
            .MaximumLength(20).WithMessage("Unit code must not exceed 20 characters.");

        RuleFor(x => x.NameAr)
            .NotEmpty().WithMessage("Arabic unit name is required.")
            .MaximumLength(100).WithMessage("Arabic unit name must not exceed 100 characters.");

        RuleFor(x => x.NameEn)
            .NotEmpty().WithMessage("English unit name is required.")
            .MaximumLength(100).WithMessage("English unit name must not exceed 100 characters.");

        RuleFor(x => x.SymbolAr)
            .NotEmpty().WithMessage("Arabic symbol is required.")
            .MaximumLength(20).WithMessage("Arabic symbol must not exceed 20 characters.");

        RuleFor(x => x.SymbolEn)
            .NotEmpty().WithMessage("English symbol is required.")
            .MaximumLength(20).WithMessage("English symbol must not exceed 20 characters.");
    }
}

public class CreateMaterialRequestValidator : AbstractValidator<CreateMaterialRequest>
{
    public CreateMaterialRequestValidator()
    {
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category ID is required.");

        RuleFor(x => x.DefaultUnitId)
            .NotEmpty().WithMessage("Default unit ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Material code is required.")
            .MaximumLength(50).WithMessage("Material code must not exceed 50 characters.");

        RuleFor(x => x.NameAr)
            .NotEmpty().WithMessage("Arabic material name is required.")
            .MaximumLength(200).WithMessage("Arabic material name must not exceed 200 characters.");

        RuleFor(x => x.NameEn)
            .NotEmpty().WithMessage("English material name is required.")
            .MaximumLength(200).WithMessage("English material name must not exceed 200 characters.");

        RuleFor(x => x.DescriptionAr)
            .MaximumLength(1000).WithMessage("Arabic description must not exceed 1000 characters.");

        RuleFor(x => x.DescriptionEn)
            .MaximumLength(1000).WithMessage("English description must not exceed 1000 characters.");

        RuleFor(x => x.AttributesJson)
            .MaximumLength(4000).WithMessage("Attributes JSON must not exceed 4000 characters.");
    }
}

public class UpdateMaterialRequestValidator : AbstractValidator<UpdateMaterialRequest>
{
    public UpdateMaterialRequestValidator()
    {
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category ID is required.");

        RuleFor(x => x.DefaultUnitId)
            .NotEmpty().WithMessage("Default unit ID is required.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Material code is required.")
            .MaximumLength(50).WithMessage("Material code must not exceed 50 characters.");

        RuleFor(x => x.NameAr)
            .NotEmpty().WithMessage("Arabic material name is required.")
            .MaximumLength(200).WithMessage("Arabic material name must not exceed 200 characters.");

        RuleFor(x => x.NameEn)
            .NotEmpty().WithMessage("English material name is required.")
            .MaximumLength(200).WithMessage("English material name must not exceed 200 characters.");

        RuleFor(x => x.DescriptionAr)
            .MaximumLength(1000).WithMessage("Arabic description must not exceed 1000 characters.");

        RuleFor(x => x.DescriptionEn)
            .MaximumLength(1000).WithMessage("English description must not exceed 1000 characters.");

        RuleFor(x => x.AttributesJson)
            .MaximumLength(4000).WithMessage("Attributes JSON must not exceed 4000 characters.");
    }
}

