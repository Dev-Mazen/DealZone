import api from '../axios'

export const tenderService = {
  // Buyer creates a new tender
  create: (data) =>
    api.post('/tenders', data).then((r) => r.data),

  // Update a draft tender
  update: (id, data) =>
    api.put(`/tenders/${id}`, data).then((r) => r.data),

  // Publish a draft tender
  publish: (id) =>
    api.post(`/tenders/${id}/publish`).then((r) => r.data),

  // Close a published tender early
  close: (id) =>
    api.post(`/tenders/${id}/close`).then((r) => r.data),

  // Reopen a closed tender
  reopen: (id, data) =>
    api.post(`/tenders/${id}/reopen`, data).then((r) => r.data),

  // Cancel a tender
  cancel: (id, reason) =>
    api.post(`/tenders/${id}/cancel`, { reason }).then((r) => r.data),

  // Reject all bids (no award)
  noAward: (id, reason) =>
    api.post(`/tenders/${id}/no-award`, { reason }).then((r) => r.data),

  // Award tender to a specific bid
  award: (id, bidId, rationale) =>
    api.post(`/tenders/${id}/award`, { bidId, rationale }).then((r) => r.data),

  // Get tender detail by ID
  get: (id) =>
    api.get(`/tenders/${id}`).then((r) => r.data),

  // List buyer's own tenders
  getMine: (params) =>
    api.get('/tenders/mine', { params }).then((r) => r.data),

  // Discover published tenders (for suppliers)
  discover: (params) =>
    api.get('/tenders/discover', { params }).then((r) => r.data),

  // Get all bids for a tender (buyer only)
  getTenderBids: (tenderId) =>
    api.get(`/tenders/${tenderId}/bids`).then((r) => r.data),

  // Submit a bid for a tender
  submitBid: (tenderId, data) =>
    api.post(`/tenders/${tenderId}/bids`, data).then((r) => r.data),

  // Revise an existing bid
  reviseBid: (bidId, data) =>
    api.put(`/tenders/bids/${bidId}/revise`, data).then((r) => r.data),

  // Withdraw a bid
  withdrawBid: (bidId, reason) =>
    api.post(`/tenders/bids/${bidId}/withdraw`, { reason }).then((r) => r.data),

  // Get bid detail
  getBid: (bidId) =>
    api.get(`/tenders/bids/${bidId}`).then((r) => r.data),

  // List supplier's own bids
  getMyBids: (params) =>
    api.get('/tenders/bids/mine', { params }).then((r) => r.data),
}
