using DealZone.Application.Auth.DTOs;

namespace DealZone.Application.Common.Interfaces;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task LogoutAsync(string? refreshToken, string? ipAddress, CancellationToken cancellationToken = default);
    Task ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken cancellationToken = default);
    Task ResendConfirmationAsync(ResendConfirmationRequest request, CancellationToken cancellationToken = default);
    Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
    Task<UserProfileResponse> GetCurrentUserProfileAsync(CancellationToken cancellationToken = default);
}

