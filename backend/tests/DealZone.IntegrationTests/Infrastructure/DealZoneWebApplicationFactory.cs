using DealZone.Infrastructure.Persistence;
using DealZone.IntegrationTests.Controllers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace DealZone.IntegrationTests.Infrastructure;

public class DealZoneWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.AddControllers()
                .AddApplicationPart(typeof(TestExceptionsController).Assembly);

            var descriptors = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<DealZoneDbContext>) ||
                d.ServiceType == typeof(DealZoneDbContext)).ToList();

            foreach (var descriptor in descriptors)
            {
                services.Remove(descriptor);
            }

            var inMemoryServiceProvider = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .BuildServiceProvider();

            services.AddDbContext<DealZoneDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName)
                       .UseInternalServiceProvider(inMemoryServiceProvider);
            });
        });
    }
}

