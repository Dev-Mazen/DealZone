using DealZone.Api.Infrastructure;
using DealZone.Api.Options;
using Microsoft.AspNetCore.Http.Features;

namespace DealZone.Api;

public static class ApiServiceRegistration
{
    private const long MaxUploadSizeBytes = 10 * 1024 * 1024; // 10 MB

    public static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration)
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

        services.Configure<CorsOptions>(configuration.GetSection(CorsOptions.SectionName));
        var corsOptions = configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>() ?? new CorsOptions();

        services.AddCors(options =>
        {
            options.AddPolicy(CorsOptions.PolicyName, policy =>
            {
                if (corsOptions.AllowedOrigins.Length > 0)
                {
                    policy.WithOrigins(corsOptions.AllowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                }
                else
                {
                    policy.SetIsOriginAllowed(_ => false);
                }
            });
        });

        services.AddHealthChecks();

        return services;
    }
}

