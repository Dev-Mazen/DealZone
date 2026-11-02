using DealZone.Domain.Identity;

namespace DealZone.UnitTests.Auth;

public class RefreshTokenModelTests
{
    [Fact]
    public void ActiveToken_WhenNotExpiredAndNotRevoked_ShouldBeActive()
    {
        var token = new RefreshToken
        {
            UserId = Guid.NewGuid(),
            TokenHash = "hash123",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(7),
            RevokedAtUtc = null
        };

        Assert.True(token.IsActive);
        Assert.False(token.IsExpired);
        Assert.False(token.IsRevoked);
    }

    [Fact]
    public void ExpiredToken_ShouldNotBeActive()
    {
        var token = new RefreshToken
        {
            UserId = Guid.NewGuid(),
            TokenHash = "hash123",
            CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-10),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
            RevokedAtUtc = null
        };

        Assert.False(token.IsActive);
        Assert.True(token.IsExpired);
        Assert.False(token.IsRevoked);
    }

    [Fact]
    public void RevokedToken_ShouldNotBeActive()
    {
        var token = new RefreshToken
        {
            UserId = Guid.NewGuid(),
            TokenHash = "hash123",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(7),
            RevokedAtUtc = DateTimeOffset.UtcNow
        };

        Assert.False(token.IsActive);
        Assert.False(token.IsExpired);
        Assert.True(token.IsRevoked);
    }
}

