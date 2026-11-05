import axios from 'axios'

// ============================================================
// Configuration
// ============================================================

export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5023/api/v1'

// ============================================================
// Token storage (in-memory + localStorage for persistence)
// ============================================================

let accessToken = null

export const tokenStore = {
  getAccess: () => accessToken,
  setAccess: (t) => { accessToken = t },
  getRefresh: () => localStorage.getItem('dz_refresh'),
  setRefresh: (t) => {
    if (t) localStorage.setItem('dz_refresh', t)
    else localStorage.removeItem('dz_refresh')
  },
  clearAll: () => {
    accessToken = null
    localStorage.removeItem('dz_refresh')
  },
}

// ============================================================
// Axios instance
// ============================================================

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
})

// ============================================================
// Request interceptor — attach access token + language header
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = tokenStore.getAccess()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const lang = localStorage.getItem('dz_lang') || 'en'
    config.headers['Accept-Language'] = lang === 'ar' ? 'ar-EG' : 'en-US'
    return config
  },
  (err) => Promise.reject(err),
)

// ============================================================
// Refresh token queue — prevents concurrent 401 spamming
// ============================================================

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

// ============================================================
// Response interceptor — 401 refresh, error normalization
// ============================================================

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // ── 401 handling with token refresh ──
    if (
      error.response?.status === 401 &&
      !original._retry &&
      original.url !== '/auth/refresh'
    ) {
      if (isRefreshing) {
        // Queue the request until refresh resolves
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refreshToken = tokenStore.getRefresh()
      if (!refreshToken) {
        // No refresh token — clear state and reject
        tokenStore.clearAll()
        processQueue(error, null)
        isRefreshing = false
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
        return Promise.reject(buildApiError(error))
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        })
        tokenStore.setAccess(data.accessToken)
        tokenStore.setRefresh(data.refreshToken)
        processQueue(null, data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        isRefreshing = false
        return api(original)
      } catch (refreshErr) {
        tokenStore.clearAll()
        processQueue(refreshErr, null)
        isRefreshing = false
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
        return Promise.reject(buildApiError(refreshErr))
      }
    }

    return Promise.reject(buildApiError(error))
  },
)

// ============================================================
// Error normalizer
// ============================================================

export function buildApiError(error) {
  const problem = (error.response?.data) || {
    status: error.response?.status ?? 0,
    title: error.message || 'Network Error',
  }

  const apiError = new Error(problem.detail || problem.title)
  apiError.status = problem.status || error.response?.status || 0
  apiError.problem = problem

  return apiError
}

export default api

