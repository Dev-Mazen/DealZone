using DealZone.Domain.Common;
using DealZone.Domain.Companies;
using DealZone.Domain.Identity;

namespace DealZone.Domain.Deals;

public class DealDispute : BaseEntity
{
    public Guid DealId { get; set; }
    public Deal Deal { get; set; } = null!;

    public Guid OpenedByCompanyId { get; set; }
    public Company? OpenedByCompany { get; set; }

    public Guid OpenedByUserId { get; set; }
    public User OpenedByUser { get; set; } = null!;

    public DisputeCategory Category { get; set; } = DisputeCategory.Other;
    public string Reason { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public DisputeStatus Status { get; set; } = DisputeStatus.Open;
    public DisputeResolutionAction? ResolutionAction { get; set; }
    public string? ResolutionNotes { get; set; }

    public Guid? ResolvedByUserId { get; set; }
    public User? ResolvedByUser { get; set; }

    public DateTimeOffset OpenedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ResolvedAtUtc { get; set; }
}
