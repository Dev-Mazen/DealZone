using DealZone.Domain.Companies;
using DealZone.Domain.Identity;

namespace DealZone.UnitTests.Verification;

public class CompanyVerificationInvariantsTests
{
    [Fact]
    public void Company_InChangesRequiredStatus_CannotPerformCommercialActivities()
    {
        var company = new Company
        {
            LegalName = "Al-Ahram Steel LLC",
            TradeName = "Al-Ahram Steel",
            IndustrySector = "Metals",
            City = "Cairo",
            Governorate = "Cairo",
            IsActive = true,
            IsDeleted = false,
            VerificationStatus = CompanyVerificationStatus.ChangesRequired
        };

        Assert.False(company.CanPerformCommercialActivities);
    }

    [Fact]
    public void Company_InPendingStatus_CannotPerformCommercialActivities()
    {
        var company = new Company
        {
            LegalName = "Al-Ahram Steel LLC",
            TradeName = "Al-Ahram Steel",
            IndustrySector = "Metals",
            City = "Cairo",
            Governorate = "Cairo",
            IsActive = true,
            IsDeleted = false,
            VerificationStatus = CompanyVerificationStatus.Pending
        };

        Assert.False(company.CanPerformCommercialActivities);
    }

    [Fact]
    public void Company_InUnderReviewStatus_CannotPerformCommercialActivities()
    {
        var company = new Company
        {
            LegalName = "Al-Ahram Steel LLC",
            TradeName = "Al-Ahram Steel",
            IndustrySector = "Metals",
            City = "Cairo",
            Governorate = "Cairo",
            IsActive = true,
            IsDeleted = false,
            VerificationStatus = CompanyVerificationStatus.UnderReview
        };

        Assert.False(company.CanPerformCommercialActivities);
    }

    [Fact]
    public void Company_InRejectedStatus_CannotPerformCommercialActivities()
    {
        var company = new Company
        {
            LegalName = "Al-Ahram Steel LLC",
            TradeName = "Al-Ahram Steel",
            IndustrySector = "Metals",
            City = "Cairo",
            Governorate = "Cairo",
            IsActive = true,
            IsDeleted = false,
            VerificationStatus = CompanyVerificationStatus.Rejected
        };

        Assert.False(company.CanPerformCommercialActivities);
    }

    [Fact]
    public void Company_InApprovedStatus_WhenActiveAndNotDeleted_CanPerformCommercialActivities()
    {
        var company = new Company
        {
            LegalName = "Al-Ahram Steel LLC",
            TradeName = "Al-Ahram Steel",
            IndustrySector = "Metals",
            City = "Cairo",
            Governorate = "Cairo",
            IsActive = true,
            IsDeleted = false,
            VerificationStatus = CompanyVerificationStatus.Approved
        };

        Assert.True(company.CanPerformCommercialActivities);
    }

    [Fact]
    public void Company_InApprovedStatus_WhenSoftDeleted_CannotPerformCommercialActivities()
    {
        var company = new Company
        {
            LegalName = "Al-Ahram Steel LLC",
            TradeName = "Al-Ahram Steel",
            IndustrySector = "Metals",
            City = "Cairo",
            Governorate = "Cairo",
            IsActive = true,
            IsDeleted = true,
            VerificationStatus = CompanyVerificationStatus.Approved
        };

        Assert.False(company.CanPerformCommercialActivities);
    }

    [Fact]
    public void VerificationDecision_RecordsAuditFieldsCorrectly()
    {
        var adminId = Guid.NewGuid();
        var companyId = Guid.NewGuid();
        var decidedAt = DateTimeOffset.UtcNow;

        var decision = new VerificationDecision
        {
            CompanyId = companyId,
            ReviewedByUserId = adminId,
            Decision = CompanyVerificationStatus.ChangesRequired,
            Reason = "Tax card expired in 2025.",
            DecidedAtUtc = decidedAt
        };

        Assert.Equal(companyId, decision.CompanyId);
        Assert.Equal(adminId, decision.ReviewedByUserId);
        Assert.Equal(CompanyVerificationStatus.ChangesRequired, decision.Decision);
        Assert.Equal("Tax card expired in 2025.", decision.Reason);
        Assert.Equal(decidedAt, decision.DecidedAtUtc);
    }
}

