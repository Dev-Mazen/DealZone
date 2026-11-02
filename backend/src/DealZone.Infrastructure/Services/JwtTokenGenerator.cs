using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DealZone.Application.Common.Interfaces;
using DealZone.Domain.Identity;
using DealZone.Infrastructure.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace DealZone.Infrastructure.Services;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtSettings _jwtSettings;
    private readonly IDateTimeProvider _dateTimeProvider;

    public JwtTokenGenerator(
        IOptions<JwtSettings> jwtSettings,
        IDateTimeProvider dateTimeProvider)
    {
        _jwtSettings = jwtSettings.Value;
        _dateTimeProvider = dateTimeProvider;
    }

    public int AccessTokenExpirationSeconds => _jwtSettings.AccessTokenExpirationMinutes * 60;

    public string GenerateAccessToken(User user, Guid? companyId, string? companyRole)
    {
        var now = _dateTimeProvider.UtcNow.UtcDateTime;
        var expires = now.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (user.IsSystemAdmin)
        {
            claims.Add(new Claim(ClaimTypes.Role, "SystemAdmin"));
            claims.Add(new Claim("is_system_admin", "true"));
        }

        if (companyId.HasValue)
        {
            claims.Add(new Claim("company_id", companyId.Value.ToString()));
            claims.Add(new Claim("CompanyId", companyId.Value.ToString()));

            if (!string.IsNullOrWhiteSpace(companyRole))
            {
                claims.Add(new Claim(ClaimTypes.Role, companyRole));
                claims.Add(new Claim("role", companyRole));
            }
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expires,
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    public (string rawToken, string tokenHash) GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        var rawToken = Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        var tokenHash = HashToken(rawToken);

        return (rawToken, tokenHash);
    }

    public string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

