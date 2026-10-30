using DealZone.Domain.Shipping;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DealZone.Infrastructure.Persistence.Configurations;

public class ShippingProviderConfiguration : IEntityTypeConfiguration<ShippingProvider>
{
    public void Configure(EntityTypeBuilder<ShippingProvider> builder)
    {
        builder.ToTable("ShippingProviders");

        builder.HasKey(sp => sp.Id);

        builder.Property(sp => sp.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.HasIndex(sp => sp.Name)
            .IsUnique();

        builder.Property(sp => sp.ContactPerson)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(sp => sp.Phone)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(sp => sp.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(sp => sp.SupportedGovernorates)
            .HasMaxLength(500);

        builder.Property(sp => sp.IsActive)
            .HasDefaultValue(true);
    }
}

public class ShipmentConfiguration : IEntityTypeConfiguration<Shipment>
{
    public void Configure(EntityTypeBuilder<Shipment> builder)
    {
        builder.ToTable("Shipments");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.ShipmentNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(s => s.ShipmentNumber)
            .IsUnique();

        builder.Property(s => s.TrackingNumber)
            .HasMaxLength(100);

        builder.Property(s => s.CarrierName)
            .HasMaxLength(150);

        builder.Property(s => s.PickupAddress)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(s => s.DeliveryAddress)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(s => s.Notes)
            .HasMaxLength(1000);

        builder.Property(s => s.TrackingEventsJson)
            .IsRequired();

        builder.Property(s => s.CreatedBy)
            .HasMaxLength(100);

        builder.Property(s => s.LastModifiedBy)
            .HasMaxLength(100);

        builder.Property(s => s.RowVersion)
            .IsRowVersion();

        builder.HasIndex(s => s.DealId);
        builder.HasIndex(s => s.Status);

        builder.HasOne(s => s.Deal)
            .WithMany()
            .HasForeignKey(s => s.DealId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.ShippingProvider)
            .WithMany()
            .HasForeignKey(s => s.ShippingProviderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
