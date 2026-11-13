using DealZone.Domain.Deals;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DealZone.Infrastructure.Persistence.Configurations;

public class DealConfiguration : IEntityTypeConfiguration<Deal>
{
    public void Configure(EntityTypeBuilder<Deal> builder)
    {
        builder.ToTable("Deals");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.DealNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(d => d.DealNumber)
            .IsUnique();

        builder.HasIndex(d => d.OfferId)
            .IsUnique()
            .HasFilter("[OfferId] IS NOT NULL");

        builder.HasIndex(d => d.TenderId)
            .IsUnique()
            .HasFilter("[TenderId] IS NOT NULL");

        builder.HasIndex(d => d.BidId)
            .IsUnique()
            .HasFilter("[BidId] IS NOT NULL");

        builder.HasIndex(d => d.RfqId)
            .IsUnique()
            .HasFilter("[RfqId] IS NOT NULL");

        builder.HasIndex(d => d.DirectPurchaseId)
            .IsUnique()
            .HasFilter("[DirectPurchaseId] IS NOT NULL");

        builder.HasIndex(d => d.ProductNegotiationId)
            .IsUnique()
            .HasFilter("[ProductNegotiationId] IS NOT NULL");

        builder.Property(d => d.AgreedPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(d => d.Currency)
            .HasMaxLength(3)
            .HasDefaultValue("EGP")
            .IsRequired();

        builder.Property(d => d.CancellationReason)
            .HasMaxLength(500);

        builder.Property(d => d.CancellationRequestReason)
            .HasMaxLength(500);

        builder.Property(d => d.DeliveryTerms)
            .HasMaxLength(500);

        builder.Property(d => d.CommercialTermsSnapshotJson)
            .IsRequired();

        builder.Property(d => d.CreatedBy)
            .HasMaxLength(100);

        builder.Property(d => d.LastModifiedBy)
            .HasMaxLength(100);

        builder.Property(d => d.RowVersion)
            .IsRowVersion();

        builder.HasIndex(d => d.BuyerCompanyId);
        builder.HasIndex(d => d.SupplierCompanyId);
        builder.HasIndex(d => d.Status);

        builder.HasOne(d => d.Rfq)
            .WithMany()
            .HasForeignKey(d => d.RfqId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Offer)
            .WithMany()
            .HasForeignKey(d => d.OfferId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Tender)
            .WithMany()
            .HasForeignKey(d => d.TenderId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Bid)
            .WithMany()
            .HasForeignKey(d => d.BidId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.DirectPurchase)
            .WithOne(dp => dp.Deal)
            .HasForeignKey<Deal>(d => d.DirectPurchaseId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.ProductNegotiation)
            .WithOne(pn => pn.Deal)
            .HasForeignKey<Deal>(d => d.ProductNegotiationId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.BuyerCompany)
            .WithMany()
            .HasForeignKey(d => d.BuyerCompanyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.SupplierCompany)
            .WithMany()
            .HasForeignKey(d => d.SupplierCompanyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(d => d.Disputes)
            .WithOne(dp => dp.Deal)
            .HasForeignKey(dp => dp.DealId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class DealDisputeConfiguration : IEntityTypeConfiguration<DealDispute>
{
    public void Configure(EntityTypeBuilder<DealDispute> builder)
    {
        builder.ToTable("DealDisputes");

        builder.HasKey(dp => dp.Id);

        builder.Property(dp => dp.Reason)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(dp => dp.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(dp => dp.ResolutionNotes)
            .HasMaxLength(2000);

        builder.HasIndex(dp => dp.DealId);
        builder.HasIndex(dp => dp.Status);

        builder.HasOne(dp => dp.OpenedByCompany)
            .WithMany()
            .HasForeignKey(dp => dp.OpenedByCompanyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(dp => dp.OpenedByUser)
            .WithMany()
            .HasForeignKey(dp => dp.OpenedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(dp => dp.ResolvedByUser)
            .WithMany()
            .HasForeignKey(dp => dp.ResolvedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
