using DealZone.Domain.Common;

namespace DealZone.Domain.Identity;

public class EmailVerification : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string CodeHash { get; set; } = string.Empty;
    public string LinkTokenHash { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset CodeExpiresAtUtc { get; set; }

    public int Attempts { get; set; }
    public DateTimeOffset? ConsumedAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string? IpAddress { get; set; }
}
