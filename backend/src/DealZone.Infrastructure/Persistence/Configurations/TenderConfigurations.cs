using DealZone.Domain.Tenders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DealZone.Infrastructure.Persistence.Configurations;

public class TenderConfiguration : IEntityTypeConfiguration<Tender>
{
    public void Configure(EntityTypeBuilder<Tender> builder)
    {
        builder.ToTable("Tenders");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TenderNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(t => t.TenderNumber)
            .IsUnique();

        builder.Property(t => t.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(t => t.Description)
            .HasMaxLength(2000);

        builder.Property(t => t.DeliveryGovernorate)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(t => t.DeliveryCity)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(t => t.DeliveryAddress)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(t => t.ReferencePrice)
            .HasPrecision(18, 2);

        builder.Property(t => t.Currency)
            .HasMaxLength(3)
            .HasDefaultValue("EGP")
            .IsRequired();

        builder.Property(t => t.Notes)
            .HasMaxLength(2000);

        builder.Property(t => t.AwardRationale)
            .HasMaxLength(1000);

        builder.Property(t => t.CancellationReason)
            .HasMaxLength(500);

        builder.Property(t => t.CreatedBy)
            .HasMaxLength(100);

        builder.Property(t => t.LastModifiedBy)
            .HasMaxLength(100);

        builder.Property(t => t.DeletedBy)
            .HasMaxLength(100);

        builder.Property(t => t.RowVersion)
            .IsRowVersion();

        // Soft delete query filter
        builder.HasQueryFilter(t => !t.IsDeleted);

        // Indexes
        builder.HasIndex(t => t.BuyerCompanyId);
        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => t.ClosingDateUtc);
        builder.HasIndex(t => t.TargetCategoryId);

        // Foreign keys
        builder.HasOne(t => t.BuyerCompany)
            .WithMany()
            .HasForeignKey(t => t.BuyerCompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.TargetCategory)
            .WithMany()
            .HasForeignKey(t => t.TargetCategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.AwardedBid)
            .WithMany()
            .HasForeignKey(t => t.AwardedBidId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.Items)
            .WithOne(ti => ti.Tender)
            .HasForeignKey(ti => ti.TenderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.Bids)
            .WithOne(b => b.Tender)
            .HasForeignKey(b => b.TenderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class TenderItemConfiguration : IEntityTypeConfiguration<TenderItem>
{
    public void Configure(EntityTypeBuilder<TenderItem> builder)
    {
        builder.ToTable("TenderItems");

        builder.HasKey(ti => ti.Id);

        builder.Property(ti => ti.MaterialName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(ti => ti.Specifications)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(ti => ti.Quantity)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(ti => ti.TargetPricePerUnit)
            .HasPrecision(18, 2);

        builder.Property(ti => ti.Notes)
            .HasMaxLength(500);

        builder.HasIndex(ti => ti.TenderId);

        builder.HasOne(ti => ti.Category)
            .WithMany()
            .HasForeignKey(ti => ti.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ti => ti.Material)
            .WithMany()
            .HasForeignKey(ti => ti.MaterialId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(ti => ti.UnitOfMeasure)
            .WithMany()
            .HasForeignKey(ti => ti.UnitOfMeasureId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class BidConfiguration : IEntityTypeConfiguration<Bid>
{
    public void Configure(EntityTypeBuilder<Bid> builder)
    {
        builder.ToTable("Bids");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.BidNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(b => b.BidNumber)
            .IsUnique();

        builder.Property(b => b.TotalAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(b => b.Currency)
            .HasMaxLength(3)
            .HasDefaultValue("EGP")
            .IsRequired();

        builder.Property(b => b.PaymentTerms)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(b => b.Notes)
            .HasMaxLength(1000);

        builder.Property(b => b.ChangeSummary)
            .HasMaxLength(1000);

        builder.Property(b => b.RejectionReason)
            .HasMaxLength(500);

        builder.Property(b => b.WithdrawalReason)
            .HasMaxLength(500);

        builder.Property(b => b.CreatedBy)
            .HasMaxLength(100);

        builder.Property(b => b.LastModifiedBy)
            .HasMaxLength(100);

        builder.Property(b => b.RowVersion)
            .IsRowVersion();

        // Indexes
        builder.HasIndex(b => b.TenderId);
        builder.HasIndex(b => b.SupplierCompanyId);
        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => new { b.TenderId, b.SupplierCompanyId, b.RevisionNumber });

        builder.HasOne(b => b.SupplierCompany)
            .WithMany()
            .HasForeignKey(b => b.SupplierCompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.OriginalBid)
            .WithMany(ob => ob.Revisions)
            .HasForeignKey(b => b.OriginalBidId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(b => b.Items)
            .WithOne(bi => bi.Bid)
            .HasForeignKey(bi => bi.BidId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class BidItemConfiguration : IEntityTypeConfiguration<BidItem>
{
    public void Configure(EntityTypeBuilder<BidItem> builder)
    {
        builder.ToTable("BidItems");

        builder.HasKey(bi => bi.Id);

        builder.Property(bi => bi.UnitPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(bi => bi.Quantity)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(bi => bi.TotalPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(bi => bi.Notes)
            .HasMaxLength(500);

        builder.HasIndex(bi => bi.BidId);
        builder.HasIndex(bi => bi.TenderItemId);

        builder.HasOne(bi => bi.TenderItem)
            .WithMany()
            .HasForeignKey(bi => bi.TenderItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
