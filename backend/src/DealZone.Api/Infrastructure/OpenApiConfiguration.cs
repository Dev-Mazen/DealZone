using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace DealZone.Api.Infrastructure;

public static class OpenApiConfiguration
{
    public static void ConfigureOpenApi(OpenApiOptions options)
    {
        options.AddDocumentTransformer((document, context, cancellationToken) =>
        {
            document.Info = new OpenApiInfo
            {
                Title = "DealZone Marketplace Web API",
                Version = "v1",
                Description = "Egyptian B2B Industrial Raw-Material Marketplace Web API. Built with .NET 10 following Clean Architecture and Modular Monolith principles."
            };

            var bearerScheme = new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Description = "Enter JWT Bearer token: Bearer {token}",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT"
            };

            document.Components ??= new OpenApiComponents();
            document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
            document.Components.SecuritySchemes["Bearer"] = bearerScheme;

            return Task.CompletedTask;
        });

        options.AddOperationTransformer((operation, context, cancellationToken) =>
        {
            var metadata = context.Description.ActionDescriptor.EndpointMetadata;
            var hasAuthorize = metadata.OfType<AuthorizeAttribute>().Any();
            var allowAnonymous = metadata.OfType<AllowAnonymousAttribute>().Any();

            if (hasAuthorize && !allowAnonymous)
            {
                operation.Security ??= new List<OpenApiSecurityRequirement>();
                operation.Security.Add(new OpenApiSecurityRequirement
                {
                    [new OpenApiSecuritySchemeReference("Bearer")] = new List<string>()
                });
            }

            return Task.CompletedTask;
        });
    }
}
