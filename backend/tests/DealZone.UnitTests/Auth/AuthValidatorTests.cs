using DealZone.Application.Auth.DTOs;
using DealZone.Application.Auth.Validators;

namespace DealZone.UnitTests.Auth;

public class AuthValidatorTests
{
    private readonly RegisterRequestValidator _registerValidator = new();
    private readonly LoginRequestValidator _loginValidator = new();
    private readonly ConfirmEmailRequestValidator _confirmEmailValidator = new();
    private readonly ResetPasswordRequestValidator _resetPasswordValidator = new();
    private readonly UpdateProfileRequestValidator _updateProfileValidator = new();

    [Fact]
    public async Task RegisterRequestValidator_ValidRequest_ShouldPass()
    {
        var request = new RegisterRequest(
            Email: "buyer@dealzone.eg",
            Password: "SecurePassword123!",
            FullName: "Ahmed Mansour",
            PhoneNumber: "+201001234567");

        var result = await _registerValidator.ValidateAsync(request);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("", "Email address is required.")]
    [InlineData("not-an-email", "A valid email address is required.")]
    public async Task RegisterRequestValidator_InvalidEmail_ShouldFail(string email, string expectedMessage)
    {
        var request = new RegisterRequest(
            Email: email,
            Password: "SecurePassword123!",
            FullName: "Ahmed Mansour");

        var result = await _registerValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains(expectedMessage));
    }

    [Theory]
    [InlineData("short1!", "Password must be at least 8 characters.")]
    [InlineData("alllowercase1!", "Password must contain at least one uppercase letter.")]
    [InlineData("ALLUPPERCASE1!", "Password must contain at least one lowercase letter.")]
    [InlineData("NoDigitsHere!", "Password must contain at least one digit.")]
    [InlineData("NoSpecialChar123", "Password must contain at least one special character.")]
    public async Task RegisterRequestValidator_WeakPassword_ShouldFail(string password, string expectedMessage)
    {
        var request = new RegisterRequest(
            Email: "buyer@dealzone.eg",
            Password: password,
            FullName: "Ahmed Mansour");

        var result = await _registerValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains(expectedMessage));
    }

    [Fact]
    public async Task RegisterRequestValidator_EmptyFullName_ShouldFail()
    {
        var request = new RegisterRequest(
            Email: "buyer@dealzone.eg",
            Password: "SecurePassword123!",
            FullName: "");

        var result = await _registerValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.FullName));
    }

    [Fact]
    public async Task LoginRequestValidator_EmptyCredentials_ShouldFail()
    {
        var request = new LoginRequest("", "");

        var result = await _loginValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(LoginRequest.Email));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(LoginRequest.Password));
    }

    [Fact]
    public async Task ConfirmEmailRequestValidator_MissingFields_ShouldFail()
    {
        var request = new ConfirmEmailRequest("", "");

        var result = await _confirmEmailValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(ConfirmEmailRequest.Email));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(ConfirmEmailRequest.Token));
    }

    [Fact]
    public async Task ResetPasswordRequestValidator_WeakPassword_ShouldFail()
    {
        var request = new ResetPasswordRequest("buyer@dealzone.eg", "valid-token", "weak");

        var result = await _resetPasswordValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(ResetPasswordRequest.NewPassword));
    }

    // ─── UpdateProfileRequestValidator ────────────────────────────────────────

    [Fact]
    public async Task UpdateProfileRequestValidator_ValidRequest_ShouldPass()
    {
        var request = new UpdateProfileRequest("Ahmed Mansour", "+201001234567");

        var result = await _updateProfileValidator.ValidateAsync(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task UpdateProfileRequestValidator_NullPhone_ShouldPass()
    {
        var request = new UpdateProfileRequest("Ahmed Mansour", null);

        var result = await _updateProfileValidator.ValidateAsync(request);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task UpdateProfileRequestValidator_InvalidFullName_ShouldFail(string fullName)
    {
        var request = new UpdateProfileRequest(fullName, null);

        var result = await _updateProfileValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateProfileRequest.FullName));
    }

    [Fact]
    public async Task UpdateProfileRequestValidator_TooLongFullName_ShouldFail()
    {
        var request = new UpdateProfileRequest(new string('A', 151), null);

        var result = await _updateProfileValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateProfileRequest.FullName));
    }

    [Fact]
    public async Task UpdateProfileRequestValidator_TooLongPhoneNumber_ShouldFail()
    {
        var request = new UpdateProfileRequest("Ahmed Mansour", new string('1', 31));

        var result = await _updateProfileValidator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateProfileRequest.PhoneNumber));
    }
}
