namespace DealZone.Domain.Exceptions;

public class EmailDeliveryException : DomainException
{
    public EmailDeliveryException(string message) : base(message)
    {
    }

    public EmailDeliveryException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
