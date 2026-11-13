using DealZone.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DealZone.Infrastructure.Persistence.Configurations;

public class MaterialCategoryConfiguration : IEntityTypeConfiguration<MaterialCategory>
{
    public void Configure(EntityTypeBuilder<MaterialCategory> builder)
    {
        builder.ToTable("MaterialCategories");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(c => c.Code)
            .IsUnique();

        builder.Property(c => c.NameAr)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(c => c.NameEn)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(c => c.DescriptionAr)
            .HasMaxLength(500);

        builder.Property(c => c.DescriptionEn)
            .HasMaxLength(500);

        builder.Property(c => c.DisplayOrder)
            .HasDefaultValue(0);

        builder.Property(c => c.IsActive)
            .HasDefaultValue(true);

        builder.Property(c => c.IsArchived)
            .HasDefaultValue(false);

        builder.HasOne(c => c.ParentCategory)
            .WithMany(c => c.SubCategories)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Materials)
            .WithOne(m => m.Category)
            .HasForeignKey(m => m.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class UnitOfMeasureConfiguration : IEntityTypeConfiguration<UnitOfMeasure>
{
    public void Configure(EntityTypeBuilder<UnitOfMeasure> builder)
    {
        builder.ToTable("UnitsOfMeasure");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Code)
            .HasMaxLength(20)
            .IsRequired();

        builder.HasIndex(u => u.Code)
            .IsUnique();

        builder.Property(u => u.NameAr)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(u => u.NameEn)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(u => u.SymbolAr)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(u => u.SymbolEn)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(u => u.IsActive)
            .HasDefaultValue(true);

        builder.Property(u => u.DisplayOrder)
            .HasDefaultValue(0);
    }
}

public class MaterialConfiguration : IEntityTypeConfiguration<Material>
{
    public void Configure(EntityTypeBuilder<Material> builder)
    {
        builder.ToTable("Materials");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(m => m.Code)
            .IsUnique();

        builder.Property(m => m.NameAr)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(m => m.NameEn)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(m => m.DescriptionAr)
            .HasMaxLength(1000);

        builder.Property(m => m.DescriptionEn)
            .HasMaxLength(1000);

        builder.Property(m => m.AttributesJson)
            .HasMaxLength(4000);

        builder.Property(m => m.IsActive)
            .HasDefaultValue(true);

        builder.Property(m => m.IsArchived)
            .HasDefaultValue(false);

        builder.Property(m => m.CreatedBy)
            .HasMaxLength(100);

        builder.Property(m => m.LastModifiedBy)
            .HasMaxLength(100);

        builder.HasIndex(m => m.CategoryId);
        builder.HasIndex(m => new { m.IsActive, m.IsArchived });

        builder.HasOne(m => m.Category)
            .WithMany(c => c.Materials)
            .HasForeignKey(m => m.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.DefaultUnit)
            .WithMany()
            .HasForeignKey(m => m.DefaultUnitId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CatalogProductConfiguration : IEntityTypeConfiguration<CatalogProduct>
{
    public void Configure(EntityTypeBuilder<CatalogProduct> builder)
    {
        builder.ToTable("CatalogProducts");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Sku)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(p => p.Sku);

        builder.Property(p => p.NameAr)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.NameEn)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.DescriptionAr)
            .HasMaxLength(1000);

        builder.Property(p => p.DescriptionEn)
            .HasMaxLength(1000);

        builder.Property(p => p.Specifications)
            .HasMaxLength(2000);

        builder.Property(p => p.PricingMode)
            .HasDefaultValue(ProductPricingMode.Fixed);

        builder.Property(p => p.UnitPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(p => p.Currency)
            .HasMaxLength(3)
            .HasDefaultValue("EGP")
            .IsRequired();

        builder.Property(p => p.Unit)
            .HasMaxLength(50)
            .HasDefaultValue("ton")
            .IsRequired();

        builder.Property(p => p.AvailableQuantity)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(p => p.MinimumOrderQuantity)
            .HasPrecision(18, 2)
            .HasDefaultValue(1m)
            .IsRequired();

        builder.Property(p => p.DeliveryLeadTimeDays)
            .HasDefaultValue(7)
            .IsRequired();

        builder.Property(p => p.ImageUrlsJson)
            .HasMaxLength(4000);

        builder.Property(p => p.IsActive)
            .HasDefaultValue(true);

        builder.Property(p => p.IsArchived)
            .HasDefaultValue(false);

        builder.Property(p => p.CreatedBy)
            .HasMaxLength(100);

        builder.Property(p => p.LastModifiedBy)
            .HasMaxLength(100);

        builder.Property(p => p.RowVersion)
            .IsRowVersion();

        builder.HasIndex(p => p.MaterialId);
        builder.HasIndex(p => p.CategoryId);
        builder.HasIndex(p => p.SupplierCompanyId);
        builder.HasIndex(p => new { p.IsActive, p.IsArchived });

        builder.HasOne(p => p.Material)
            .WithMany()
            .HasForeignKey(p => p.MaterialId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.SupplierCompany)
            .WithMany()
            .HasForeignKey(p => p.SupplierCompanyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

