using System.Threading.RateLimiting;
using DealZone.Api.Infrastructure;
using DealZone.Api.Options;
using DealZone.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace DealZone.Api;

public static class ApiServiceRegistration
{
    private const long MaxUploadSizeBytes = 10 * 1024 * 1024; // 10 MB

    public static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddOpenApi("v1", OpenApiConfiguration.ConfigureOpenApi);

        services.AddProblemDetails();
        services.AddExceptionHandler<GlobalExceptionHandler>();

        // Increase the request body size limit to accommodate file uploads (max 10 MB)
        services.Configure<FormOptions>(opts =>
        {
            opts.MultipartBodyLengthLimit = MaxUploadSizeBytes;
        });

        // CORS Configuration
        services.Configure<CorsOptions>(configuration.GetSection(CorsOptions.SectionName));
        var corsOptions = configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>() ?? new CorsOptions();

        var allowedOriginsList = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (corsOptions.AllowedOrigins != null)
        {
            foreach (var origin in corsOptions.AllowedOrigins)
            {
                if (!string.IsNullOrWhiteSpace(origin))
                {
                    allowedOriginsList.Add(origin.Trim().TrimEnd('/'));
                }
            }
        }

        // Support environment variable or single string config (e.g. CORS_ALLOWED_ORIGINS="https://app.dealzone.com,http://localhost:5173")
        var envOrigins = configuration["CORS_ALLOWED_ORIGINS"] ?? configuration["CorsSettings:AllowedOrigins"];
        if (!string.IsNullOrWhiteSpace(envOrigins))
        {
            var split = envOrigins.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var origin in split)
            {
                allowedOriginsList.Add(origin.TrimEnd('/'));
            }
        }

        var allowedOrigins = allowedOriginsList.ToArray();

        if (!environment.IsDevelopment() && allowedOrigins.Length == 0)
        {
            throw new InvalidOperationException("CORS configuration error: In non-Development environments, CorsSettings:AllowedOrigins must be configured with at least one valid origin.");
        }

        services.AddCors(options =>
        {
            options.AddPolicy(CorsOptions.PolicyName, policy =>
            {
                if (allowedOrigins.Length > 0)
                {
                    policy.WithOrigins(allowedOrigins)
                        .WithHeaders("Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Accept-Language")
                        .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .AllowCredentials()
                        .SetPreflightMaxAge(TimeSpan.FromHours(1));
                }
                else
                {
                    policy.SetIsOriginAllowed(_ => false);
                }
            });
        });

        // Authentication Rate Limiting
        services.Configure<RateLimitingOptions>(configuration.GetSection(RateLimitingOptions.SectionName));

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.ContentType = "application/problem+json";

                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                }

                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status429TooManyRequests,
                    Title = "Too Many Requests",
                    Detail = "Rate limit exceeded. Please wait a moment before trying again.",
                    Instance = context.HttpContext.Request.Path
                };

                await context.HttpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
            };

            options.AddPolicy(RateLimitPolicies.AuthLogin, httpContext =>
            {
                var opt = httpContext.RequestServices.GetRequiredService<IOptions<RateLimitingOptions>>().Value;
                if (!opt.Enabled) return RateLimitPartition.GetNoLimiter("none");
                var ip = GetClientIpAddress(httpContext);
                var window = TimeSpan.FromSeconds(Math.Max(10, opt.WindowSeconds));
                return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = opt.LoginPermitLimit,
                    Window = window,
                    SegmentsPerWindow = 2,
                    QueueLimit = 0
                });
            });

            options.AddPolicy(RateLimitPolicies.AuthRegister, httpContext =>
            {
                var opt = httpContext.RequestServices.GetRequiredService<IOptions<RateLimitingOptions>>().Value;
                if (!opt.Enabled) return RateLimitPartition.GetNoLimiter("none");
                var ip = GetClientIpAddress(httpContext);
                var window = TimeSpan.FromSeconds(Math.Max(10, opt.WindowSeconds));
                return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = opt.RegisterPermitLimit,
                    Window = window,
                    SegmentsPerWindow = 2,
                    QueueLimit = 0
                });
            });

            options.AddPolicy(RateLimitPolicies.AuthPassword, httpContext =>
            {
                var opt = httpContext.RequestServices.GetRequiredService<IOptions<RateLimitingOptions>>().Value;
                if (!opt.Enabled) return RateLimitPartition.GetNoLimiter("none");
                var ip = GetClientIpAddress(httpContext);
                var window = TimeSpan.FromSeconds(Math.Max(10, opt.WindowSeconds));
                return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = opt.PasswordResetPermitLimit,
                    Window = window,
                    SegmentsPerWindow = 2,
                    QueueLimit = 0
                });
            });

            options.AddPolicy(RateLimitPolicies.AuthResendConfirmation, httpContext =>
            {
                var opt = httpContext.RequestServices.GetRequiredService<IOptions<RateLimitingOptions>>().Value;
                if (!opt.Enabled) return RateLimitPartition.GetNoLimiter("none");
                var ip = GetClientIpAddress(httpContext);
                var window = TimeSpan.FromSeconds(Math.Max(10, opt.WindowSeconds));
                return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = opt.ResendConfirmationPermitLimit,
                    Window = window,
                    SegmentsPerWindow = 2,
                    QueueLimit = 0
                });
            });
        });

        // Health Checks
        services.AddHealthChecks()
            .AddCheck<DatabaseHealthCheck>("database")
            .AddCheck<FileStorageHealthCheck>("file-storage");

        return services;
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

