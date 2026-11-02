namespace DealZone.Domain.Common;

public abstract class AuditableEntity : BaseEntity
{
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTimeOffset? LastModifiedAtUtc { get; set; }
    public string? LastModifiedBy { get; set; }
}

