import api from '../utils/api';

/**
 * POST /rfqs
 */
export const createRfq = (data) =>
  api.post('/rfqs', data).then((r) => r.data);

/**
 * GET /rfqs — Supplier: browse published RFQs marketplace
 * @param {object} params - { categoryId, materialId, governorate, city, searchTerm, closingBeforeUtc, pageNumber, pageSize }
 */
export const getPublishedRfqs = (params) =>
  api.get('/rfqs', { params }).then((r) => r.data);

/**
 * GET /rfqs/mine — Buyer: own RFQs
 * @param {object} params - { status, pageNumber, pageSize }
 */
export const getMyRfqs = (params) =>
  api.get('/rfqs/mine', { params }).then((r) => r.data);

/** GET /rfqs/:id */
export const getRfqById = (id) =>
  api.get(`/rfqs/${id}`).then((r) => r.data);

/** PUT /rfqs/:id */
export const updateRfq = (id, data) =>
  api.put(`/rfqs/${id}`, data).then((r) => r.data);

/** POST /rfqs/:id/publish */
export const publishRfq = (id) =>
  api.post(`/rfqs/${id}/publish`).then((r) => r.data);

/** POST /rfqs/:id/close */
export const closeRfq = (id) =>
  api.post(`/rfqs/${id}/close`).then((r) => r.data);

/** POST /rfqs/:id/cancel */
export const cancelRfq = (id) =>
  api.post(`/rfqs/${id}/cancel`).then((r) => r.data);

/** GET /rfqs/:rfqId/offers — Buyer: all offers on their RFQ */
export const getRfqOffers = (rfqId) =>
  api.get(`/rfqs/${rfqId}/offers`).then((r) => r.data);

/** GET /rfqs/:rfqId/offers/mine — Supplier: my offer on this RFQ */
export const getMyOfferOnRfq = (rfqId) =>
  api.get(`/rfqs/${rfqId}/offers/mine`).then((r) => r.data);

