using CustomValidationException = DealZone.Application.Common.Exceptions.ValidationException;
using FluentValidation;

namespace DealZone.Application.Common.Validation;

public static class ValidationExtensions
{
    public static async Task ValidateAndThrowDomainAsync<T>(
        this IValidator<T> validator,
        T instance,
        CancellationToken cancellationToken = default)
    {
        var result = await validator.ValidateAsync(instance, cancellationToken);
        if (!result.IsValid)
        {
            throw new CustomValidationException(result.Errors);
        }
    }
}
