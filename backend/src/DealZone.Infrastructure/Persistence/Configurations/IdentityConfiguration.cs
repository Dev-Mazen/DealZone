using DealZone.Domain.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DealZone.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.FullName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(u => u.PhoneNumber)
            .HasMaxLength(30);

        builder.Property(u => u.PasswordHash)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(u => u.IsSystemAdmin)
            .HasDefaultValue(false);

        builder.Property(u => u.IsActive)
            .HasDefaultValue(true);

        builder.Property(u => u.IsEmailConfirmed)
            .HasDefaultValue(false);

        builder.Property(u => u.PreferredLanguage)
            .HasMaxLength(10)
            .HasDefaultValue("ar");

        builder.Property(u => u.EmailConfirmationTokenHash)
            .HasMaxLength(128);

        builder.Property(u => u.PasswordResetTokenHash)
            .HasMaxLength(128);

        builder.HasMany(u => u.RefreshTokens)
            .WithOne(rt => rt.User)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        builder.HasKey(rt => rt.Id);

        builder.Property(rt => rt.TokenHash)
            .HasMaxLength(128)
            .IsRequired();

        builder.HasIndex(rt => rt.TokenHash);

        builder.HasIndex(rt => rt.UserId);

        builder.Property(rt => rt.CreatedByIp)
            .HasMaxLength(50);

        builder.Property(rt => rt.RevokedByIp)
            .HasMaxLength(50);

        builder.Property(rt => rt.ReplacedByTokenHash)
            .HasMaxLength(128);

        builder.Property(rt => rt.ReasonRevoked)
            .HasMaxLength(250);
    }
}

public class EmailVerificationConfiguration : IEntityTypeConfiguration<EmailVerification>
{
    public void Configure(EntityTypeBuilder<EmailVerification> builder)
    {
        builder.ToTable("EmailVerifications");

        builder.HasKey(ev => ev.Id);

        builder.Property(ev => ev.CodeHash)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(ev => ev.LinkTokenHash)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(ev => ev.IpAddress)
            .HasMaxLength(45);

        builder.HasOne(ev => ev.User)
            .WithMany()
            .HasForeignKey(ev => ev.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(ev => ev.UserId);
        builder.HasIndex(ev => ev.LinkTokenHash);
        builder.HasIndex(ev => new { ev.UserId, ev.CreatedAtUtc });
    }
}


