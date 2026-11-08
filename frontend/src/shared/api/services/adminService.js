import api from '../axios'

export const adminService = {
  // Verification
  getPendingCompanies: () =>
    api.get('/admin/verification/pending').then((r) => r.data),

  getCompanyVerificationDetail: (companyId) =>
    api.get(`/admin/verification/${companyId}`).then((r) => r.data),

  approveCompany: (companyId) =>
    api.post(`/admin/verification/${companyId}/approve`).then((r) => r.data),

  rejectCompany: (companyId, reason) =>
    api.post(`/admin/verification/${companyId}/reject`, { reason }).then((r) => r.data),

  requestCompanyChanges: (companyId, reason) =>
    api.post(`/admin/verification/${companyId}/request-changes`, { reason }).then((r) => r.data),

  getDocumentDownloadUrl: (companyId, documentId) =>
    `/admin/verification/${companyId}/documents/${documentId}/download`,

  downloadDocument: (companyId, documentId) =>
    api
      .get(`/admin/verification/${companyId}/documents/${documentId}/download`, {
        responseType: 'blob',
      })
      .then((r) => r.data),

  // Analytics & Reporting
  getAnalytics: (params) =>
    api.get('/admin/analytics', { params }).then((r) => r.data),

  exportCompaniesCsv: () =>
    api.get('/admin/analytics/export/companies', { responseType: 'blob' }).then((r) => r.data),

  exportDealsCsv: () =>
    api.get('/admin/analytics/export/deals', { responseType: 'blob' }).then((r) => r.data),

  // Shipping providers
  createShippingProvider: (data) =>
    api.post('/admin/shipping-providers', data).then((r) => r.data),

  getShippingProviders: (params) =>
    api.get('/admin/shipping-providers', { params }).then((r) => r.data),

  getShippingProvider: (id) =>
    api.get(`/admin/shipping-providers/${id}`).then((r) => r.data),

  updateShippingProvider: (id, data) =>
    api.put(`/admin/shipping-providers/${id}`, data).then((r) => r.data),

  activateShippingProvider: (id) =>
    api.post(`/admin/shipping-providers/${id}/activate`).then((r) => r.data),

  deactivateShippingProvider: (id) =>
    api.post(`/admin/shipping-providers/${id}/deactivate`).then((r) => r.data),

  deleteShippingProvider: (id) =>
    api.delete(`/admin/shipping-providers/${id}`).then((r) => r.data),

  // Admin shipments
  getAllShipments: (params) =>
    api.get('/admin/shipments', { params }).then((r) => r.data),

  assignShippingProvider: (shipmentId, providerId, trackingNumber, estimatedDeliveryDateUtc, notes) =>
    api
      .post(`/admin/shipments/${shipmentId}/assign-provider`, {
        shippingProviderId: providerId,
        trackingNumber,
        estimatedDeliveryDateUtc,
        notes,
      })
      .then((r) => r.data),

  updateShipmentStatus: (shipmentId, status, location, description) =>
    api
      .post(`/admin/shipments/${shipmentId}/status`, { status, location, description })
      .then((r) => r.data),
}
