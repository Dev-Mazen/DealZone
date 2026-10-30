using DealZone.Application.Verification.DTOs;

namespace DealZone.Application.Common.Interfaces;

public interface IVerificationService
{
    Task<UploadDocumentResponse> UploadDocumentAsync(
        int documentType,
        Stream stream,
        string fileName,
        string contentType,
        long length,
        CancellationToken cancellationToken = default);

    Task<VerificationStatusResponse> GetVerificationStatusAsync(CancellationToken cancellationToken = default);

    Task DeleteDocumentAsync(Guid documentId, CancellationToken cancellationToken = default);

    Task SubmitForReviewAsync(CancellationToken cancellationToken = default);
}

