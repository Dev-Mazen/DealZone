namespace DealZone.Application.Notifications.DTOs;

public record NotificationResponse(
    Guid Id,
    Guid UserId,
    string Type,
    string Title,
    string Message,
    string? RelatedEntityType,
    Guid? RelatedEntityId,
    bool IsRead,
    DateTimeOffset? ReadAtUtc,
    DateTimeOffset CreatedAtUtc);

public record UnreadCountResponse(
    int UnreadCount);

