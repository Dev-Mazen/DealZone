using DealZone.Domain.Exceptions;

namespace DealZone.UnitTests.Exceptions;

public class DomainExceptionTests
{
    [Fact]
    public void NotFoundException_WithMessage_ShouldSetMessageProperly()
    {
        var exception = new NotFoundException("Company profile not found.");

        Assert.Equal("Company profile not found.", exception.Message);
    }

    [Fact]
    public void NotFoundException_WithEntityAndKey_ShouldFormatStandardMessage()
    {
        var id = Guid.NewGuid();
        var exception = new NotFoundException("User", id);

        Assert.Equal($"Entity \"User\" ({id}) was not found.", exception.Message);
    }

    [Fact]
    public void ConflictException_ShouldSetMessage()
    {
        var exception = new ConflictException("Tax identification number already registered.");

        Assert.Equal("Tax identification number already registered.", exception.Message);
    }

    [Fact]
    public void UnauthorizedException_ShouldUseDefaultMessageWhenOmitted()
    {
        var exception = new UnauthorizedException();

        Assert.Equal("You are not authorized to perform this action.", exception.Message);
    }

    [Fact]
    public void ForbiddenException_ShouldUseDefaultMessageWhenOmitted()
    {
        var exception = new ForbiddenException();

        Assert.Equal("You do not have permission to access this resource.", exception.Message);
    }
}

