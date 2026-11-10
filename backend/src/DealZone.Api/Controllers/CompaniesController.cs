using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Validation;
using DealZone.Application.Companies.DTOs;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

[Tags("Companies")]
[Authorize]
[Route("api/v1/companies")]
public class CompaniesController : ApiControllerBase
{
    private readonly ICompanyService _companyService;

    public CompaniesController(ICompanyService companyService)
    {
        _companyService = companyService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateCompany(
        [FromBody] CreateCompanyRequest request,
        [FromServices] IValidator<CreateCompanyRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _companyService.CreateCompanyAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetMyCompany), response);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyCompany(CancellationToken cancellationToken)
    {
        var response = await _companyService.GetMyCompanyAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyCompany(
        [FromBody] UpdateCompanyProfileRequest request,
        [FromServices] IValidator<UpdateCompanyProfileRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var response = await _companyService.UpdateMyCompanyProfileAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("me/contact-details")]
    public async Task<IActionResult> GetMyCompanyContactDetails(CancellationToken cancellationToken)
    {
        var response = await _companyService.GetMyCompanyContactDetailsAsync(cancellationToken);
        return Ok(response);
    }

    // ─── Phase B: Company Member Management ──────────────────────────────────

    [HttpGet("me/members")]
    public async Task<IActionResult> GetMyCompanyMembers(CancellationToken cancellationToken)
    {
        var members = await _companyService.GetMyCompanyMembersAsync(cancellationToken);
        return Ok(members);
    }

    [HttpPost("me/members")]
    public async Task<IActionResult> AddCompanyMember(
        [FromBody] AddCompanyMemberRequest request,
        [FromServices] IValidator<AddCompanyMemberRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var member = await _companyService.AddCompanyMemberAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, member);
    }

    [HttpPut("me/members/{userId:guid}/role")]
    public async Task<IActionResult> UpdateCompanyMemberRole(
        [FromRoute] Guid userId,
        [FromBody] UpdateCompanyMemberRoleRequest request,
        [FromServices] IValidator<UpdateCompanyMemberRoleRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowDomainAsync(request, cancellationToken);
        var member = await _companyService.UpdateCompanyMemberRoleAsync(userId, request, cancellationToken);
        return Ok(member);
    }

    [HttpDelete("me/members/{userId:guid}")]
    public async Task<IActionResult> RemoveCompanyMember(
        [FromRoute] Guid userId,
        CancellationToken cancellationToken)
    {
        await _companyService.RemoveCompanyMemberAsync(userId, cancellationToken);
        return NoContent();
    }

    // ─── Phase B: Supplier Directory & Public Company Profile ────────────────

    [AllowAnonymous]
    [HttpGet("")]
    public async Task<IActionResult> GetPublicSuppliers(
        [FromQuery] CompanyDirectoryFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _companyService.GetPublicSuppliersAsync(filter, cancellationToken);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("{companyId:guid}")]
    public async Task<IActionResult> GetPublicCompanyProfile(
        [FromRoute] Guid companyId,
        CancellationToken cancellationToken)
    {
        var profile = await _companyService.GetPublicCompanyProfileAsync(companyId, cancellationToken);
        return Ok(profile);
    }
}

