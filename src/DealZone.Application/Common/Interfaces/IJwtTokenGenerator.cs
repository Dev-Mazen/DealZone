using DealZone.Domain.Identity;

namespace DealZone.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateAccessToken(User user, Guid? companyId, string? companyRole);
    (string rawToken, string tokenHash) GenerateRefreshToken();
    string HashToken(string token);
    int AccessTokenExpirationSeconds { get; }
}

