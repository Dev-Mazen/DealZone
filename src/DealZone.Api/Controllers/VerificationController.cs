using DealZone.Application.Common.Exceptions;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Validation;
using DealZone.Application.Verification.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Company-facing verification endpoints. Requires authentication.
/// Route: /api/v1/companies/me/verification
/// </summary>
[Tags("Company Verification")]
[Authorize]
[Route("api/v1/companies/me")]
public class VerificationController : ApiControllerBase
{
    private readonly IVerificationService _verificationService;

    public VerificationController(IVerificationService verificationService)
    {
        _verificationService = verificationService;
    }

    /// <summary>
    /// Upload a verification document. Accepted types: PDF, JPEG, PNG (max 10 MB).
    /// DocumentType values: 1=CommercialRegister, 2=TaxCard, 3=IndustrialRegister, 4=QualityCertificate, 5=Other
    /// </summary>
    [HttpPost("verification-documents")]
    [HttpPost("verification/documents")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadDocument(
        [FromForm] int documentType,
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            throw new ValidationException("File", "A document file is required.");
        }

        await using var stream = file.OpenReadStream();
        var response = await _verificationService.UploadDocumentAsync(
            documentType,
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Get the current company's verification status and document list.
    /// </summary>
    [HttpGet("verification")]
    public async Task<IActionResult> GetVerificationStatus(CancellationToken cancellationToken)
    {
        var response = await _verificationService.GetVerificationStatusAsync(cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Delete a verification document. Only allowed when status is Pending or ChangesRequired.
    /// </summary>
    [HttpDelete("verification-documents/{documentId:guid}")]
    [HttpDelete("verification/documents/{documentId:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid documentId, CancellationToken cancellationToken)
    {
        await _verificationService.DeleteDocumentAsync(documentId, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Submit uploaded documents for admin review.
    /// Requires CommercialRegister and TaxCard to be present.
    /// </summary>
    [HttpPost("verification/submit")]
    public async Task<IActionResult> SubmitForReview(CancellationToken cancellationToken)
    {
        await _verificationService.SubmitForReviewAsync(cancellationToken);
        return NoContent();
    }
}

