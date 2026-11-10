namespace DealZone.Api.Options;

public class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";

    public bool Enabled { get; set; } = true;
    public int LoginPermitLimit { get; set; } = 5;
    public int RegisterPermitLimit { get; set; } = 3;
    public int PasswordResetPermitLimit { get; set; } = 3;
    public int ResendConfirmationPermitLimit { get; set; } = 3;
    public int WindowSeconds { get; set; } = 60;
}

public static class RateLimitPolicies
{
    public const string AuthLogin = "auth-login";
    public const string AuthRegister = "auth-register";
    public const string AuthPassword = "auth-password";
    public const string AuthResendConfirmation = "auth-resend-confirmation";
}
