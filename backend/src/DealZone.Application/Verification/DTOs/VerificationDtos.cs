namespace DealZone.Application.Verification.DTOs;

public record UploadDocumentResponse(
    Guid DocumentId,
    string DocumentType,
    string FileName,
    long FileSizeBytes,
    string Status,
    DateTimeOffset UploadedAtUtc);

public record VerificationStatusResponse(
    string CompanyVerificationStatus,
    IReadOnlyList<VerificationDocumentDto> Documents);

public record VerificationDocumentDto(
    Guid Id,
    string DocumentType,
    string FileName,
    long FileSizeBytes,
    string ContentType,
    string Status,
    string? RejectionReason,
    DateTimeOffset UploadedAtUtc);

