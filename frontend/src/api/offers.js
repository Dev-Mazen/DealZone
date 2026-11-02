import api from '../utils/api';

/**
 * POST /rfqs/:rfqId/offers — Supplier: submit offer
 */
export const createOffer = (rfqId, data) =>
  api.post(`/rfqs/${rfqId}/offers`, data).then((r) => r.data);

/** GET /offers/:id */
export const getOfferById = (id) =>
  api.get(`/offers/${id}`).then((r) => r.data);

/**
 * GET /offers/mine — Supplier: all my submitted offers
 * @param {object} params - { pageNumber, pageSize }
 */
export const getMyOffers = (params) =>
  api.get('/offers/mine', { params }).then((r) => r.data);

/** POST /offers/:id/revise */
export const reviseOffer = (id, data) =>
  api.post(`/offers/${id}/revise`, data).then((r) => r.data);

/** GET /offers/:id/revisions */
export const getOfferRevisions = (id) =>
  api.get(`/offers/${id}/revisions`).then((r) => r.data);

/** POST /offers/:id/accept */
export const acceptOffer = (id) =>
  api.post(`/offers/${id}/accept`).then((r) => r.data);

/** POST /offers/:id/reject */
export const rejectOffer = (id, data) =>
  api.post(`/offers/${id}/reject`, data).then((r) => r.data);

