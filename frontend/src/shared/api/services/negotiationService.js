import api from '../axios'

export const negotiationService = {
  create: (data) =>
    api.post('/negotiations', data).then((r) => r.data),

  getMine: (params) =>
    api.get('/negotiations/mine', { params }).then((r) => r.data),

  getById: (id) =>
    api.get(`/negotiations/${id}`).then((r) => r.data),

  counter: (id, data) =>
    api.post(`/negotiations/${id}/counter`, data).then((r) => r.data),

  accept: (id) =>
    api.post(`/negotiations/${id}/accept`).then((r) => r.data),

  reject: (id, data) =>
    api.post(`/negotiations/${id}/reject`, data).then((r) => r.data),

  cancel: (id) =>
    api.post(`/negotiations/${id}/cancel`).then((r) => r.data),
}

