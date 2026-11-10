using DealZone.Domain.Purchasing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DealZone.Infrastructure.Persistence.Configurations;

public class DirectPurchaseConfiguration : IEntityTypeConfiguration<DirectPurchase>
{
    public void Configure(EntityTypeBuilder<DirectPurchase> builder)
    {
        builder.ToTable("DirectPurchases");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.PurchaseNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(p => p.PurchaseNumber)
            .IsUnique();

        builder.Property(p => p.Quantity)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(p => p.UnitPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(p => p.TotalPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(p => p.Currency)
            .HasMaxLength(3)
            .HasDefaultValue("EGP")
            .IsRequired();

        builder.Property(p => p.DeliveryAddress)
            .HasMaxLength(500);

        builder.Property(p => p.Notes)
            .HasMaxLength(1000);

        builder.Property(p => p.ProductSnapshotJson)
            .IsRequired();

        builder.Property(p => p.CreatedBy)
            .HasMaxLength(100);

        builder.Property(p => p.LastModifiedBy)
            .HasMaxLength(100);

        builder.Property(p => p.RowVersion)
            .IsRowVersion();

        builder.HasIndex(p => p.BuyerCompanyId);
        builder.HasIndex(p => p.SupplierCompanyId);
        builder.HasIndex(p => p.CatalogProductId);
        builder.HasIndex(p => p.Status);

        builder.HasOne(p => p.BuyerCompany)
            .WithMany()
            .HasForeignKey(p => p.BuyerCompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.SupplierCompany)
            .WithMany()
            .HasForeignKey(p => p.SupplierCompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.BuyerUser)
            .WithMany()
            .HasForeignKey(p => p.BuyerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.CatalogProduct)
            .WithMany()
            .HasForeignKey(p => p.CatalogProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
