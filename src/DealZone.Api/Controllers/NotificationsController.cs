using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Application.Notifications.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

[Tags("Notifications")]
[Authorize]
public class NotificationsController : ApiControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<NotificationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<NotificationResponse>>> GetNotifications(
        [FromQuery] bool? isRead,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.GetUserNotificationsAsync(
            isRead,
            page,
            pageSize,
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(UnreadCountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UnreadCountResponse>> GetUnreadCount(
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.GetUnreadCountAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/read")]
    [ProducesResponseType(typeof(NotificationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<NotificationResponse>> MarkAsRead(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.MarkAsReadAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("read-all")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult> MarkAllAsRead(
        CancellationToken cancellationToken = default)
    {
        var count = await _notificationService.MarkAllAsReadAsync(cancellationToken);
        return Ok(new { markedAsReadCount = count });
    }
}

