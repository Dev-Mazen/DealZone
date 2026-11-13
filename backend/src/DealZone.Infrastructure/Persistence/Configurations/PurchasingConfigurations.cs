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


public class ProductNegotiationConfiguration : IEntityTypeConfiguration<ProductNegotiation>
{
    public void Configure(EntityTypeBuilder<ProductNegotiation> builder)
    {
        builder.ToTable("ProductNegotiations");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.NegotiationNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(n => n.NegotiationNumber)
            .IsUnique();

        builder.Property(n => n.CurrentUnitPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(n => n.Quantity)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(n => n.CurrentTotalPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(n => n.Currency)
            .HasMaxLength(3)
            .HasDefaultValue("EGP")
            .IsRequired();

        builder.Property(n => n.DeliveryAddress)
            .HasMaxLength(500);

        builder.Property(n => n.Notes)
            .HasMaxLength(1000);

        builder.Property(n => n.RejectionReason)
            .HasMaxLength(500);

        builder.Property(n => n.CreatedBy)
            .HasMaxLength(100);

        builder.Property(n => n.LastModifiedBy)
            .HasMaxLength(100);

        builder.Property(n => n.RowVersion)
            .IsRowVersion();

        builder.HasIndex(n => n.BuyerCompanyId);
        builder.HasIndex(n => n.SupplierCompanyId);
        builder.HasIndex(n => n.CatalogProductId);
        builder.HasIndex(n => n.Status);

        builder.HasOne(n => n.CatalogProduct)
            .WithMany()
            .HasForeignKey(n => n.CatalogProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.BuyerCompany)
            .WithMany()
            .HasForeignKey(n => n.BuyerCompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.BuyerUser)
            .WithMany()
            .HasForeignKey(n => n.BuyerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.SupplierCompany)
            .WithMany()
            .HasForeignKey(n => n.SupplierCompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(n => n.Revisions)
            .WithOne(r => r.Negotiation)
            .HasForeignKey(r => r.NegotiationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductNegotiationRevisionConfiguration : IEntityTypeConfiguration<ProductNegotiationRevision>
{
    public void Configure(EntityTypeBuilder<ProductNegotiationRevision> builder)
    {
        builder.ToTable("ProductNegotiationRevisions");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.UnitPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(r => r.Quantity)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(r => r.TotalPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(r => r.Notes)
            .HasMaxLength(1000);

        builder.HasIndex(r => r.NegotiationId);
    }
}
