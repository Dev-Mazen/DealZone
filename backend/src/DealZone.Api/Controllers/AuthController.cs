using DealZone.Application.Auth.DTOs;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Validation;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

[Tags("Authentication")]
[Route("api/v1/auth")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        [FromServices] IValidator<RegisterRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _authService.RegisterAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        [FromServices] IValidator<LoginRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var response = await _authService.LoginAsync(request, ipAddress, cancellationToken);
        return Ok(response);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshTokenRequest request,
        [FromServices] IValidator<RefreshTokenRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var response = await _authService.RefreshTokenAsync(request, ipAddress, cancellationToken);
        return Ok(response);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        [FromBody] RefreshTokenRequest? request,
        CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        await _authService.LogoutAsync(request?.RefreshToken, ipAddress, cancellationToken);
        return Ok(new { message = "Logged out successfully." });
    }

    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(
        [FromBody] ConfirmEmailRequest request,
        [FromServices] IValidator<ConfirmEmailRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        await _authService.ConfirmEmailAsync(request, cancellationToken);
        return Ok(new { message = "Email confirmed successfully. You can now log in." });
    }

    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation(
        [FromBody] ResendConfirmationRequest request,
        [FromServices] IValidator<ResendConfirmationRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        await _authService.ResendConfirmationAsync(request, cancellationToken);
        return Ok(new { message = "If the account exists and is unconfirmed, a new confirmation email has been dispatched." });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        [FromServices] IValidator<ForgotPasswordRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        await _authService.ForgotPasswordAsync(request, cancellationToken);
        return Ok(new { message = "If the account exists, a password reset link has been dispatched." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        [FromServices] IValidator<ResetPasswordRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        await _authService.ResetPasswordAsync(request, cancellationToken);
        return Ok(new { message = "Password reset successfully. You may now log in with your new password." });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUserProfile(CancellationToken cancellationToken)
    {
        var profile = await _authService.GetCurrentUserProfileAsync(cancellationToken);
        return Ok(profile);
    }
}

