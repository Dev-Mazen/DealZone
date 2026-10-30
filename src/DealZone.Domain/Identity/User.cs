using DealZone.Domain.Common;

namespace DealZone.Domain.Identity;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsSystemAdmin { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsEmailConfirmed { get; set; }
    public string? EmailConfirmationTokenHash { get; set; }
    public DateTimeOffset? EmailConfirmationExpiresAtUtc { get; set; }
    public string? PasswordResetTokenHash { get; set; }
    public DateTimeOffset? PasswordResetExpiresAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLoginAtUtc { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}


