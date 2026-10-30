namespace DealZone.Domain.Companies;

public class CompanyContactDetails
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string TaxIdNumber { get; set; } = string.Empty;
    public string CommercialRegistrationNumber { get; set; } = string.Empty;
    public string CorporateEmail { get; set; } = string.Empty;
    public string CorporatePhone { get; set; } = string.Empty;
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string? PostalCode { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastModifiedAtUtc { get; set; }
}

