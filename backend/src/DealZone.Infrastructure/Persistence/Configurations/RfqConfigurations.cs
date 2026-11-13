using DealZone.Domain.Rfqs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DealZone.Infrastructure.Persistence.Configurations;

public class RfqConfiguration : IEntityTypeConfiguration<Rfq>
{
    public void Configure(EntityTypeBuilder<Rfq> builder)
    {
        builder.ToTable("Rfqs");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.RfqNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(r => r.RfqNumber)
            .IsUnique();

        builder.Property(r => r.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(r => r.Description)
            .HasMaxLength(2000);

        builder.Property(r => r.DeliveryGovernorate)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(r => r.DeliveryCity)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(r => r.DeliveryAddress)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(r => r.TargetBudget)
            .HasPrecision(18, 2);

        builder.Property(r => r.Currency)
            .HasMaxLength(10)
            .HasDefaultValue("EGP");

        builder.Property(r => r.Notes)
            .HasMaxLength(2000);

        builder.Property(r => r.AwardRationale)
            .HasMaxLength(1000);

        builder.Property(r => r.CancellationReason)
            .HasMaxLength(500);

        builder.Property(r => r.CreatedBy)
            .HasMaxLength(100);

        builder.Property(r => r.LastModifiedBy)
            .HasMaxLength(100);

        builder.Property(r => r.DeletedBy)
            .HasMaxLength(100);

        builder.Property(r => r.IsDeleted)
            .HasDefaultValue(false);

        builder.Property(r => r.RowVersion)
            .IsRowVersion();

        builder.HasIndex(r => r.BuyerCompanyId);
        builder.HasIndex(r => new { r.Status, r.ClosingDateUtc });
        builder.HasIndex(r => new { r.DeliveryGovernorate, r.DeliveryCity });
        builder.HasIndex(r => r.TargetCategoryId);

        builder.HasQueryFilter(r => !r.IsDeleted);

        builder.HasOne(r => r.BuyerCompany)
            .WithMany()
            .HasForeignKey(r => r.BuyerCompanyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.TargetCategory)
            .WithMany()
            .HasForeignKey(r => r.TargetCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.AwardedOffer)
            .WithMany()
            .HasForeignKey(r => r.AwardedOfferId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Items)
            .WithOne(i => i.Rfq)
            .HasForeignKey(i => i.RfqId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RfqItemConfiguration : IEntityTypeConfiguration<RfqItem>
{
    public void Configure(EntityTypeBuilder<RfqItem> builder)
    {
        builder.ToTable("RfqItems");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.MaterialName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(i => i.Specifications)
            .HasMaxLength(1500)
            .IsRequired();

        builder.Property(i => i.Quantity)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(i => i.TargetPricePerUnit)
            .HasPrecision(18, 2);

        builder.Property(i => i.Notes)
            .HasMaxLength(1000);

        builder.HasOne(i => i.Category)
            .WithMany()
            .HasForeignKey(i => i.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Material)
            .WithMany()
            .HasForeignKey(i => i.MaterialId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.UnitOfMeasure)
            .WithMany()
            .HasForeignKey(i => i.UnitOfMeasureId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(i => !i.Rfq.IsDeleted);
    }
}
