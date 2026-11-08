using DealZone.Application.Auth.DTOs;
using DealZone.Application.Common.Interfaces;
using DealZone.Domain.Exceptions;
using DealZone.Domain.Identity;
using DealZone.Infrastructure.Options;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DealZone.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly DealZoneDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;
    private readonly IEmailService _emailService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ICurrentUser _currentUser;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        DealZoneDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator,
        IEmailService emailService,
        IDateTimeProvider dateTimeProvider,
        ICurrentUser currentUser,
        IOptions<JwtSettings> jwtSettings)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
        _emailService = emailService;
        _dateTimeProvider = dateTimeProvider;
        _currentUser = currentUser;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();

        var exists = await _context.Users.AnyAsync(u => u.Email == emailLower, cancellationToken);
        if (exists)
        {
            throw new ConflictException($"A user with email '{request.Email}' already exists.");
        }

        var (rawToken, tokenHash) = _tokenGenerator.GenerateRefreshToken();

        var user = new User
        {
            Email = emailLower,
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            IsActive = true,
            IsEmailConfirmed = false,
            EmailConfirmationTokenHash = tokenHash,
            EmailConfirmationExpiresAtUtc = _dateTimeProvider.UtcNow.AddHours(24),
            CreatedAtUtc = _dateTimeProvider.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        try
        {
            await _emailService.SendEmailConfirmationAsync(user.Email, rawToken, cancellationToken);
        }
        catch (EmailDeliveryException)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync(CancellationToken.None);
            throw;
        }

        return new RegisterResponse(user.Id, user.Email, "Registration successful. Please verify your email before logging in.");
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == emailLower, cancellationToken);
        if (user == null || !_passwordHasher.VerifyPassword(user, user.PasswordHash, request.Password))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new ForbiddenException("User account is inactive.");
        }

        if (!user.IsEmailConfirmed)
        {
            throw new UnauthorizedException("Email is not confirmed. Please confirm your email before logging in.");
        }

        user.LastLoginAtUtc = _dateTimeProvider.UtcNow;

        var membership = await _context.CompanyMembers
            .Include(m => m.Company)
            .FirstOrDefaultAsync(m => m.UserId == user.Id && m.IsActive, cancellationToken);

        Guid? companyId = membership?.CompanyId;
        string? companyRole = membership?.Role.ToString();

        var accessToken = _tokenGenerator.GenerateAccessToken(user, companyId, companyRole);
        var (rawRefreshToken, refreshTokenHash) = _tokenGenerator.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            CreatedAtUtc = _dateTimeProvider.UtcNow,
            ExpiresAtUtc = _dateTimeProvider.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            CreatedByIp = ipAddress
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken, rawRefreshToken, _tokenGenerator.AccessTokenExpirationSeconds);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var tokenHash = _tokenGenerator.HashToken(request.RefreshToken);

        var existingToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

        if (existingToken == null)
        {
            throw new UnauthorizedException("Invalid refresh token.");
        }

        if (existingToken.IsRevoked)
        {
            // Token replay detected: revoke all active tokens in user's lineage
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == existingToken.UserId && rt.RevokedAtUtc == null && rt.ExpiresAtUtc > _dateTimeProvider.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var token in activeTokens)
            {
                token.RevokedAtUtc = _dateTimeProvider.UtcNow;
                token.RevokedByIp = ipAddress;
                token.ReasonRevoked = $"Replay detected of token {existingToken.Id}";
            }

            await _context.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException("Invalid refresh token. Token replay detected and session revoked.");
        }

        if (existingToken.IsExpired)
        {
            throw new UnauthorizedException("Refresh token has expired. Please log in again.");
        }

        if (!existingToken.User.IsActive)
        {
            throw new UnauthorizedException("User account is inactive.");
        }

        // Rotate token
        var (newRawToken, newTokenHash) = _tokenGenerator.GenerateRefreshToken();

        existingToken.RevokedAtUtc = _dateTimeProvider.UtcNow;
        existingToken.RevokedByIp = ipAddress;
        existingToken.ReplacedByTokenHash = newTokenHash;
        existingToken.ReasonRevoked = "Rotated to new token";

        var newRefreshToken = new RefreshToken
        {
            UserId = existingToken.UserId,
            TokenHash = newTokenHash,
            CreatedAtUtc = _dateTimeProvider.UtcNow,
            ExpiresAtUtc = _dateTimeProvider.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            CreatedByIp = ipAddress
        };

        _context.RefreshTokens.Add(newRefreshToken);

        var membership = await _context.CompanyMembers
            .FirstOrDefaultAsync(m => m.UserId == existingToken.UserId && m.IsActive, cancellationToken);

        var accessToken = _tokenGenerator.GenerateAccessToken(
            existingToken.User,
            membership?.CompanyId,
            membership?.Role.ToString());

        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken, newRawToken, _tokenGenerator.AccessTokenExpirationSeconds);
    }

    public async Task LogoutAsync(string? refreshToken, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id;

        if (userId.HasValue)
        {
            var tokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId.Value && rt.RevokedAtUtc == null)
                .ToListAsync(cancellationToken);

            foreach (var t in tokens)
            {
                t.RevokedAtUtc = _dateTimeProvider.UtcNow;
                t.RevokedByIp = ipAddress;
                t.ReasonRevoked = "User logged out";
            }
        }

        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            var hash = _tokenGenerator.HashToken(refreshToken);
            var token = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.TokenHash == hash && rt.RevokedAtUtc == null, cancellationToken);

            if (token != null)
            {
                token.RevokedAtUtc = _dateTimeProvider.UtcNow;
                token.RevokedByIp = ipAddress;
                token.ReasonRevoked = "User logged out";
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken cancellationToken = default)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == emailLower, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException($"User with email '{request.Email}' not found.");
        }

        if (user.IsEmailConfirmed)
        {
            return;
        }

        var tokenHash = _tokenGenerator.HashToken(request.Token);

        if (user.EmailConfirmationTokenHash != tokenHash ||
            user.EmailConfirmationExpiresAtUtc == null ||
            user.EmailConfirmationExpiresAtUtc < _dateTimeProvider.UtcNow)
        {
            throw new DomainException("Invalid or expired email confirmation token.");
        }

        user.IsEmailConfirmed = true;
        user.EmailConfirmationTokenHash = null;
        user.EmailConfirmationExpiresAtUtc = null;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ResendConfirmationAsync(ResendConfirmationRequest request, CancellationToken cancellationToken = default)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == emailLower, cancellationToken);
        if (user != null && !user.IsEmailConfirmed)
        {
            var (rawToken, tokenHash) = _tokenGenerator.GenerateRefreshToken();
            user.EmailConfirmationTokenHash = tokenHash;
            user.EmailConfirmationExpiresAtUtc = _dateTimeProvider.UtcNow.AddHours(24);

            await _context.SaveChangesAsync(cancellationToken);
            await _emailService.SendEmailConfirmationAsync(user.Email, rawToken, cancellationToken);
        }
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == emailLower, cancellationToken);
        if (user != null && user.IsActive)
        {
            var (rawToken, tokenHash) = _tokenGenerator.GenerateRefreshToken();
            user.PasswordResetTokenHash = tokenHash;
            user.PasswordResetExpiresAtUtc = _dateTimeProvider.UtcNow.AddHours(1);

            await _context.SaveChangesAsync(cancellationToken);
            await _emailService.SendPasswordResetAsync(user.Email, rawToken, cancellationToken);
        }
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == emailLower, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException($"User with email '{request.Email}' not found.");
        }

        var tokenHash = _tokenGenerator.HashToken(request.Token);

        if (user.PasswordResetTokenHash != tokenHash ||
            user.PasswordResetExpiresAtUtc == null ||
            user.PasswordResetExpiresAtUtc < _dateTimeProvider.UtcNow)
        {
            throw new DomainException("Invalid or expired password reset token.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.PasswordResetTokenHash = null;
        user.PasswordResetExpiresAtUtc = null;

        // Revoke active refresh tokens on password reset
        var activeTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var t in activeTokens)
        {
            t.RevokedAtUtc = _dateTimeProvider.UtcNow;
            t.ReasonRevoked = "Password reset";
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserProfileResponse> GetCurrentUserProfileAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id;
        if (!userId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("User profile not found.");
        }

        var membership = await _context.CompanyMembers
            .Include(m => m.Company)
            .FirstOrDefaultAsync(m => m.UserId == user.Id && m.IsActive, cancellationToken);

        UserCompanyDto? companyDto = null;
        if (membership?.Company != null)
        {
            companyDto = new UserCompanyDto(
                membership.Company.Id,
                membership.Company.LegalName,
                membership.Company.TradeName,
                membership.Company.IndustrySector,
                membership.Company.City,
                membership.Company.Governorate,
                membership.Company.VerificationStatus.ToString(),
                membership.Company.CanPerformCommercialActivities,
                membership.Role.ToString(),
                membership.Company.CompanyType.ToString());
        }

        return new UserProfileResponse(
            user.Id,
            user.Email,
            user.FullName,
            user.PhoneNumber,
            user.IsEmailConfirmed,
            user.IsSystemAdmin,
            companyDto);
    }
}

