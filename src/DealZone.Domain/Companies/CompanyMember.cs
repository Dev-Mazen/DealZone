using DealZone.Domain.Common;
using DealZone.Domain.Identity;

namespace DealZone.Domain.Companies;

public class CompanyMember : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public CompanyRole Role { get; set; } = CompanyRole.Member;
    public bool IsPrimary { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset JoinedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}

