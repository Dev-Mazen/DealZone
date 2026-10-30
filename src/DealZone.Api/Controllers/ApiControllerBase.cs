using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
}

