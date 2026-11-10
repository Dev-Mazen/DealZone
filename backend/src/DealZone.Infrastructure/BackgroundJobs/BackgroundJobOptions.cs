namespace DealZone.Infrastructure.BackgroundJobs;

/// <summary>
/// Centralized configuration for platform background workers.
/// </summary>
public class BackgroundJobOptions
{
    public const string SectionName = "BackgroundJobs";

    /// <summary>
    /// Enable or disable automatic offer expiry worker.
    /// </summary>
    public bool EnableOfferExpiryJob { get; set; } = true;

    /// <summary>
    /// Interval in seconds between offer expiry runs. Default: 60s.
    /// </summary>
    public int OfferExpiryIntervalSeconds { get; set; } = 60;

    /// <summary>
    /// Maximum number of offers to evaluate and expire in a single batch.
    /// </summary>
    public int OfferExpiryBatchSize { get; set; } = 50;

    /// <summary>
    /// Enable or disable refresh token cleanup worker.
    /// </summary>
    public bool EnableTokenCleanupJob { get; set; } = true;

    /// <summary>
    /// Interval in hours between token cleanup runs. Default: 24 hours.
    /// </summary>
    public int TokenCleanupIntervalHours { get; set; } = 24;

    /// <summary>
    /// Retention in days for revoked or expired tokens before deletion. Default: 30 days.
    /// </summary>
    public int TokenRetentionDays { get; set; } = 30;

    /// <summary>
    /// Enable or disable automatic tender closing worker.
    /// </summary>
    public bool EnableTenderClosingJob { get; set; } = true;

    /// <summary>
    /// Interval in seconds between tender closing runs. Default: 60s.
    /// </summary>
    public int TenderClosingIntervalSeconds { get; set; } = 60;

    /// <summary>
    /// Maximum number of tenders to evaluate and close in a single batch.
    /// </summary>
    public int TenderClosingBatchSize { get; set; } = 50;
}
