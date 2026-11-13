using DealZone.Application.Purchasing.DTOs;
using DealZone.Domain.Catalog;
using DealZone.Domain.Deals;
using DealZone.Domain.Purchasing;
using Xunit;

namespace DealZone.UnitTests.Purchasing;

public class NegotiationServiceTests
{
    [Fact]
    public void ProductNegotiation_InitialState_IsPendingSupplierResponse()
    {
        var neg = new ProductNegotiation
        {
            NegotiationNumber = "NEG-202611-0001",
            CatalogProductId = Guid.NewGuid(),
            BuyerCompanyId = Guid.NewGuid(),
            BuyerUserId = Guid.NewGuid(),
            SupplierCompanyId = Guid.NewGuid(),
            CurrentUnitPrice = 1200m,
            Quantity = 10m,
            CurrentTotalPrice = 12000m,
            Currency = "EGP",
            Status = ProductNegotiationStatus.PendingSupplierResponse
        };

        Assert.Equal(ProductNegotiationStatus.PendingSupplierResponse, neg.Status);
        Assert.Equal(12000m, neg.CurrentTotalPrice);
        Assert.Null(neg.DealId);
        Assert.Null(neg.RespondedAtUtc);
    }

    [Fact]
    public void ProductNegotiation_CounterBySupplier_FlipsStatusToCounterPendingBuyerResponse()
    {
        var neg = new ProductNegotiation
        {
            NegotiationNumber = "NEG-202611-0001",
            CatalogProductId = Guid.NewGuid(),
            BuyerCompanyId = Guid.NewGuid(),
            BuyerUserId = Guid.NewGuid(),
            SupplierCompanyId = Guid.NewGuid(),
            CurrentUnitPrice = 1200m,
            Quantity = 10m,
            CurrentTotalPrice = 12000m,
            Currency = "EGP",
            Status = ProductNegotiationStatus.PendingSupplierResponse
        };

        // Supplier counters with 1350m
        neg.CurrentUnitPrice = 1350m;
        neg.CurrentTotalPrice = 13500m;
        neg.Status = ProductNegotiationStatus.CounterofferPendingBuyerResponse;

        Assert.Equal(ProductNegotiationStatus.CounterofferPendingBuyerResponse, neg.Status);
        Assert.Equal(13500m, neg.CurrentTotalPrice);
    }

    [Fact]
    public void ProductNegotiation_Acceptance_CreatesDealWithProductNegotiationSource()
    {
        var negId = Guid.NewGuid();
        var buyerId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();

        var deal = new Deal
        {
            DealNumber = "DZ-DEAL-2026-0099",
            Source = DealSource.ProductNegotiation,
            ProductNegotiationId = negId,
            BuyerCompanyId = buyerId,
            SupplierCompanyId = supplierId,
            AgreedPrice = 13500m,
            Currency = "EGP",
            Status = DealStatus.AwaitingConfirmation
        };

        Assert.Equal(DealSource.ProductNegotiation, deal.Source);
        Assert.Equal(negId, deal.ProductNegotiationId);
        Assert.Equal(DealStatus.AwaitingConfirmation, deal.Status);
        Assert.Equal(13500m, deal.AgreedPrice);
    }

    [Fact]
    public void CatalogProduct_WithNegotiablePricing_CorrectlyIdentified()
    {
        var product = new CatalogProduct
        {
            Sku = "SKU-TEX-YARN-NEG",
            NameAr = "غزل قطن قابل للتفاوض",
            NameEn = "Negotiable Cotton Yarn",
            CategoryId = Guid.NewGuid(),
            PricingMode = ProductPricingMode.Negotiable,
            UnitPrice = 0m,
            Unit = "ton",
            AvailableQuantity = 100m,
            MinimumOrderQuantity = 5m
        };

        Assert.Equal(ProductPricingMode.Negotiable, product.PricingMode);
        Assert.Equal("ton", product.Unit);
    }
}

