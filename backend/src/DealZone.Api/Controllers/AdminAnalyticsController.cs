using DealZone.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealZone.Api.Controllers;

/// <summary>
/// Platform Analytics and Reporting portal for SystemAdmin.
/// Route: /api/v1/admin/analytics
/// </summary>
[Tags("Admin Analytics")]
[Authorize(Policy = "SystemAdmin")]
[Route("api/v1/admin/analytics")]
public class AdminAnalyticsController : ApiControllerBase
{
    private readonly IAdminService _adminService;

    public AdminAnalyticsController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    /// <summary>
    /// Retrieve real-time platform KPIs, sector breakdown, and historical activity metrics.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAnalytics(
        [FromQuery] DateTimeOffset? fromDate,
        [FromQuery] DateTimeOffset? toDate,
        CancellationToken cancellationToken)
    {
        var response = await _adminService.GetAnalyticsAsync(fromDate, toDate, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Export all registered companies with legal/tax status as CSV.
    /// </summary>
    [HttpGet("export/companies")]
    public async Task<IActionResult> ExportCompaniesCsv(CancellationToken cancellationToken)
    {
        var bytes = await _adminService.ExportCompaniesCsvAsync(cancellationToken);
        return File(bytes, "text/csv; charset=utf-8", $"dealzone-companies-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    /// <summary>
    /// Export all commercial deals and transaction volumes as CSV.
    /// </summary>
    [HttpGet("export/deals")]
    public async Task<IActionResult> ExportDealsCsv(CancellationToken cancellationToken)
    {
        var bytes = await _adminService.ExportDealsCsvAsync(cancellationToken);
        return File(bytes, "text/csv; charset=utf-8", $"dealzone-deals-{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}
