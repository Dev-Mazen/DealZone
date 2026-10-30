using DealZone.Application.Admin.DTOs;
using DealZone.Application.Admin.Validators;

namespace DealZone.UnitTests.Admin;

public class AdminValidatorTests
{
    private readonly RejectCompanyRequestValidator _rejectValidator = new();
    private readonly RequestChangesRequestValidator _requestChangesValidator = new();

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void RejectCompanyRequest_WithEmptyReason_ShouldFailValidation(string? reason)
    {
        var request = new RejectCompanyRequest(reason!);
        var result = _rejectValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RejectCompanyRequest.Reason));
    }

    [Fact]
    public void RejectCompanyRequest_WithValidReason_ShouldPass()
    {
        var request = new RejectCompanyRequest("Commercial register document appears illegible.");
        var result = _rejectValidator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void RejectCompanyRequest_WithExcessiveReasonLength_ShouldFailValidation()
    {
        var request = new RejectCompanyRequest(new string('a', 1001));
        var result = _rejectValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RejectCompanyRequest.Reason));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void RequestChangesRequest_WithEmptyReason_ShouldFailValidation(string? reason)
    {
        var request = new RequestChangesRequest(reason!);
        var result = _requestChangesValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RequestChangesRequest.Reason));
    }

    [Fact]
    public void RequestChangesRequest_WithValidReason_ShouldPass()
    {
        var request = new RequestChangesRequest("Please provide an updated tax card with current expiration date.");
        var result = _requestChangesValidator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void RequestChangesRequest_WithExcessiveReasonLength_ShouldFailValidation()
    {
        var request = new RequestChangesRequest(new string('b', 1001));
        var result = _requestChangesValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RequestChangesRequest.Reason));
    }
}

