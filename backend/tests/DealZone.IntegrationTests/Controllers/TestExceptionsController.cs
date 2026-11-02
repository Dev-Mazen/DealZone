using DealZone.Api.Controllers;
using DealZone.Application.Common.Exceptions;
using DealZone.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.IntegrationTests.Controllers;

[Route("api/v1/test-exceptions")]
public class TestExceptionsController : ApiControllerBase
{
    [HttpGet("validation")]
    public IActionResult ThrowValidation()
    {
        throw new ValidationException("CommercialRegistrationNumber", "Must be 10 digits.");
    }

    [HttpGet("not-found")]
    public IActionResult ThrowNotFound()
    {
        throw new NotFoundException("Company", Guid.Empty);
    }

    [HttpGet("conflict")]
    public IActionResult ThrowConflict()
    {
        throw new ConflictException("Tax identifier already exists.");
    }

    [HttpGet("unauthorized")]
    public IActionResult ThrowUnauthorized()
    {
        throw new UnauthorizedException();
    }

    [HttpGet("forbidden")]
    public IActionResult ThrowForbidden()
    {
        throw new ForbiddenException();
    }

    [HttpGet("unhandled")]
    public IActionResult ThrowUnhandled()
    {
        throw new InvalidOperationException("Sensitive internal database connection string failed.");
    }
}

