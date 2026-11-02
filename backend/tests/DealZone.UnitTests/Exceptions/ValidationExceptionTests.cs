using DealZone.Application.Common.Exceptions;
using FluentValidation.Results;

namespace DealZone.UnitTests.Exceptions;

public class ValidationExceptionTests
{
    [Fact]
    public void DefaultConstructor_ShouldCreateEmptyErrorsDictionary()
    {
        var exception = new ValidationException();

        Assert.Equal("One or more validation failures have occurred.", exception.Message);
        Assert.NotNull(exception.Errors);
        Assert.Empty(exception.Errors);
    }

    [Fact]
    public void MessageConstructor_ShouldSetMessageAndEmptyErrors()
    {
        const string customMessage = "Custom validation message";
        var exception = new ValidationException(customMessage);

        Assert.Equal(customMessage, exception.Message);
        Assert.NotNull(exception.Errors);
        Assert.Empty(exception.Errors);
    }

    [Fact]
    public void PropertyAndErrorConstructor_ShouldPopulateSingleError()
    {
        var exception = new ValidationException("Email", "Email is required");

        Assert.True(exception.Errors.ContainsKey("Email"));
        Assert.Single(exception.Errors["Email"]);
        Assert.Equal("Email is required", exception.Errors["Email"][0]);
    }

    [Fact]
    public void FailuresConstructor_ShouldGroupFailuresByPropertyName()
    {
        var failures = new List<ValidationFailure>
        {
            new("Email", "Email is required"),
            new("Email", "Email must be a valid email address"),
            new("Password", "Password is required")
        };

        var exception = new ValidationException(failures);

        Assert.Equal(2, exception.Errors.Count);
        Assert.True(exception.Errors.ContainsKey("Email"));
        Assert.Equal(2, exception.Errors["Email"].Length);
        Assert.Contains("Email is required", exception.Errors["Email"]);
        Assert.Contains("Email must be a valid email address", exception.Errors["Email"]);

        Assert.True(exception.Errors.ContainsKey("Password"));
        Assert.Single(exception.Errors["Password"]);
        Assert.Equal("Password is required", exception.Errors["Password"][0]);
    }
}

