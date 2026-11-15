using System.Text;
using DealZone.Application.Common.Interfaces;
using DealZone.Domain.Companies;
using DealZone.Infrastructure.Authorization;
using DealZone.Infrastructure.BackgroundJobs;
using DealZone.Infrastructure.Options;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace DealZone.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment? environment = null)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentCompanyContext, CurrentCompanyContext>();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();

        // JWT Settings & Authentication
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();

        // Enforce secret security on startup
        var isDev = environment?.IsDevelopment() ?? true;
        if (!isDev)
        {
            const string devDefaultSecret = "DealZoneEnterpriseSecretKeyForJwtAuthenticationTokens2026!#EgyptRawMaterialMarketplace";
            if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey) ||
                string.Equals(jwtSettings.SecretKey, devDefaultSecret, StringComparison.Ordinal) ||
                Encoding.UTF8.GetByteCount(jwtSettings.SecretKey) < 32)
            {
                throw new InvalidOperationException(
                    "In non-development environments, 'JwtSettings:SecretKey' must be set to a custom cryptographically secure secret (at least 32 bytes / 256 bits) and must not use the development default key.");
            }

            if (string.IsNullOrWhiteSpace(jwtSettings.Issuer) || string.IsNullOrWhiteSpace(jwtSettings.Audience))
            {
                throw new InvalidOperationException("'JwtSettings:Issuer' and 'JwtSettings:Audience' must be configured in non-development environments.");
            }
        }
        else if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey) || Encoding.UTF8.GetByteCount(jwtSettings.SecretKey) < 16)
        {
            throw new InvalidOperationException("'JwtSettings:SecretKey' cannot be empty and must be at least 128 bits.");
        }

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = !isDev;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
                ClockSkew = TimeSpan.Zero
            };
        });

        // Authorization Handlers (evaluating DB-backed ICurrentCompanyContext)
        services.AddScoped<IAuthorizationHandler, SystemAdminAuthorizationHandler>();
        services.AddScoped<IAuthorizationHandler, CompanyTypeAuthorizationHandler>();
        services.AddScoped<IAuthorizationHandler, VerifiedCompanyAuthorizationHandler>();
        services.AddScoped<IAuthorizationHandler, CompanyRoleAuthorizationHandler>();

        services.AddAuthorization(opts =>
        {
            opts.AddPolicy("SystemAdmin", policy =>
                policy.Requirements.Add(new SystemAdminRequirement()));

            opts.AddPolicy("SystemAdminOnly", policy =>
                policy.Requirements.Add(new SystemAdminRequirement()));

            opts.AddPolicy("BuyerCompany", policy =>
                policy.Requirements.Add(new CompanyTypeRequirement(CompanyType.Buyer)));

            opts.AddPolicy("SupplierCompany", policy =>
                policy.Requirements.Add(new CompanyTypeRequirement(CompanyType.Supplier)));

            opts.AddPolicy("VerifiedCompany", policy =>
                policy.Requirements.Add(new VerifiedCompanyRequirement()));

            opts.AddPolicy("BuyerProcurement", policy =>
            {
                policy.Requirements.Add(new CompanyTypeRequirement(CompanyType.Buyer));
                policy.Requirements.Add(new VerifiedCompanyRequirement());
                policy.Requirements.Add(new CompanyRoleRequirement(CompanyActionRoleMap.BuyerProcurement.ToArray()));
            });

            opts.AddPolicy("SupplierSales", policy =>
            {
                policy.Requirements.Add(new CompanyTypeRequirement(CompanyType.Supplier));
                policy.Requirements.Add(new VerifiedCompanyRequirement());
                policy.Requirements.Add(new CompanyRoleRequirement(CompanyActionRoleMap.SupplierSales.ToArray()));
            });

            opts.AddPolicy("CompanyAdmin", policy =>
            {
                policy.Requirements.Add(new CompanyRoleRequirement(CompanyActionRoleMap.CompanyManagement.ToArray()));
            });
        });

        // File storage
        services.Configure<FileStorageSettings>(configuration.GetSection(FileStorageSettings.SectionName));
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        // Admin settings
        services.Configure<AdminSettings>(configuration.GetSection(AdminSettings.SectionName));
        services.Configure<PricingSettings>(configuration.GetSection(PricingSettings.SectionName));

        // SMTP settings
        services.Configure<SmtpSettings>(configuration.GetSection(SmtpSettings.SectionName));

        // Email Service:
        // Configurable via EmailProvider in appsettings or environment variables ("Smtp" or "Development").
        // If SmtpSettings:Host is provided, SmtpEmailService is activated automatically.
        // Otherwise, DevelopmentEmailService is used in development.
        var isDevelopment = environment?.IsDevelopment() ?? true;
        var emailProvider = configuration["EmailProvider"];
        var hasSmtpHost = !string.IsNullOrWhiteSpace(configuration["SmtpSettings:Host"]);

        if (string.Equals(emailProvider, "Smtp", StringComparison.OrdinalIgnoreCase) ||
            (string.IsNullOrWhiteSpace(emailProvider) && hasSmtpHost))
        {
            services.AddScoped<IEmailService, SmtpEmailService>();
        }
        else if (isDevelopment || string.Equals(emailProvider, "Development", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IEmailService, DevelopmentEmailService>();
        }
        else
        {
            services.AddScoped<IEmailService, SmtpEmailService>();
        }

        // Application Services implemented by Infrastructure
        services.AddScoped<IPasswordHasher, PasswordHasherService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<IVerificationService, VerificationService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IRfqService, RfqService>();
        services.AddScoped<IOfferService, OfferService>();
        services.AddScoped<IDealService, DealService>();
        services.AddScoped<IShippingService, ShippingService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IRfqNumberGenerator, RfqNumberGenerator>();
        services.AddScoped<IPurchasingService, PurchasingService>();
        services.AddScoped<INegotiationService, NegotiationService>();

        // Background Job Infrastructure
        services.Configure<BackgroundJobOptions>(
            configuration.GetSection(BackgroundJobOptions.SectionName));
        services.AddScoped<IOfferExpiryProcessor, OfferExpiryProcessor>();
        services.AddScoped<ITokenCleanupProcessor, TokenCleanupProcessor>();
        services.AddHostedService<OfferExpiryBackgroundService>();
        services.AddHostedService<TokenCleanupBackgroundService>();

        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<DealZoneDbContext>(options =>
        {
            if (!string.IsNullOrWhiteSpace(connectionString))
            {
                options.UseSqlServer(connectionString);
            }
        });

        return services;
    }
}
