import api from '../utils/api';

/**
 * GET /deals/mine
 * @param {object} params - { status, pageNumber, pageSize }
 */
export const getMyDeals = (params) =>
  api.get('/deals/mine', { params }).then((r) => r.data);

/** GET /deals/:id */
export const getDealById = (id) =>
  api.get(`/deals/${id}`).then((r) => r.data);

/** POST /deals/:id/confirm */
export const confirmDeal = (id) =>
  api.post(`/deals/${id}/confirm`).then((r) => r.data);

/** POST /deals/:id/start */
export const startDeal = (id) =>
  api.post(`/deals/${id}/start`).then((r) => r.data);

/** POST /deals/:id/complete */
export const completeDeal = (id) =>
  api.post(`/deals/${id}/complete`).then((r) => r.data);

/** POST /deals/:id/cancel */
export const cancelDeal = (id, data) =>
  api.post(`/deals/${id}/cancel`, data).then((r) => r.data);

/** POST /deals/:id/disputes */
export const openDispute = (id, data) =>
  api.post(`/deals/${id}/disputes`, data).then((r) => r.data);

/** GET /deals/:id/disputes */
export const getDealDisputes = (id) =>
  api.get(`/deals/${id}/disputes`).then((r) => r.data);

/** POST /deals/:dealId/shipments */
export const createShipment = (dealId, data) =>
  api.post(`/deals/${dealId}/shipments`, data).then((r) => r.data);

/** GET /deals/:dealId/shipments */
export const getDealShipments = (dealId) =>
  api.get(`/deals/${dealId}/shipments`).then((r) => r.data);

/** GET /shipments/:id */
export const getShipmentById = (id) =>
  api.get(`/shipments/${id}`).then((r) => r.data);

/** PUT /shipments/:id/tracking */
export const updateShipmentTracking = (id, data) =>
  api.put(`/shipments/${id}/tracking`, data).then((r) => r.data);

/** POST /shipments/:id/status */
export const updateShipmentStatus = (id, data) =>
  api.post(`/shipments/${id}/status`, data).then((r) => r.data);

/** POST /deals/:dealId/reviews */
export const submitReview = (dealId, data) =>
  api.post(`/deals/${dealId}/reviews`, data).then((r) => r.data);

/** GET /deals/:dealId/reviews */
export const getDealReviews = (dealId) =>
  api.get(`/deals/${dealId}/reviews`).then((r) => r.data);

