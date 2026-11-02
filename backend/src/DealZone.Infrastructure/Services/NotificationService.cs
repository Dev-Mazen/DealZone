using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Application.Notifications.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Notifications;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        IDateTimeProvider dateTimeProvider,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
    }

    public async Task<PagedResult<NotificationResponse>> GetUserNotificationsAsync(
        bool? isRead,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = RequireAuthenticatedUserId();

        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == currentUserId);

        if (isRead.HasValue)
        {
            query = query.Where(n => n.IsRead == isRead.Value);
        }

        var totalItems = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(n => n.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationResponse(
                n.Id,
                n.UserId,
                n.Type.ToString(),
                n.Title,
                n.Message,
                n.RelatedEntityType,
                n.RelatedEntityId,
                n.IsRead,
                n.ReadAtUtc,
                n.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return PagedResult<NotificationResponse>.Create(items, pageNumber, pageSize, totalItems);
    }

    public async Task<UnreadCountResponse> GetUnreadCountAsync(
        CancellationToken cancellationToken = default)
    {
        var currentUserId = RequireAuthenticatedUserId();

        var count = await _context.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == currentUserId && !n.IsRead, cancellationToken);

        return new UnreadCountResponse(count);
    }

    public async Task<NotificationResponse> MarkAsReadAsync(
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = RequireAuthenticatedUserId();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == currentUserId, cancellationToken);

        if (notification is null)
        {
            throw new NotFoundException(nameof(Notification), notificationId);
        }

        notification.MarkAsRead(_dateTimeProvider.UtcNow);
        await _context.SaveChangesAsync(cancellationToken);

        return new NotificationResponse(
            notification.Id,
            notification.UserId,
            notification.Type.ToString(),
            notification.Title,
            notification.Message,
            notification.RelatedEntityType,
            notification.RelatedEntityId,
            notification.IsRead,
            notification.ReadAtUtc,
            notification.CreatedAtUtc);
    }

    public async Task<int> MarkAllAsReadAsync(
        CancellationToken cancellationToken = default)
    {
        var currentUserId = RequireAuthenticatedUserId();
        var now = _dateTimeProvider.UtcNow;

        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == currentUserId && !n.IsRead)
            .ToListAsync(cancellationToken);

        if (unreadNotifications.Count == 0)
        {
            return 0;
        }

        foreach (var notification in unreadNotifications)
        {
            notification.MarkAsRead(now);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return unreadNotifications.Count;
    }

    public async Task CreateNotificationAsync(
        Guid userId,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null,
        string? idempotencyKey = null,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty) return;

        if (!string.IsNullOrWhiteSpace(idempotencyKey))
        {
            var exists = await _context.Notifications
                .AnyAsync(n => n.UserId == userId && n.IdempotencyKey == idempotencyKey, cancellationToken);

            if (exists)
            {
                _logger.LogInformation(
                    "Notification for user {UserId} with idempotency key '{Key}' already exists. Skipping duplicate.",
                    userId, idempotencyKey);
                return;
            }
        }

        var notification = Notification.Create(
            userId,
            type,
            title,
            message,
            relatedEntityType,
            relatedEntityId,
            idempotencyKey,
            _dateTimeProvider.UtcNow);

        _context.Notifications.Add(notification);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (!string.IsNullOrWhiteSpace(idempotencyKey))
        {
            _logger.LogWarning(ex, "Idempotency conflict for user {UserId} and key '{Key}'. Duplicate suppressed.", userId, idempotencyKey);
        }
    }

    public async Task CreateNotificationsForCompanyMembersAsync(
        Guid companyId,
        IEnumerable<CompanyRole>? targetRoles,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null,
        string? idempotencyKey = null,
        CancellationToken cancellationToken = default)
    {
        if (companyId == Guid.Empty) return;

        var query = _context.CompanyMembers
            .AsNoTracking()
            .Where(m => m.CompanyId == companyId && m.IsActive);

        if (targetRoles is not null && targetRoles.Any())
        {
            query = query.Where(m => targetRoles.Contains(m.Role));
        }

        var userIds = await query
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (userIds.Count == 0)
        {
            return;
        }

        var now = _dateTimeProvider.UtcNow;
        var toAdd = new List<Notification>();

        foreach (var userId in userIds)
        {
            var userKey = string.IsNullOrWhiteSpace(idempotencyKey) ? null : $"{idempotencyKey}_{userId}";

            if (!string.IsNullOrWhiteSpace(userKey))
            {
                var exists = await _context.Notifications
                    .AnyAsync(n => n.UserId == userId && n.IdempotencyKey == userKey, cancellationToken);
                if (exists) continue;
            }

            toAdd.Add(Notification.Create(
                userId,
                type,
                title,
                message,
                relatedEntityType,
                relatedEntityId,
                userKey,
                now));
        }

        if (toAdd.Count > 0)
        {
            _context.Notifications.AddRange(toAdd);
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "DbUpdateException saving notifications for company {CompanyId}. Some duplicates may have collided.", companyId);
            }
        }
    }

    private Guid RequireAuthenticatedUserId()
    {
        if (_currentUser?.Id is null || _currentUser.Id == Guid.Empty)
        {
            throw new UnauthorizedException("User must be authenticated.");
        }

        return _currentUser.Id.Value;
    }
}
