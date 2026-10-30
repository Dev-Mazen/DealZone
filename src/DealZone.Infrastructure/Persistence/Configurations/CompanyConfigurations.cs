using DealZone.Domain.Companies;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DealZone.Infrastructure.Persistence.Configurations;

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Companies");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.LegalName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(c => c.TradeName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(c => c.IndustrySector)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.City)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.Governorate)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.Description)
            .HasMaxLength(1000);

        builder.Property(c => c.Website)
            .HasMaxLength(255);

        builder.Property(c => c.RejectionReason)
            .HasMaxLength(500);

        builder.Property(c => c.CreatedBy)
            .HasMaxLength(100);

        builder.Property(c => c.LastModifiedBy)
            .HasMaxLength(100);

        builder.Property(c => c.DeletedBy)
            .HasMaxLength(100);

        builder.Property(c => c.IsActive)
            .HasDefaultValue(true);

        builder.Property(c => c.IsDeleted)
            .HasDefaultValue(false);

        builder.Property(c => c.RowVersion)
            .IsRowVersion();

        builder.HasIndex(c => c.VerificationStatus);
        builder.HasIndex(c => c.Governorate);

        builder.HasQueryFilter(c => !c.IsDeleted);

        builder.HasOne(c => c.PrimaryContactUser)
            .WithMany()
            .HasForeignKey(c => c.PrimaryContactUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.VerifiedByUser)
            .WithMany()
            .HasForeignKey(c => c.VerifiedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.ContactDetails)
            .WithOne(cd => cd.Company)
            .HasForeignKey<CompanyContactDetails>(cd => cd.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Members)
            .WithOne(m => m.Company)
            .HasForeignKey(m => m.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.VerificationDocuments)
            .WithOne(d => d.Company)
            .HasForeignKey(d => d.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CompanyContactDetailsConfiguration : IEntityTypeConfiguration<CompanyContactDetails>
{
    public void Configure(EntityTypeBuilder<CompanyContactDetails> builder)
    {
        builder.ToTable("CompanyContactDetails");

        builder.HasKey(cd => cd.CompanyId);

        builder.Property(cd => cd.TaxIdNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(cd => cd.TaxIdNumber)
            .IsUnique();

        builder.Property(cd => cd.CommercialRegistrationNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(cd => cd.CommercialRegistrationNumber)
            .IsUnique();

        builder.Property(cd => cd.CorporateEmail)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(cd => cd.CorporatePhone)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(cd => cd.AddressLine1)
            .HasMaxLength(250)
            .IsRequired();

        builder.Property(cd => cd.AddressLine2)
            .HasMaxLength(250);

        builder.Property(cd => cd.PostalCode)
            .HasMaxLength(20);

        builder.HasQueryFilter(cd => !cd.Company.IsDeleted);
    }
}

public class CompanyMemberConfiguration : IEntityTypeConfiguration<CompanyMember>
{
    public void Configure(EntityTypeBuilder<CompanyMember> builder)
    {
        builder.ToTable("CompanyMembers");

        builder.HasKey(m => m.Id);

        builder.HasIndex(m => new { m.CompanyId, m.UserId })
            .IsUnique();

        builder.Property(m => m.IsActive)
            .HasDefaultValue(true);

        builder.Property(m => m.IsPrimary)
            .HasDefaultValue(false);

        builder.HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(m => !m.Company.IsDeleted);
    }
}

public class VerificationDocumentConfiguration : IEntityTypeConfiguration<VerificationDocument>
{
    public void Configure(EntityTypeBuilder<VerificationDocument> builder)
    {
        builder.ToTable("VerificationDocuments");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.FileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(d => d.StorageKey)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(d => d.ContentType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(d => d.RejectionReason)
            .HasMaxLength(500);

        builder.HasOne(d => d.ReviewedByUser)
            .WithMany()
            .HasForeignKey(d => d.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.UploadedByUser)
            .WithMany()
            .HasForeignKey(d => d.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(d => !d.Company.IsDeleted);
    }
}

public class VerificationDecisionConfiguration : IEntityTypeConfiguration<VerificationDecision>
{
    public void Configure(EntityTypeBuilder<VerificationDecision> builder)
    {
        builder.ToTable("VerificationDecisions");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Reason)
            .HasMaxLength(1000);

        builder.Property(d => d.DecidedAtUtc)
            .IsRequired();

        builder.HasOne(d => d.Company)
            .WithMany(c => c.VerificationDecisions)
            .HasForeignKey(d => d.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.ReviewedByUser)
            .WithMany()
            .HasForeignKey(d => d.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(d => !d.Company.IsDeleted);
    }
}
