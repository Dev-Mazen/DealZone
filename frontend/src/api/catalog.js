import api from '../utils/api';

/** GET /catalog/categories */
export const getCategories = () =>
  api.get('/catalog/categories').then((r) => r.data);

/** GET /catalog/categories/:id */
export const getCategoryById = (id) =>
  api.get(`/catalog/categories/${id}`).then((r) => r.data);

/**
 * GET /catalog/materials
 * @param {object} params - { categoryId, searchTerm, activeOnly, pageNumber, pageSize, sortBy, sortDescending }
 */
export const getMaterials = (params) =>
  api.get('/catalog/materials', { params }).then((r) => r.data);

/** GET /catalog/materials/:id */
export const getMaterialById = (id) =>
  api.get(`/catalog/materials/${id}`).then((r) => r.data);

/** GET /catalog/units */
export const getUnits = () =>
  api.get('/catalog/units').then((r) => r.data);

/** GET /catalog/units/:id */
export const getUnitById = (id) =>
  api.get(`/catalog/units/${id}`).then((r) => r.data);

