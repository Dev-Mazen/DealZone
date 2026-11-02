using DealZone.Domain.Exceptions;
using DealZone.Domain.Notifications;

namespace DealZone.UnitTests.Notifications;

public class NotificationUnitTests
{
    [Fact]
    public void Create_WithValidParameters_InitializesCorrectly()
    {
        var userId = Guid.NewGuid();
        var type = NotificationType.OfferAccepted;
        var title = "Offer Accepted";
        var message = "Your offer was accepted.";

        var notification = Notification.Create(userId, type, title, message, "Deal", Guid.NewGuid(), "key-123");

        Assert.Equal(userId, notification.UserId);
        Assert.Equal(type, notification.Type);
        Assert.Equal(title, notification.Title);
        Assert.Equal(message, notification.Message);
        Assert.Equal("Deal", notification.RelatedEntityType);
        Assert.NotNull(notification.RelatedEntityId);
        Assert.False(notification.IsRead);
        Assert.Null(notification.ReadAtUtc);
        Assert.Equal("key-123", notification.IdempotencyKey);
    }

    [Fact]
    public void Create_WithEmptyUserId_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() =>
            Notification.Create(Guid.Empty, NotificationType.System, "Title", "Message"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithEmptyTitleOrMessage_ThrowsDomainException(string emptyValue)
    {
        var userId = Guid.NewGuid();
        Assert.Throws<DomainException>(() =>
            Notification.Create(userId, NotificationType.System, emptyValue, "Message"));
        Assert.Throws<DomainException>(() =>
            Notification.Create(userId, NotificationType.System, "Title", emptyValue));
    }

    [Fact]
    public void MarkAsRead_WhenUnread_SetsIsReadAndReadAtUtc()
    {
        var notification = Notification.Create(Guid.NewGuid(), NotificationType.DealStarted, "Started", "Message");
        var readTime = DateTimeOffset.UtcNow;

        notification.MarkAsRead(readTime);

        Assert.True(notification.IsRead);
        Assert.Equal(readTime, notification.ReadAtUtc);
    }

    [Fact]
    public void MarkAsRead_WhenAlreadyRead_DoesNotOverwriteReadAtUtc()
    {
        var notification = Notification.Create(Guid.NewGuid(), NotificationType.DealStarted, "Started", "Message");
        var firstReadTime = DateTimeOffset.UtcNow.AddMinutes(-5);
        notification.MarkAsRead(firstReadTime);

        var secondReadTime = DateTimeOffset.UtcNow;
        notification.MarkAsRead(secondReadTime);

        Assert.Equal(firstReadTime, notification.ReadAtUtc);
    }
}
