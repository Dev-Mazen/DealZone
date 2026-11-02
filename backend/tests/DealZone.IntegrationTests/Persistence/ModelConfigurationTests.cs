using DealZone.Domain.Catalog;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Identity;
using DealZone.Domain.Offers;
using DealZone.Domain.Reviews;
using DealZone.Domain.Rfqs;
using DealZone.Domain.Shipping;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace DealZone.IntegrationTests.Persistence;

public class ModelConfigurationTests
{
    private readonly DealZoneDbContext _context;

    public ModelConfigurationTests()
    {
        var options = new DbContextOptionsBuilder<DealZoneDbContext>()
            .UseSqlServer("Server=localhost;Database=DealZoneTestDb;Trusted_Connection=True;TrustServerCertificate=True;")
            .Options;

        _context = new DealZoneDbContext(options);
    }

    [Fact]
    public void Model_ShouldRegisterAllCoreEntities()
    {
        var model = _context.Model;

        var expectedEntities = new[]
        {
            typeof(User),
            typeof(Company),
            typeof(CompanyContactDetails),
            typeof(CompanyMember),
            typeof(VerificationDocument),
            typeof(MaterialCategory),
            typeof(Rfq),
            typeof(RfqItem),
            typeof(Offer),
            typeof(OfferItem),
            typeof(Deal),
            typeof(DealDispute),
            typeof(ShippingProvider),
            typeof(Shipment),
            typeof(Review)
        };

        foreach (var entityType in expectedEntities)
        {
            Assert.NotNull(model.FindEntityType(entityType));
        }
    }

    [Fact]
    public void Model_ShouldConfigureDecimalPrecisionsProperly()
    {
        var model = _context.Model;

        var rfqItemEntity = model.FindEntityType(typeof(RfqItem))!;
        var quantityProp = rfqItemEntity.FindProperty(nameof(RfqItem.Quantity))!;
        Assert.Equal(18, quantityProp.GetPrecision());
        Assert.Equal(4, quantityProp.GetScale());

        var offerItemEntity = model.FindEntityType(typeof(OfferItem))!;
        var offeredQtyProp = offerItemEntity.FindProperty(nameof(OfferItem.OfferedQuantity))!;
        Assert.Equal(18, offeredQtyProp.GetPrecision());
        Assert.Equal(4, offeredQtyProp.GetScale());

        var unitPriceProp = offerItemEntity.FindProperty(nameof(OfferItem.UnitPrice))!;
        Assert.Equal(18, unitPriceProp.GetPrecision());
        Assert.Equal(2, unitPriceProp.GetScale());

        var dealEntity = model.FindEntityType(typeof(Deal))!;
        var agreedPriceProp = dealEntity.FindProperty(nameof(Deal.AgreedPrice))!;
        Assert.Equal(18, agreedPriceProp.GetPrecision());
        Assert.Equal(2, agreedPriceProp.GetScale());
    }

    [Fact]
    public void Model_ShouldConfigureRequiredUniqueConstraints()
    {
        var model = _context.Model;

        // User email
        var userEntity = model.FindEntityType(typeof(User))!;
        var emailIndex = userEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(User.Email)));
        Assert.NotNull(emailIndex);
        Assert.True(emailIndex.IsUnique);

        // Company Contact Details (TIN and CRN)
        var contactDetailsEntity = model.FindEntityType(typeof(CompanyContactDetails))!;
        var tinIndex = contactDetailsEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(CompanyContactDetails.TaxIdNumber)));
        Assert.NotNull(tinIndex);
        Assert.True(tinIndex.IsUnique);

        var crnIndex = contactDetailsEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(CompanyContactDetails.CommercialRegistrationNumber)));
        Assert.NotNull(crnIndex);
        Assert.True(crnIndex.IsUnique);

        // Company Member (CompanyId, UserId)
        var memberEntity = model.FindEntityType(typeof(CompanyMember))!;
        var memberIndex = memberEntity.GetIndexes().FirstOrDefault(i =>
            i.Properties.Count == 2 &&
            i.Properties.Any(p => p.Name == nameof(CompanyMember.CompanyId)) &&
            i.Properties.Any(p => p.Name == nameof(CompanyMember.UserId)));
        Assert.NotNull(memberIndex);
        Assert.True(memberIndex.IsUnique);

        // RFQ Number
        var rfqEntity = model.FindEntityType(typeof(Rfq))!;
        var rfqIndex = rfqEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Rfq.RfqNumber)));
        Assert.NotNull(rfqIndex);
        Assert.True(rfqIndex.IsUnique);

        // Offer revision uniqueness: (RfqId, SupplierCompanyId, RevisionNumber)
        var offerEntity = model.FindEntityType(typeof(Offer))!;
        var offerRevisionIndex = offerEntity.GetIndexes().FirstOrDefault(i =>
            i.Properties.Count == 3 &&
            i.Properties.Any(p => p.Name == nameof(Offer.RfqId)) &&
            i.Properties.Any(p => p.Name == nameof(Offer.SupplierCompanyId)) &&
            i.Properties.Any(p => p.Name == nameof(Offer.RevisionNumber)));
        Assert.NotNull(offerRevisionIndex);
        Assert.True(offerRevisionIndex.IsUnique);

        // Deal: OfferId is unique (one deal per offer)
        var dealEntity = model.FindEntityType(typeof(Deal))!;
        var dealOfferIndex = dealEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Deal.OfferId)));
        Assert.NotNull(dealOfferIndex);
        Assert.True(dealOfferIndex.IsUnique);

        // Review: (DealId, ReviewerCompanyId) is unique
        var reviewEntity = model.FindEntityType(typeof(Review))!;
        var reviewIndex = reviewEntity.GetIndexes().FirstOrDefault(i =>
            i.Properties.Count == 2 &&
            i.Properties.Any(p => p.Name == nameof(Review.DealId)) &&
            i.Properties.Any(p => p.Name == nameof(Review.ReviewerCompanyId)));
        Assert.NotNull(reviewIndex);
        Assert.True(reviewIndex.IsUnique);
    }

    [Fact]
    public void Model_ShouldConfigureConcurrencyTokensOnCommercialEntities()
    {
        var model = _context.Model;

        var commercialEntities = new[]
        {
            typeof(Company),
            typeof(Rfq),
            typeof(Offer),
            typeof(Deal),
            typeof(Shipment)
        };

        foreach (var entityType in commercialEntities)
        {
            var entity = model.FindEntityType(entityType)!;
            var rowVersionProp = entity.FindProperty("RowVersion");
            Assert.NotNull(rowVersionProp);
            Assert.True(rowVersionProp.IsConcurrencyToken);
        }
    }

    [Fact]
    public void Model_ShouldConfigureCascadesAndRestrictDeletesProperly()
    {
        var model = _context.Model;

        // Line items should cascade on header deletion
        var rfqItemEntity = model.FindEntityType(typeof(RfqItem))!;
        var rfqItemFk = rfqItemEntity.GetForeignKeys().First(fk => fk.PrincipalEntityType.ClrType == typeof(Rfq));
        Assert.Equal(DeleteBehavior.Cascade, rfqItemFk.DeleteBehavior);

        var offerItemEntity = model.FindEntityType(typeof(OfferItem))!;
        var offerItemFk = offerItemEntity.GetForeignKeys().First(fk => fk.PrincipalEntityType.ClrType == typeof(Offer));
        Assert.Equal(DeleteBehavior.Cascade, offerItemFk.DeleteBehavior);

        // Commercial references should be restricted
        var dealEntity = model.FindEntityType(typeof(Deal))!;
        var buyerCompanyFk = dealEntity.GetForeignKeys().First(fk => fk.Properties.Any(p => p.Name == nameof(Deal.BuyerCompanyId)));
        Assert.Equal(DeleteBehavior.Restrict, buyerCompanyFk.DeleteBehavior);

        var supplierCompanyFk = dealEntity.GetForeignKeys().First(fk => fk.Properties.Any(p => p.Name == nameof(Deal.SupplierCompanyId)));
        Assert.Equal(DeleteBehavior.Restrict, supplierCompanyFk.DeleteBehavior);
    }
}

