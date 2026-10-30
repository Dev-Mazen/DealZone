using DealZone.Application.Common.Interfaces;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace DealZone.IntegrationTests.Infrastructure;

public class InfrastructureServicesIntegrationTests : IClassFixture<DealZoneWebApplicationFactory>
{
    private readonly DealZoneWebApplicationFactory _factory;

    public InfrastructureServicesIntegrationTests(DealZoneWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void DateTimeProvider_ShouldResolveAndProvideUtcNow()
    {
        using var scope = _factory.Services.CreateScope();
        var dateTimeProvider = scope.ServiceProvider.GetService<IDateTimeProvider>();

        Assert.NotNull(dateTimeProvider);
        var difference = DateTimeOffset.UtcNow - dateTimeProvider.UtcNow;
        Assert.True(Math.Abs(difference.TotalSeconds) < 5);
    }

    [Fact]
    public void CurrentUser_ShouldResolveAndDefaultToUnauthenticatedWithoutContext()
    {
        using var scope = _factory.Services.CreateScope();
        var currentUser = scope.ServiceProvider.GetService<ICurrentUser>();

        Assert.NotNull(currentUser);
        Assert.False(currentUser.IsAuthenticated);
        Assert.Null(currentUser.Id);
        Assert.Null(currentUser.CompanyId);
        Assert.Null(currentUser.Email);
        Assert.Null(currentUser.Role);
    }
}

