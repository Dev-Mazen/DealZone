using DealZone.Application.Common.Interfaces;
using DealZone.Domain.Companies;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DealZone.IntegrationTests.Persistence;

public class AuditAndSoftDeleteTests
{
    private sealed class TestCurrentUser(Guid? userId) : ICurrentUser
    {
        public Guid? Id => userId;
        public Guid? CompanyId => null;
        public string? Email => "test@dealzone.eg";
        public string? Role => "Admin";
        public bool IsAuthenticated => userId.HasValue;
        public bool IsSystemAdmin => false;
    }

    private sealed class TestDateTimeProvider(DateTimeOffset utcNow) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow => utcNow;
    }

    [Fact]
    public void ApplyAuditInformation_OnAddedEntity_ShouldPopulateAuditFields()
    {
        var testUserId = Guid.NewGuid();
        var testTime = new DateTimeOffset(2026, 10, 30, 12, 0, 0, TimeSpan.Zero);

        var options = new DbContextOptionsBuilder<DealZoneDbContext>()
            .UseSqlServer("Server=localhost;Database=DealZoneTestDb;Trusted_Connection=True;TrustServerCertificate=True;")
            .Options;

        var context = new DealZoneDbContext(
            options,
            new TestCurrentUser(testUserId),
            new TestDateTimeProvider(testTime));

        var company = new Company
        {
            LegalName = "Al Ahram Chemicals",
            TradeName = "Al Ahram",
            IndustrySector = "Chemicals",
            City = "Suez",
            Governorate = "Suez"
        };

        context.Companies.Add(company);

        context.ApplyAuditInformation();

        Assert.Equal(testTime, company.CreatedAtUtc);
        Assert.Equal(testUserId.ToString(), company.CreatedBy);
    }

    [Fact]
    public void ApplyAuditInformation_OnDeletedEntity_ShouldTransformToSoftDelete()
    {
        var testUserId = Guid.NewGuid();
        var testTime = new DateTimeOffset(2026, 10, 30, 14, 0, 0, TimeSpan.Zero);

        var options = new DbContextOptionsBuilder<DealZoneDbContext>()
            .UseSqlServer("Server=localhost;Database=DealZoneTestDb;Trusted_Connection=True;TrustServerCertificate=True;")
            .Options;

        var context = new DealZoneDbContext(
            options,
            new TestCurrentUser(testUserId),
            new TestDateTimeProvider(testTime));

        var company = new Company
        {
            LegalName = "Al Ahram Chemicals",
            TradeName = "Al Ahram",
            IndustrySector = "Chemicals",
            City = "Suez",
            Governorate = "Suez",
            IsDeleted = false
        };

        context.Companies.Attach(company);
        context.Companies.Remove(company);

        Assert.Equal(EntityState.Deleted, context.Entry(company).State);

        context.ApplyAuditInformation();

        Assert.Equal(EntityState.Modified, context.Entry(company).State);
        Assert.True(company.IsDeleted);
        Assert.Equal(testTime, company.DeletedAtUtc);
        Assert.Equal(testUserId.ToString(), company.DeletedBy);
    }
}

