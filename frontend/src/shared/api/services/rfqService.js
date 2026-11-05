import api from '../axios'

export const rfqService = {
  create: (data) =>
    api.post('/rfqs', data).then((r) => r.data),

  get: (id) =>
    api.get(`/rfqs/${id}`).then((r) => r.data),

  getMine: (params) =>
    api.get('/rfqs/mine', { params }).then((r) => r.data),

  discover: (params) =>
    api.get('/rfqs', { params }).then((r) => r.data),

  update: (id, data) =>
    api.put(`/rfqs/${id}`, data).then((r) => r.data),

  publish: (id) =>
    api.post(`/rfqs/${id}/publish`).then((r) => r.data),

  close: (id) =>
    api.post(`/rfqs/${id}/close`).then((r) => r.data),

  cancel: (id) =>
    api.post(`/rfqs/${id}/cancel`).then((r) => r.data),
}

