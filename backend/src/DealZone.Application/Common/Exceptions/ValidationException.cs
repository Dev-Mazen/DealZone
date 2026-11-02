using FluentValidation.Results;

namespace DealZone.Application.Common.Exceptions;

public class ValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException()
        : base("One or more validation failures have occurred.")
    {
        Errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
    }

    public ValidationException(string message)
        : base(message)
    {
        Errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
    }

    public ValidationException(IEnumerable<ValidationFailure> failures)
        : this()
    {
        Errors = failures
            .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
            .ToDictionary(
                failureGroup => failureGroup.Key,
                failureGroup => failureGroup.ToArray(),
                StringComparer.OrdinalIgnoreCase);
    }

    public ValidationException(string propertyName, string errorMessage)
        : this()
    {
        Errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            { propertyName, [errorMessage] }
        };
    }
}

