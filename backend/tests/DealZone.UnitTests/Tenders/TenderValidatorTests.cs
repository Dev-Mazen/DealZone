using DealZone.Application.Tenders.DTOs;
using DealZone.Application.Tenders.Validators;
using DealZone.Domain.Rfqs;
using DealZone.Domain.Tenders;
using FluentValidation.TestHelper;
using Xunit;

namespace DealZone.UnitTests.Tenders;

public class TenderValidatorTests
{
    private readonly CreateTenderRequestValidator _createTenderValidator = new();
    private readonly SubmitBidRequestValidator _submitBidValidator = new();
    private readonly ReviseBidRequestValidator _reviseBidValidator = new();
    private readonly CancelTenderRequestValidator _cancelTenderValidator = new();
    private readonly WithdrawBidRequestValidator _withdrawBidValidator = new();

    [Fact]
    public void CreateTender_ValidRequest_PassesValidation()
    {
        var request = new CreateTenderRequest(
            Title: "Supply 500 MT Steel Rebar",
            Description: "Grade B500D required",
            TargetCategoryId: Guid.NewGuid(),
            DeliveryGovernorate: "Cairo",
            DeliveryCity: "Helwan",
            DeliveryAddress: "Industrial Zone Plot 44",
            RequiredDeliveryDateUtc: DateTimeOffset.UtcNow.AddDays(30),
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            ReferencePrice: 25000000m,
            Notes: "Informational reference price",
            Items: new List<CreateTenderItemRequest>
            {
                new(
                    CategoryId: Guid.NewGuid(),
                    MaterialId: null,
                    MaterialName: "Steel Rebar B500D 16mm",
                    Specifications: "Tensile strength >= 500 MPa",
                    Quantity: 500,
                    Unit: MaterialUnit.MetricTon,
                    UnitOfMeasureId: null,
                    TargetPricePerUnit: 50000m,
                    Notes: null)
            });

        var result = _createTenderValidator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void CreateTender_EmptyItems_FailsValidation()
    {
        var request = new CreateTenderRequest(
            Title: "Supply 500 MT Steel Rebar",
            Description: null,
            TargetCategoryId: null,
            DeliveryGovernorate: "Cairo",
            DeliveryCity: "Helwan",
            DeliveryAddress: "Industrial Zone",
            RequiredDeliveryDateUtc: null,
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            ReferencePrice: null,
            Notes: null,
            Items: new List<CreateTenderItemRequest>());

        var result = _createTenderValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Items);
    }

    [Fact]
    public void CreateTender_PastClosingDate_FailsValidation()
    {
        var request = new CreateTenderRequest(
            Title: "Supply 500 MT Steel Rebar",
            Description: null,
            TargetCategoryId: null,
            DeliveryGovernorate: "Cairo",
            DeliveryCity: "Helwan",
            DeliveryAddress: "Industrial Zone",
            RequiredDeliveryDateUtc: null,
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(-1),
            ReferencePrice: null,
            Notes: null,
            Items: new List<CreateTenderItemRequest>
            {
                new(
                    CategoryId: Guid.NewGuid(),
                    MaterialId: null,
                    MaterialName: "Rebar",
                    Specifications: "Standard",
                    Quantity: 10,
                    Unit: MaterialUnit.MetricTon,
                    UnitOfMeasureId: null,
                    TargetPricePerUnit: null,
                    Notes: null)
            });

        var result = _createTenderValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.ClosingDateUtc);
    }

    [Fact]
    public void SubmitBid_PastValidityDate_FailsValidation()
    {
        var request = new SubmitBidRequest(
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(-1),
            DeliveryLeadTimeDays: 14,
            ShippingIncluded: true,
            PaymentTerms: "Net 30",
            Notes: null,
            Items: new List<SubmitBidItemRequest>
            {
                new(Guid.NewGuid(), 48000m, null)
            });

        var result = _submitBidValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.ValidityDateUtc);
    }

    [Fact]
    public void SubmitBid_ZeroOrNegativeUnitPrice_FailsValidation()
    {
        var request = new SubmitBidRequest(
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            DeliveryLeadTimeDays: 14,
            ShippingIncluded: true,
            PaymentTerms: "Net 30",
            Notes: null,
            Items: new List<SubmitBidItemRequest>
            {
                new(Guid.NewGuid(), 0m, null)
            });

        var result = _submitBidValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor("Items[0].UnitPrice");
    }

    [Fact]
    public void CancelTender_EmptyReason_FailsValidation()
    {
        var request = new CancelTenderRequest("");
        var result = _cancelTenderValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Reason);
    }

    [Fact]
    public void WithdrawBid_EmptyReason_FailsValidation()
    {
        var request = new WithdrawBidRequest("");
        var result = _withdrawBidValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Reason);
    }
}
