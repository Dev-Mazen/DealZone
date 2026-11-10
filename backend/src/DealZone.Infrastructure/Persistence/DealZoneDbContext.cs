using DealZone.Application.Common.Interfaces;
using DealZone.Domain.Catalog;
using DealZone.Domain.Common;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Identity;
using DealZone.Domain.Notifications;
using DealZone.Domain.Offers;
using DealZone.Domain.Purchasing;
using DealZone.Domain.Reviews;
using DealZone.Domain.Rfqs;
using DealZone.Domain.Shipping;
using DealZone.Domain.Tenders;
using Microsoft.EntityFrameworkCore;

namespace DealZone.Infrastructure.Persistence;

public class DealZoneDbContext : DbContext
{
    private readonly ICurrentUser? _currentUser;
    private readonly IDateTimeProvider? _dateTimeProvider;

    public DealZoneDbContext(DbContextOptions<DealZoneDbContext> options)
        : base(options)
    {
    }

    public DealZoneDbContext(
        DbContextOptions<DealZoneDbContext> options,
        ICurrentUser currentUser,
        IDateTimeProvider dateTimeProvider)
        : base(options)
    {
        _currentUser = currentUser;
        _dateTimeProvider = dateTimeProvider;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<CompanyContactDetails> CompanyContactDetails => Set<CompanyContactDetails>();
    public DbSet<CompanyMember> CompanyMembers => Set<CompanyMember>();
    public DbSet<VerificationDocument> VerificationDocuments => Set<VerificationDocument>();
    public DbSet<VerificationDecision> VerificationDecisions => Set<VerificationDecision>();
    public DbSet<MaterialCategory> MaterialCategories => Set<MaterialCategory>();
    public DbSet<UnitOfMeasure> UnitsOfMeasure => Set<UnitOfMeasure>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<CatalogProduct> CatalogProducts => Set<CatalogProduct>();
    public DbSet<DirectPurchase> DirectPurchases => Set<DirectPurchase>();
    public DbSet<Rfq> Rfqs => Set<Rfq>();
    public DbSet<RfqItem> RfqItems => Set<RfqItem>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<OfferItem> OfferItems => Set<OfferItem>();
    public DbSet<Deal> Deals => Set<Deal>();
    public DbSet<DealDispute> DealDisputes => Set<DealDispute>();
    public DbSet<Tender> Tenders => Set<Tender>();
    public DbSet<TenderItem> TenderItems => Set<TenderItem>();
    public DbSet<Bid> Bids => Set<Bid>();
    public DbSet<BidItem> BidItems => Set<BidItem>();
    public DbSet<ShippingProvider> ShippingProviders => Set<ShippingProvider>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasSequence<long>("RfqNumberSequence")
            .StartsAt(1000)
            .IncrementsBy(1);
        modelBuilder.HasSequence<long>("TenderNumberSequence")
            .StartsAt(1000)
            .IncrementsBy(1);
        modelBuilder.HasSequence<long>("BidNumberSequence")
            .StartsAt(1000)
            .IncrementsBy(1);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DealZoneDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditInformation();
        return base.SaveChangesAsync(cancellationToken);
    }

    internal void ApplyAuditInformation()
    {
        var now = _dateTimeProvider?.UtcNow ?? DateTimeOffset.UtcNow;
        var userId = _currentUser?.Id?.ToString() ?? "System";

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = now;
                entry.Entity.CreatedBy ??= userId;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.LastModifiedAtUtc = now;
                entry.Entity.LastModifiedBy = userId;
            }
        }

        foreach (var entry in ChangeTracker.Entries<ISoftDelete>())
        {
            if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.DeletedAtUtc = now;
                entry.Entity.DeletedBy = userId;
            }
        }
    }
}
