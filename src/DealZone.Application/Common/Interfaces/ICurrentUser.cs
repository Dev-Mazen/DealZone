namespace DealZone.Application.Common.Interfaces;

public interface ICurrentUser
{
    Guid? Id { get; }
    Guid? CompanyId { get; }
    string? Email { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
    bool IsSystemAdmin { get; }
}

