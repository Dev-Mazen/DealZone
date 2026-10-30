using DealZone.Application.Common.Models;
using DealZone.Application.Notifications.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Notifications;

namespace DealZone.Application.Common.Interfaces;

public interface INotificationService
{
    Task<PagedResult<NotificationResponse>> GetUserNotificationsAsync(
        bool? isRead,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<UnreadCountResponse> GetUnreadCountAsync(
        CancellationToken cancellationToken = default);

    Task<NotificationResponse> MarkAsReadAsync(
        Guid notificationId,
        CancellationToken cancellationToken = default);

    Task<int> MarkAllAsReadAsync(
        CancellationToken cancellationToken = default);

    Task CreateNotificationAsync(
        Guid userId,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null,
        string? idempotencyKey = null,
        CancellationToken cancellationToken = default);

    Task CreateNotificationsForCompanyMembersAsync(
        Guid companyId,
        IEnumerable<CompanyRole>? targetRoles,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null,
        string? idempotencyKey = null,
        CancellationToken cancellationToken = default);
}

