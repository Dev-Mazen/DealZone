using DealZone.Domain.Common;
using DealZone.Domain.Identity;

namespace DealZone.Domain.Companies;

/// <summary>
/// Immutable audit record for each admin decision on a company's verification request.
/// One row is appended per decision (approve / reject / request-changes).
/// </summary>
public class VerificationDecision : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public Guid ReviewedByUserId { get; set; }
    public User ReviewedByUser { get; set; } = null!;

    public CompanyVerificationStatus Decision { get; set; }

    /// <summary>Required for Rejected and ChangesRequired decisions.</summary>
    public string? Reason { get; set; }

    public DateTimeOffset DecidedAtUtc { get; set; }
}

