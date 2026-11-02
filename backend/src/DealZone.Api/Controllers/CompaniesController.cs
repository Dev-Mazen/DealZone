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
}

