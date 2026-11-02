using System.Text.Json;
using DealZone.Application.Common.Exceptions;
using DealZone.Domain.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DealZone.Api.Infrastructure;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment env) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, title, detail) = MapException(exception);

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path
        };

        problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;

        if (exception is ValidationException validationException)
        {
            problemDetails.Extensions["errors"] = validationException.Errors;
        }

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(
                exception,
                "Unhandled exception occurred while processing request on {Path}. TraceId: {TraceId}",
                httpContext.Request.Path,
                httpContext.TraceIdentifier);
        }
        else
        {
            logger.LogWarning(
                "Handled business/client error on {Path}: {Title}. TraceId: {TraceId}",
                httpContext.Request.Path,
                title,
                httpContext.TraceIdentifier);
        }

        httpContext.Response.StatusCode = statusCode;

        await httpContext.Response.WriteAsJsonAsync(
            problemDetails,
            options: (JsonSerializerOptions?)null,
            contentType: "application/problem+json",
            cancellationToken: cancellationToken);

        return true;
    }

    private (int StatusCode, string Title, string Detail) MapException(Exception exception)
    {
        return exception switch
        {
            ValidationException validationException => (
                StatusCodes.Status400BadRequest,
                "Validation Error",
                validationException.Message
            ),
            UnauthorizedException unauthorizedException => (
                StatusCodes.Status401Unauthorized,
                "Unauthorized",
                unauthorizedException.Message
            ),
            UnauthorizedAccessException unauthorizedAccessException => (
                StatusCodes.Status401Unauthorized,
                "Unauthorized",
                unauthorizedAccessException.Message
            ),
            ForbiddenException forbiddenException => (
                StatusCodes.Status403Forbidden,
                "Forbidden",
                forbiddenException.Message
            ),
            NotFoundException notFoundException => (
                StatusCodes.Status404NotFound,
                "Not Found",
                notFoundException.Message
            ),
            ConflictException conflictException => (
                StatusCodes.Status409Conflict,
                "Conflict",
                conflictException.Message
            ),
            DbUpdateConcurrencyException => (
                StatusCodes.Status409Conflict,
                "Concurrency Conflict",
                "The resource was modified or updated concurrently by another request. Please reload and retry."
            ),
            DomainException domainException => (
                StatusCodes.Status400BadRequest,
                "Business Rule Violation",
                domainException.Message
            ),
            _ => (
                StatusCodes.Status500InternalServerError,
                "Internal Server Error",
                env.IsDevelopment() ? exception.Message : "An unexpected error occurred while processing your request."
            )
        };
    }
}
