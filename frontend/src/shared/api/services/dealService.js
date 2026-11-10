import api from '../axios'

export const dealService = {
  getMine: (params) =>
    api.get('/deals/mine', { params }).then((r) => r.data),

  get: (id) =>
    api.get(`/deals/${id}`).then((r) => r.data),

  confirm: (id) =>
    api.post(`/deals/${id}/confirm`).then((r) => r.data),

  start: (id) =>
    api.post(`/deals/${id}/start`).then((r) => r.data),

  complete: (id) =>
    api.post(`/deals/${id}/complete`).then((r) => r.data),

  cancel: (id, reason) =>
    api.post(`/deals/${id}/cancel`, { reason }).then((r) => r.data),

  openDispute: (id, category, description) =>
    api.post(`/deals/${id}/disputes`, { category, description }).then((r) => r.data),

  getDisputes: (id) =>
    api.get(`/deals/${id}/disputes`).then((r) => r.data),

  // Shipments
  createShipment: (dealId, data) =>
    api.post(`/deals/${dealId}/shipments`, data).then((r) => r.data),

  getDealShipments: (dealId) =>
    api.get(`/deals/${dealId}/shipments`).then((r) => r.data),

  // Reviews
  submitReview: (dealId, rating, comment) =>
    api.post(`/deals/${dealId}/reviews`, { rating, comment }).then((r) => r.data),

  getDealReviews: (dealId) =>
    api.get(`/deals/${dealId}/reviews`).then((r) => r.data),
}

export const shipmentService = {
  getMine: (params) =>
    api.get('/shipments/mine', { params }).then((r) => r.data),

  get: (id) =>
    api.get(`/shipments/${id}`).then((r) => r.data),

  updateTracking: (id, data) =>
    api.put(`/shipments/${id}/tracking`, data).then((r) => r.data),

  updateStatus: (id, status, location, description) =>
    api.post(`/shipments/${id}/status`, { status, location, description }).then((r) => r.data),
}

export const adminDisputeService = {
  getAll: (params) =>
    api.get('/admin/disputes', { params }).then((r) => r.data),

  get: (id) =>
    api.get(`/admin/disputes/${id}`).then((r) => r.data),

  resolve: (id, action, resolutionNotes) =>
    api.post(`/admin/disputes/${id}/resolve`, { action, resolutionNotes }).then((r) => r.data),
}

