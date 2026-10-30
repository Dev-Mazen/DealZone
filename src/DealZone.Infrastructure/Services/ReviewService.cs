using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Application.Reviews.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Notifications;
using DealZone.Domain.Reviews;
using DealZone.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Services;

public class ReviewService : IReviewService
{
    private readonly DealZoneDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly INotificationService _notificationService;
    private readonly ILogger<ReviewService> _logger;
    private readonly IValidator<CreateReviewRequest> _createReviewValidator;

    public ReviewService(
        DealZoneDbContext context,
        ICurrentUser currentUser,
        INotificationService notificationService,
        ILogger<ReviewService> logger,
        IValidator<CreateReviewRequest> createReviewValidator)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _logger = logger;
        _createReviewValidator = createReviewValidator;
    }

    // -------------------------------------------------------------------------
    // 1. Submit Review
    // -------------------------------------------------------------------------

    public async Task<ReviewResponse> CreateReviewAsync(
        Guid dealId,
        CreateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _createReviewValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new DealZone.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        var deal = await _context.Deals
            .Include(d => d.BuyerCompany)
            .Include(d => d.SupplierCompany)
            .FirstOrDefaultAsync(d => d.Id == dealId, cancellationToken)
            ?? throw new NotFoundException($"Deal with ID '{dealId}' was not found.");

        if (deal.BuyerCompanyId != company.Id && deal.SupplierCompanyId != company.Id)
        {
            throw new ForbiddenException("Only verified buyer or supplier companies participating in this deal can submit a review.");
        }

        if (deal.Status != DealStatus.Completed)
        {
            throw new ConflictException($"Reviews can only be submitted for completed deals. Current deal status is '{deal.Status}'.");
        }

        var isBuyer = deal.BuyerCompanyId == company.Id;
        var reviewerCompanyId = isBuyer ? deal.BuyerCompanyId : deal.SupplierCompanyId;
        var targetCompanyId = isBuyer ? deal.SupplierCompanyId : deal.BuyerCompanyId;

        var alreadyReviewed = await _context.Reviews
            .AnyAsync(r => r.DealId == dealId && r.ReviewerCompanyId == reviewerCompanyId, cancellationToken);

        if (alreadyReviewed)
        {
            throw new ConflictException("Your company has already submitted a review for this deal.");
        }

        var review = Review.Create(deal, reviewerCompanyId, targetCompanyId, request.Rating, request.Comment);

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Review submitted for Deal {DealNumber} by Company {ReviewerCompanyId} for Target {TargetCompanyId} with Rating {Rating}.",
            deal.DealNumber, reviewerCompanyId, targetCompanyId, request.Rating);

        await _notificationService.CreateNotificationsForCompanyMembersAsync(
            targetCompanyId,
            null,
            NotificationType.ReviewReceived,
            "Review Received",
            $"Your company received a {request.Rating}-star review for Deal {deal.DealNumber}.",
            "Review",
            review.Id,
            $"review_received_{review.Id}",
            cancellationToken);

        return MapToReviewResponse(review, deal, deal.BuyerCompany, deal.SupplierCompany);
    }

    // -------------------------------------------------------------------------
    // 2. Get Deal Reviews
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<ReviewResponse>> GetDealReviewsAsync(
        Guid dealId,
        CancellationToken cancellationToken = default)
    {
        var deal = await _context.Deals
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == dealId, cancellationToken)
            ?? throw new NotFoundException($"Deal with ID '{dealId}' was not found.");

        var reviews = await _context.Reviews
            .AsNoTracking()
            .Include(r => r.Deal)
            .Include(r => r.ReviewerCompany)
            .Include(r => r.TargetCompany)
            .Where(r => r.DealId == dealId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return reviews.Select(r => MapToReviewResponse(r, r.Deal, r.ReviewerCompany, r.TargetCompany)).ToList();
    }

    // -------------------------------------------------------------------------
    // 3. Get Company Reviews (Public/Authenticated)
    // -------------------------------------------------------------------------

    public async Task<CompanyReviewsResponse> GetCompanyReviewsAsync(
        Guid companyId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var targetCompany = await _context.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == companyId, cancellationToken)
            ?? throw new NotFoundException($"Company with ID '{companyId}' was not found.");

        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Reviews
            .AsNoTracking()
            .Include(r => r.Deal)
            .Include(r => r.ReviewerCompany)
            .Include(r => r.TargetCompany)
            .Where(r => r.TargetCompanyId == companyId);

        var totalCount = await query.CountAsync(cancellationToken);
        var averageRating = totalCount > 0
            ? Math.Round((decimal)await query.AverageAsync(r => r.Rating, cancellationToken), 2)
            : 0m;

        var reviews = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = reviews.Select(r => MapToReviewResponse(r, r.Deal, r.ReviewerCompany, targetCompany)).ToList();

        var companyName = !string.IsNullOrWhiteSpace(targetCompany.TradeName)
            ? targetCompany.TradeName
            : targetCompany.LegalName;

        var stats = new CompanyReviewStatsDto(targetCompany.Id, companyName, averageRating, totalCount);
        var pagedResult = PagedResult<ReviewResponse>.Create(items, pageNumber, pageSize, totalCount);

        return new CompanyReviewsResponse(stats, pagedResult);
    }

    // -------------------------------------------------------------------------
    // 4. Get Current Company's Received Reviews
    // -------------------------------------------------------------------------

    public async Task<CompanyReviewsResponse> GetMyCompanyReviewsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var (company, _) = await RequireApprovedCompanyAsync(cancellationToken);

        return await GetCompanyReviewsAsync(company.Id, pageNumber, pageSize, cancellationToken);
    }

    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------

    private async Task<(Company company, CompanyMember member)> RequireApprovedCompanyAsync(
        CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.Id.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var userId = _currentUser.Id.Value;

        var member = await _context.CompanyMembers
            .Include(m => m.Company)
            .FirstOrDefaultAsync(m => m.UserId == userId && m.IsActive, cancellationToken)
            ?? throw new UnauthorizedException("No active company membership found for the current user.");

        var company = member.Company;
        if (company == null || !company.CanPerformCommercialActivities)
        {
            throw new ForbiddenException("Only verified and approved companies are authorized to perform commercial marketplace activities.");
        }

        return (company, member);
    }

    private static ReviewResponse MapToReviewResponse(
        Review review,
        Deal? deal,
        Company? reviewerCompany,
        Company? targetCompany)
    {
        var reviewerName = !string.IsNullOrWhiteSpace(reviewerCompany?.TradeName)
            ? reviewerCompany.TradeName
            : "Verified Industrial Partner";

        var targetName = !string.IsNullOrWhiteSpace(targetCompany?.TradeName)
            ? targetCompany.TradeName
            : targetCompany?.LegalName ?? "Verified Industrial Partner";

        return new ReviewResponse(
            review.Id,
            review.DealId,
            deal?.DealNumber ?? string.Empty,
            review.ReviewerCompanyId,
            reviewerName,
            review.TargetCompanyId,
            targetName,
            review.Rating,
            review.Comment,
            review.CreatedAtUtc);
    }
}

