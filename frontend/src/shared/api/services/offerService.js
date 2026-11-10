import api from '../axios'

export const offerService = {
  // Supplier submits offer for an RFQ
  create: (rfqId, data) =>
    api.post(`/rfqs/${rfqId}/offers`, data).then((r) => r.data),

  // Supplier views their own offer for an RFQ
  getMyOfferForRfq: (rfqId) =>
    api.get(`/rfqs/${rfqId}/offers/mine`).then((r) => r.data),

  // Buyer views all offers for their RFQ
  getOffersForRfq: (rfqId) =>
    api.get(`/rfqs/${rfqId}/offers`).then((r) => r.data),

  // Alias used in RfqDetailPage
  getForRfq: (rfqId) =>
    api.get(`/rfqs/${rfqId}/offers`).then((r) => r.data),

  // Get single offer details
  get: (id) =>
    api.get(`/offers/${id}`).then((r) => r.data),

  // Supplier views all their submitted offers
  getMine: (params) =>
    api.get('/offers/mine', { params }).then((r) => r.data),

  // Buyer views all received offers across their RFQs
  getReceived: (params) =>
    api.get('/offers/received', { params }).then((r) => r.data),

  // Supplier revises offer
  revise: (id, data) =>
    api.post(`/offers/${id}/revise`, data).then((r) => r.data),

  // Get revision lineage
  getRevisions: (id) =>
    api.get(`/offers/${id}/revisions`).then((r) => r.data),

  // Buyer accepts offer — atomically creates deal
  accept: (id, notes) =>
    api.post(`/offers/${id}/accept`, { notes }).then((r) => r.data),

  // Buyer rejects offer
  reject: (id, reason) =>
    api.post(`/offers/${id}/reject`, { reason }).then((r) => r.data),

  // Supplier withdraws submitted or under-review offer
  withdraw: (id, reason) =>
    api.post(`/offers/${id}/withdraw`, { reason }).then((r) => r.data),
}
