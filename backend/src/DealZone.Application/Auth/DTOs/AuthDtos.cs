namespace DealZone.Application.Auth.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string? PhoneNumber = null,
    string? PreferredLanguage = "ar");

public record RegisterResponse(
    Guid UserId,
    string Email,
    string Message);

public record LoginRequest(
    string Email,
    string Password);

public record RefreshTokenRequest(
    string RefreshToken);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    string TokenType = "Bearer");

public record ConfirmEmailRequest(
    string Email,
    string Token);

public record ConfirmEmailCodeRequest(
    string Email,
    string Code);

public record ConfirmEmailLinkRequest(
    string Token);

public record ResendConfirmationRequest(
    string Email);

public record ForgotPasswordRequest(
    string Email);

public record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword);

public record UserCompanyDto(
    Guid Id,
    string LegalName,
    string TradeName,
    string IndustrySector,
    string City,
    string Governorate,
    string VerificationStatus,
    bool CanPerformCommercialActivities,
    string Role,
    string CompanyType = "Buyer");

public record UserProfileResponse(
    Guid Id,
    string Email,
    string FullName,
    string? PhoneNumber,
    bool IsEmailConfirmed,
    bool IsSystemAdmin,
    UserCompanyDto? Company,
    string PreferredLanguage = "ar");

public record UpdateProfileRequest(
    string FullName,
    string? PhoneNumber = null,
    string? PreferredLanguage = null);

