using System.Security.Cryptography;
using System.Text;
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

    private string ComputeCodeHash(string code)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(code));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    private static string GenerateLinkToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();

        var exists = await _context.Users.AnyAsync(u => u.Email == emailLower, cancellationToken);
        if (exists)
        {
            throw new ConflictException($"A user with email '{request.Email}' already exists.");
        }

        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
        var codeHash = ComputeCodeHash(code);
        var linkToken = GenerateLinkToken();
        var linkTokenHash = _tokenGenerator.HashToken(linkToken);

        var user = new User
        {
            Email = emailLower,
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            PreferredLanguage = string.Equals(request.PreferredLanguage, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "ar",
            IsActive = true,
            IsEmailConfirmed = false,
            EmailConfirmationTokenHash = linkTokenHash,
            EmailConfirmationExpiresAtUtc = _dateTimeProvider.UtcNow.AddHours(24),
            CreatedAtUtc = _dateTimeProvider.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        _context.Users.Add(user);

        var verification = new EmailVerification
        {
            UserId = user.Id,
            User = user,
            CodeHash = codeHash,
            LinkTokenHash = linkTokenHash,
            ExpiresAtUtc = _dateTimeProvider.UtcNow.AddHours(24),
            CodeExpiresAtUtc = _dateTimeProvider.UtcNow.AddMinutes(15),
            Attempts = 0,
            CreatedAtUtc = _dateTimeProvider.UtcNow
        };
        _context.EmailVerifications.Add(verification);

        await _context.SaveChangesAsync(cancellationToken);

        try
        {
            await _emailService.SendEmailConfirmationAsync(user.Email, code, linkToken, user.PreferredLanguage, cancellationToken);
        }
        catch (EmailDeliveryException)
        {
            _context.EmailVerifications.Remove(verification);
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
        var rawToken = request.Token.Trim();
        if (rawToken.Length == 6 && rawToken.All(char.IsDigit))
        {
            await ConfirmEmailCodeAsync(new ConfirmEmailCodeRequest(request.Email, rawToken), cancellationToken);
            return;
        }

        await ConfirmEmailLinkAsync(new ConfirmEmailLinkRequest(rawToken), cancellationToken);
    }

    public async Task ConfirmEmailCodeAsync(ConfirmEmailCodeRequest request, CancellationToken cancellationToken = default)
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

        var now = _dateTimeProvider.UtcNow;
        var verification = await _context.EmailVerifications
            .Where(ev => ev.UserId == user.Id && ev.ConsumedAtUtc == null)
            .OrderByDescending(ev => ev.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (verification == null)
        {
            throw new DomainException("Invalid or expired verification code.");
        }

        if (verification.Attempts >= 5)
        {
            throw new DomainException("Too many invalid attempts. This verification code has been locked. Please request a new code.");
        }

        if (now > verification.CodeExpiresAtUtc)
        {
            throw new DomainException("Verification code has expired. Please request a new code.");
        }

        var inputHash = ComputeCodeHash(request.Code.Trim());
        var isMatch = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(inputHash),
            Encoding.UTF8.GetBytes(verification.CodeHash));

        if (!isMatch)
        {
            verification.Attempts++;
            await _context.SaveChangesAsync(cancellationToken);
            var remaining = Math.Max(0, 5 - verification.Attempts);
            throw new DomainException($"Invalid verification code. {remaining} attempt(s) remaining.");
        }

        verification.ConsumedAtUtc = now;
        user.IsEmailConfirmed = true;
        user.EmailConfirmationTokenHash = null;
        user.EmailConfirmationExpiresAtUtc = null;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ConfirmEmailLinkAsync(ConfirmEmailLinkRequest request, CancellationToken cancellationToken = default)
    {
        var tokenHash = _tokenGenerator.HashToken(request.Token.Trim());
        var now = _dateTimeProvider.UtcNow;

        var verification = await _context.EmailVerifications
            .Include(ev => ev.User)
            .FirstOrDefaultAsync(ev => ev.LinkTokenHash == tokenHash && ev.ConsumedAtUtc == null, cancellationToken);

        if (verification != null)
        {
            if (now > verification.ExpiresAtUtc)
            {
                throw new DomainException("This confirmation link has expired. Please request a new one.");
            }

            verification.ConsumedAtUtc = now;
            verification.User.IsEmailConfirmed = true;
            verification.User.EmailConfirmationTokenHash = null;
            verification.User.EmailConfirmationExpiresAtUtc = null;

            await _context.SaveChangesAsync(cancellationToken);
            return;
        }

        // Direct user fallback
        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailConfirmationTokenHash == tokenHash, cancellationToken);
        if (user != null)
        {
            if (user.EmailConfirmationExpiresAtUtc.HasValue && user.EmailConfirmationExpiresAtUtc < now)
            {
                throw new DomainException("This confirmation link has expired. Please request a new one.");
            }

            user.IsEmailConfirmed = true;
            user.EmailConfirmationTokenHash = null;
            user.EmailConfirmationExpiresAtUtc = null;
            await _context.SaveChangesAsync(cancellationToken);
            return;
        }

        throw new DomainException("Invalid or expired email confirmation link.");
    }

    public async Task ResendConfirmationAsync(ResendConfirmationRequest request, CancellationToken cancellationToken = default)
    {
        await ResendConfirmationAsync(request, null, cancellationToken);
    }

    public async Task ResendConfirmationAsync(ResendConfirmationRequest request, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();
        var now = _dateTimeProvider.UtcNow;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == emailLower, cancellationToken);
        if (user == null || user.IsEmailConfirmed)
        {
            // Enumeration safe response: silently succeed
            return;
        }

        // 60-second cooldown per user
        var latestVerification = await _context.EmailVerifications
            .Where(ev => ev.UserId == user.Id)
            .OrderByDescending(ev => ev.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (latestVerification != null && (now - latestVerification.CreatedAtUtc).TotalSeconds < 60)
        {
            var remaining = 60 - (int)(now - latestVerification.CreatedAtUtc).TotalSeconds;
            throw new DomainException($"Please wait {remaining} seconds before requesting a new confirmation code.");
        }

        // Hourly limit (max 5 per user)
        var hourlyCount = await _context.EmailVerifications
            .CountAsync(ev => ev.UserId == user.Id && ev.CreatedAtUtc >= now.AddHours(-1), cancellationToken);

        if (hourlyCount >= 5)
        {
            throw new DomainException("Maximum verification requests exceeded for this hour. Please try again later.");
        }

        // Invalidate prior unconsumed verifications
        var unconsumed = await _context.EmailVerifications
            .Where(ev => ev.UserId == user.Id && ev.ConsumedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var old in unconsumed)
        {
            old.ConsumedAtUtc = now;
        }

        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
        var codeHash = ComputeCodeHash(code);
        var linkToken = GenerateLinkToken();
        var linkTokenHash = _tokenGenerator.HashToken(linkToken);

        var verification = new EmailVerification
        {
            UserId = user.Id,
            User = user,
            CodeHash = codeHash,
            LinkTokenHash = linkTokenHash,
            ExpiresAtUtc = now.AddHours(24),
            CodeExpiresAtUtc = now.AddMinutes(15),
            Attempts = 0,
            CreatedAtUtc = now,
            IpAddress = ipAddress
        };

        user.EmailConfirmationTokenHash = linkTokenHash;
        user.EmailConfirmationExpiresAtUtc = verification.ExpiresAtUtc;

        _context.EmailVerifications.Add(verification);
        await _context.SaveChangesAsync(cancellationToken);

        await _emailService.SendEmailConfirmationAsync(user.Email, code, linkToken, user.PreferredLanguage, cancellationToken);
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
            companyDto,
            user.PreferredLanguage ?? "ar");
    }

    public async Task<UserProfileResponse> UpdateUserProfileAsync(
        UpdateProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.Id;
        if (!userId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        user.FullName = request.FullName.Trim();
        user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();

        if (!string.IsNullOrWhiteSpace(request.PreferredLanguage))
        {
            user.PreferredLanguage = string.Equals(request.PreferredLanguage, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "ar";
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetCurrentUserProfileAsync(cancellationToken);
    }
}

