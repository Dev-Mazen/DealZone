using DealZone.Application.Verification.DTOs;

namespace DealZone.Application.Admin.DTOs;

public record PendingCompanyDto(
    Guid CompanyId,
    string LegalName,
    string TradeName,
    string IndustrySector,
    string Governorate,
    string City,
    string VerificationStatus,
    int DocumentCount,
    DateTimeOffset CreatedAtUtc);

public record CompanyVerificationDetailDto(
    Guid CompanyId,
    string LegalName,
    string TradeName,
    string VerificationStatus,
    string? RejectionReason,
    IReadOnlyList<VerificationDocumentDto> Documents,
    IReadOnlyList<VerificationDecisionDto> DecisionHistory);

public record VerificationDecisionDto(
    Guid Id,
    string Decision,
    string? Reason,
    string ReviewedByUserEmail,
    DateTimeOffset DecidedAtUtc);

public record RejectCompanyRequest(string Reason);

public record RequestChangesRequest(string Reason);

