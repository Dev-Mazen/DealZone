using DealZone.Domain.Common;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Identity;

namespace DealZone.Domain.Notifications;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public string? RelatedEntityType { get; set; }
    public Guid? RelatedEntityId { get; set; }

    public bool IsRead { get; set; }
    public DateTimeOffset? ReadAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public string? IdempotencyKey { get; set; }

    private Notification()
    {
    }

    public static Notification Create(
        Guid userId,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null,
        string? idempotencyKey = null,
        DateTimeOffset? createdAtUtc = null)
    {
        if (userId == Guid.Empty)
        {
            throw new DomainException("UserId is required for a notification.");
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainException("Notification title cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(message))
        {
            throw new DomainException("Notification message cannot be empty.");
        }

        return new Notification
        {
            UserId = userId,
            Type = type,
            Title = title.Trim(),
            Message = message.Trim(),
            RelatedEntityType = relatedEntityType?.Trim(),
            RelatedEntityId = relatedEntityId,
            IsRead = false,
            ReadAtUtc = null,
            CreatedAtUtc = createdAtUtc ?? DateTimeOffset.UtcNow,
            IdempotencyKey = idempotencyKey?.Trim()
        };
    }

    public void MarkAsRead(DateTimeOffset readAtUtc)
    {
        if (!IsRead)
        {
            IsRead = true;
            ReadAtUtc = readAtUtc;
        }
    }
}

