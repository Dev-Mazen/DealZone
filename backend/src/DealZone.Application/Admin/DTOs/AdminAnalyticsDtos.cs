namespace DealZone.Application.Admin.DTOs;

public record PlatformOverviewKpiDto(
    int TotalCompanies,
    int VerifiedCompanies,
    int PendingCompanies,
    int ChangesRequiredCompanies,
    int RejectedCompanies,
    int BuyerCompaniesCount,
    int SupplierCompaniesCount,
    int TotalRfqs,
    int OpenRfqs,
    int ClosedRfqs,
    int DraftRfqs,
    int TotalOffers,
    int SubmittedOffers,
    int AcceptedOffers,
    int RejectedOffers,
    int TotalDeals,
    int AwaitingConfirmationDeals,
    int ConfirmedDeals,
    int InProgressDeals,
    int CompletedDeals,
    int CancelledDeals,
    int DisputedDeals,
    decimal TotalTradedVolumeEgp,
    int TotalDisputes,
    int OpenDisputes,
    int ResolvedDisputes);

public record SectorDistributionDto(
    string Sector,
    int CompanyCount,
    int RfqCount);

public record ActivityTimelineDto(
    string Period,
    int NewCompanies,
    int NewRfqs,
    int NewDeals,
    decimal TradedVolume);

public record AdminAnalyticsResponse(
    PlatformOverviewKpiDto Kpis,
    IReadOnlyList<SectorDistributionDto> Sectors,
    IReadOnlyList<ActivityTimelineDto> Activity,
    DateTimeOffset GeneratedAtUtc);
