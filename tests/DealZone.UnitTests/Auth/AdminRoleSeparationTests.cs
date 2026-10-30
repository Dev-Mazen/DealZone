using DealZone.Domain.Companies;
using DealZone.Domain.Identity;

namespace DealZone.UnitTests.Auth;

public class AdminRoleSeparationTests
{
    [Fact]
    public void NewUser_DefaultIsSystemAdmin_ShouldBeFalse()
    {
        var user = new User
        {
            Email = "buyer@dealzone.eg",
            FullName = "Buyer User"
        };

        Assert.False(user.IsSystemAdmin);
    }

    [Fact]
    public void CompanyMember_WithOwnerRole_DoesNotImplySystemAdmin()
    {
        var user = new User
        {
            Email = "owner@dealzone.eg",
            FullName = "Company Owner"
        };

        var member = new CompanyMember
        {
            CompanyId = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Role = CompanyRole.Owner
        };

        Assert.Equal(CompanyRole.Owner, member.Role);
        Assert.False(user.IsSystemAdmin);
    }

    [Fact]
    public void CompanyMember_WithAdminRole_DoesNotImplySystemAdmin()
    {
        var user = new User
        {
            Email = "companyadmin@dealzone.eg",
            FullName = "Company Admin"
        };

        var member = new CompanyMember
        {
            CompanyId = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Role = CompanyRole.Admin
        };

        Assert.Equal(CompanyRole.Admin, member.Role);
        Assert.False(user.IsSystemAdmin);
    }

    [Fact]
    public void SystemAdmin_CanBeExplicitlyAssigned()
    {
        var user = new User
        {
            Email = "platformadmin@dealzone.eg",
            FullName = "Platform Super Admin",
            IsSystemAdmin = true
        };

        Assert.True(user.IsSystemAdmin);
    }
}

