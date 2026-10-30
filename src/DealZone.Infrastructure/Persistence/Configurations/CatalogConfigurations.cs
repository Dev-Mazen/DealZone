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

