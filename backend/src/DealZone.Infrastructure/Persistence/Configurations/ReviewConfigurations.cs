using DealZone.Domain.Reviews;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DealZone.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("Reviews");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Comment)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(r => r.Rating)
            .IsRequired();

        builder.Property(r => r.IsDeleted)
            .HasDefaultValue(false);

        builder.Property(r => r.DeletedBy)
            .HasMaxLength(100);

        builder.HasIndex(r => new { r.DealId, r.ReviewerCompanyId })
            .IsUnique();

        builder.HasIndex(r => r.TargetCompanyId);

        builder.HasQueryFilter(r => !r.IsDeleted);

        builder.HasOne(r => r.Deal)
            .WithMany()
            .HasForeignKey(r => r.DealId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ReviewerCompany)
            .WithMany()
            .HasForeignKey(r => r.ReviewerCompanyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.TargetCompany)
            .WithMany()
            .HasForeignKey(r => r.TargetCompanyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
