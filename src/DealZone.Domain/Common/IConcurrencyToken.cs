namespace DealZone.Domain.Common;

public interface IConcurrencyToken
{
    byte[] RowVersion { get; set; }
}

