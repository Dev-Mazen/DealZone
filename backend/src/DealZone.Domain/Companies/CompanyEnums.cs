namespace DealZone.Domain.Companies;

public enum CompanyType
{
    Buyer = 1,
    Supplier = 2,
    Both = 3
}

public enum CompanyVerificationStatus
{
    /// <summary>No documents submitted yet. Default state for new companies.</summary>
    Pending = 0,
    /// <summary>Documents submitted, awaiting admin review.</summary>
    UnderReview = 1,
    /// <summary>Admin approved — company may perform commercial activities.</summary>
    Approved = 2,
    /// <summary>Admin rejected — terminal state in the current policy.</summary>
    Rejected = 3,
    /// <summary>Admin requested changes — company must update documents and resubmit.</summary>
    ChangesRequired = 5
}

public enum CompanyRole
{
    Owner = 1,
    Admin = 2,
    ProcurementManager = 3,
    SalesManager = 4,
    Member = 5
}

public enum VerificationDocumentType
{
    CommercialRegister = 1,
    TaxCard = 2,
    IndustrialRegister = 3,
    QualityCertificate = 4,
    Other = 5
}

public enum VerificationDocumentStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

