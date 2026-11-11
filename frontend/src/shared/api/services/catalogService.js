import api from '../axios'

export const catalogService = {
  getCategories: () =>
    api.get('/catalog/categories').then((r) => r.data),

  getCategory: (id) =>
    api.get(`/catalog/categories/${id}`).then((r) => r.data),

  getMaterials: (params) =>
    api.get('/catalog/materials', { params }).then((r) => r.data),

  getMaterial: (id) =>
    api.get(`/catalog/materials/${id}`).then((r) => r.data),

  getUnits: () =>
    api.get('/catalog/units').then((r) => r.data),

  getUnit: (id) =>
    api.get(`/catalog/units/${id}`).then((r) => r.data),

  // Direct Catalog Purchase Contract
  getProducts: (params) =>
    api.get('/catalog/products', { params }).then((r) => r.data),

  getProduct: (id) =>
    api.get(`/catalog/products/${id}`).then((r) => r.data),

  directPurchase: (materialId, payload) =>
    api.post(`/catalog/materials/${materialId}/purchase`, payload).then((r) => r.data),

  // Admin catalog
  createCategory: (data) =>
    api.post('/admin/catalog/categories', data).then((r) => r.data),

  updateCategory: (id, data) =>
    api.put(`/admin/catalog/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id) =>
    api.delete(`/admin/catalog/categories/${id}`).then((r) => r.data),

  createMaterial: (data) =>
    api.post('/admin/catalog/materials', data).then((r) => r.data),

  updateMaterial: (id, data) =>
    api.put(`/admin/catalog/materials/${id}`, data).then((r) => r.data),

  deleteMaterial: (id) =>
    api.delete(`/admin/catalog/materials/${id}`).then((r) => r.data),

  createUnit: (data) =>
    api.post('/admin/catalog/units', data).then((r) => r.data),

  updateUnit: (id, data) =>
    api.put(`/admin/catalog/units/${id}`, data).then((r) => r.data),

  deleteUnit: (id) =>
    api.delete(`/admin/catalog/units/${id}`).then((r) => r.data),
}

