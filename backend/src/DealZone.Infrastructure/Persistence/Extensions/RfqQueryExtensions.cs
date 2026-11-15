using DealZone.Domain.Rfqs;

namespace DealZone.Infrastructure.Persistence.Extensions;

public static class RfqQueryExtensions
{
    /// <summary>
    /// Reusable server-side query rule for targeted RFQs:
    /// An RFQ is visible to a supplier if it is public (TargetSupplierCompanyId is null)
    /// OR specifically targeted to that supplier company.
    /// </summary>
    public static IQueryable<Rfq> VisibleToSupplier(this IQueryable<Rfq> query, Guid supplierCompanyId)
    {
        return query.Where(r => r.TargetSupplierCompanyId == null || r.TargetSupplierCompanyId == supplierCompanyId);
    }
}
