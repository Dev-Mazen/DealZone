using DealZone.Application.Admin.DTOs;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Validation;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Platform administrator verification workflow management endpoints.
/// Strictly restricted to system administrators.
/// Route: /api/v1/admin/verification
/// </summary>
[Tags("Admin Verification")]
[Authorize(Policy = "SystemAdmin")]
[Route("api/v1/admin/verification")]
public class AdminController : ApiControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    /// <summary>
    /// List all companies pending review or where changes were requested.
    /// </summary>
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingCompanies(CancellationToken cancellationToken)
    {
        var response = await _adminService.GetPendingCompaniesAsync(cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get verification details, documents, and decision history for a company.
    /// </summary>
    [HttpGet("{companyId:guid}")]
    public async Task<IActionResult> GetCompanyVerification(
        Guid companyId,
        CancellationToken cancellationToken)
    {
        var response = await _adminService.GetCompanyVerificationAsync(companyId, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Approve a company for commercial activities.
    /// Requires mandatory documents (CommercialRegister and TaxCard) to be present and under review.
    /// </summary>
    [HttpPost("{companyId:guid}/approve")]
    public async Task<IActionResult> ApproveCompany(
        Guid companyId,
        CancellationToken cancellationToken)
    {
        await _adminService.ApproveCompanyAsync(companyId, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Reject a company verification application.
    /// </summary>
    [HttpPost("{companyId:guid}/reject")]
    public async Task<IActionResult> RejectCompany(
        Guid companyId,
        [FromBody] RejectCompanyRequest request,
        [FromServices] IValidator<RejectCompanyRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        await _adminService.RejectCompanyAsync(companyId, request.Reason, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Request changes from a company before approving verification.
    /// </summary>
    [HttpPost("{companyId:guid}/request-changes")]
    public async Task<IActionResult> RequestChanges(
        Guid companyId,
        [FromBody] RequestChangesRequest request,
        [FromServices] IValidator<RequestChangesRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        await _adminService.RequestChangesAsync(companyId, request.Reason, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Securely download a company verification document.
    /// Streams the file content directly from private storage without exposing filesystem paths.
    /// </summary>
    [HttpGet("{companyId:guid}/documents/{documentId:guid}/download")]
    public async Task<IActionResult> DownloadDocument(
        Guid companyId,
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var (stream, contentType, fileName) = await _adminService.GetDocumentStreamAsync(companyId, documentId, cancellationToken);
        return File(stream, contentType, fileName);
    }
}

