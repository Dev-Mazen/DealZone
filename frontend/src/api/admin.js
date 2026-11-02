import api from '../utils/api';

// ─── Admin: Verification ───────────────────────────────────────────────────────

/** GET /admin/verification/pending */
export const getPendingVerifications = (params) =>
  api.get('/admin/verification/pending', { params }).then((r) => r.data);

/** GET /admin/verification/:companyId */
export const getCompanyVerificationDetails = (companyId) =>
  api.get(`/admin/verification/${companyId}`).then((r) => r.data);

/** POST /admin/verification/:companyId/approve */
export const approveCompany = (companyId) =>
  api.post(`/admin/verification/${companyId}/approve`).then((r) => r.data);

/** POST /admin/verification/:companyId/reject */
export const rejectCompany = (companyId, data) =>
  api.post(`/admin/verification/${companyId}/reject`, data).then((r) => r.data);

/** POST /admin/verification/:companyId/request-changes */
export const requestChanges = (companyId, data) =>
  api.post(`/admin/verification/${companyId}/request-changes`, data).then((r) => r.data);

/** GET /admin/verification/:companyId/documents/:documentId/download */
export const downloadDocument = (companyId, documentId) =>
  api.get(`/admin/verification/${companyId}/documents/${documentId}/download`, {
    responseType: 'blob',
  });

// ─── Admin: Catalog ────────────────────────────────────────────────────────────

export const adminCreateCategory = (data) =>
  api.post('/admin/catalog/categories', data).then((r) => r.data);

export const adminUpdateCategory = (id, data) =>
  api.put(`/admin/catalog/categories/${id}`, data).then((r) => r.data);

export const adminDeleteCategory = (id) =>
  api.delete(`/admin/catalog/categories/${id}`);

export const adminCreateMaterial = (data) =>
  api.post('/admin/catalog/materials', data).then((r) => r.data);

export const adminUpdateMaterial = (id, data) =>
  api.put(`/admin/catalog/materials/${id}`, data).then((r) => r.data);

export const adminDeleteMaterial = (id) =>
  api.delete(`/admin/catalog/materials/${id}`);

export const adminCreateUnit = (data) =>
  api.post('/admin/catalog/units', data).then((r) => r.data);

export const adminUpdateUnit = (id, data) =>
  api.put(`/admin/catalog/units/${id}`, data).then((r) => r.data);

export const adminDeleteUnit = (id) =>
  api.delete(`/admin/catalog/units/${id}`);

// ─── Admin: Disputes ───────────────────────────────────────────────────────────

export const getAllDisputes = (params) =>
  api.get('/admin/disputes', { params }).then((r) => r.data);

export const getDisputeById = (id) =>
  api.get(`/admin/disputes/${id}`).then((r) => r.data);

export const resolveDispute = (id, data) =>
  api.post(`/admin/disputes/${id}/resolve`, data).then((r) => r.data);

// ─── Admin: Shipping Providers ─────────────────────────────────────────────────

export const createShippingProvider = (data) =>
  api.post('/admin/shipping-providers', data).then((r) => r.data);

export const getShippingProviders = (params) =>
  api.get('/admin/shipping-providers', { params }).then((r) => r.data);

export const getShippingProviderById = (id) =>
  api.get(`/admin/shipping-providers/${id}`).then((r) => r.data);

export const updateShippingProvider = (id, data) =>
  api.put(`/admin/shipping-providers/${id}`, data).then((r) => r.data);

export const activateShippingProvider = (id) =>
  api.post(`/admin/shipping-providers/${id}/activate`).then((r) => r.data);

export const deactivateShippingProvider = (id) =>
  api.post(`/admin/shipping-providers/${id}/deactivate`).then((r) => r.data);

export const deleteShippingProvider = (id) =>
  api.delete(`/admin/shipping-providers/${id}`);

export const getAllShipments = (params) =>
  api.get('/admin/shipments', { params }).then((r) => r.data);

export const adminAssignShippingProvider = (shipmentId, data) =>
  api.post(`/admin/shipments/${shipmentId}/assign-provider`, data).then((r) => r.data);

export const adminUpdateShipmentStatus = (shipmentId, data) =>
  api.post(`/admin/shipments/${shipmentId}/status`, data).then((r) => r.data);

