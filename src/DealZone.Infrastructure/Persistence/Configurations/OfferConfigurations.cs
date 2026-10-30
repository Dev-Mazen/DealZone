using DealZone.Domain.Offers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DealZone.Infrastructure.Persistence.Configurations;

public class OfferConfiguration : IEntityTypeConfiguration<Offer>
{
    public void Configure(EntityTypeBuilder<Offer> builder)
    {
        builder.ToTable("Offers");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.OfferNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(o => o.OfferNumber)
            .IsUnique();

        builder.HasIndex(o => new { o.RfqId, o.SupplierCompanyId, o.RevisionNumber })
            .IsUnique();

        builder.HasIndex(o => o.RfqId)
            .IsUnique()
            .HasFilter("[Status] = 2");

        builder.Property(o => o.TotalAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(o => o.Currency)
            .HasMaxLength(3)
            .HasDefaultValue("EGP")
            .IsRequired();

        builder.Property(o => o.PaymentTerms)
            .HasMaxLength(250)
            .IsRequired();

        builder.Property(o => o.Notes)
            .HasMaxLength(1000);

        builder.Property(o => o.ChangeSummary)
            .HasMaxLength(1000);

        builder.Property(o => o.RejectionReason)
            .HasMaxLength(1000);

        builder.Property(o => o.CreatedBy)
            .HasMaxLength(100);

        builder.Property(o => o.LastModifiedBy)
            .HasMaxLength(100);

        builder.Property(o => o.ShippingIncluded)
            .HasDefaultValue(false);

        builder.Property(o => o.RevisionNumber)
            .HasDefaultValue(1);

        builder.Property(o => o.RowVersion)
            .IsRowVersion();

        builder.HasIndex(o => o.SupplierCompanyId);
        builder.HasIndex(o => o.Status);

        builder.HasOne(o => o.Rfq)
            .WithMany(r => r.Offers)
            .HasForeignKey(o => o.RfqId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.SupplierCompany)
            .WithMany()
            .HasForeignKey(o => o.SupplierCompanyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.OriginalOffer)
            .WithMany(o => o.Revisions)
            .HasForeignKey(o => o.OriginalOfferId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Items)
            .WithOne(i => i.Offer)
            .HasForeignKey(i => i.OfferId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OfferItemConfiguration : IEntityTypeConfiguration<OfferItem>
{
    public void Configure(EntityTypeBuilder<OfferItem> builder)
    {
        builder.ToTable("OfferItems");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.UnitPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(i => i.OfferedQuantity)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(i => i.TotalPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(i => i.MaterialSpecifications)
            .HasMaxLength(1500);

        builder.Property(i => i.Notes)
            .HasMaxLength(500);

        builder.HasOne(i => i.RfqItem)
            .WithMany()
            .HasForeignKey(i => i.RfqItemId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
