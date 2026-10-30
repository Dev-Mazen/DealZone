using DealZone.Domain.Common;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Exceptions;

namespace DealZone.Domain.Reviews;

public class Review : BaseEntity, ISoftDelete
{
    public Guid DealId { get; set; }
    public Deal? Deal { get; set; }

    public Guid ReviewerCompanyId { get; set; }
    public Company? ReviewerCompany { get; set; }

    public Guid TargetCompanyId { get; set; }
    public Company? TargetCompany { get; set; }

    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    // ISoftDelete
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }

    public static Review Create(
        Deal deal,
        Guid reviewerCompanyId,
        Guid targetCompanyId,
        int rating,
        string comment)
    {
        if (deal.Status != DealStatus.Completed)
        {
            throw new DomainException("Reviews can only be submitted for completed deals.");
        }

        if (reviewerCompanyId != deal.BuyerCompanyId && reviewerCompanyId != deal.SupplierCompanyId)
        {
            throw new DomainException("Only companies participating in the deal can submit a review.");
        }

        if (reviewerCompanyId == targetCompanyId)
        {
            throw new DomainException("A company cannot review itself.");
        }

        if (rating is < 1 or > 5)
        {
            throw new DomainException("Review rating must be between 1 and 5.");
        }

        return new Review
        {
            DealId = deal.Id,
            ReviewerCompanyId = reviewerCompanyId,
            TargetCompanyId = targetCompanyId,
            Rating = rating,
            Comment = comment.Trim()
        };
    }
}
