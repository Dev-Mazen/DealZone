import api, { saveTokens, clearTokens } from '../utils/api';

/**
 * POST /auth/register
 */
export const register = (data) =>
  api.post('/auth/register', data).then((r) => r.data);

/**
 * POST /auth/confirm-email
 */
export const confirmEmail = (data) =>
  api.post('/auth/confirm-email', data).then((r) => r.data);

/**
 * POST /auth/resend-confirmation
 */
export const resendConfirmation = (data) =>
  api.post('/auth/resend-confirmation', data).then((r) => r.data);

/**
 * POST /auth/login → saves tokens, returns full response
 */
export const login = async (data) => {
  const res = await api.post('/auth/login', data);
  const { accessToken, refreshToken } = res.data;
  saveTokens(accessToken, refreshToken);
  return res.data;
};

/**
 * POST /auth/logout → clears tokens
 */
export const logout = async () => {
  const refreshToken = localStorage.getItem('dz_refresh_token');
  try {
    await api.post('/auth/logout', { refreshToken });
  } finally {
    clearTokens();
  }
};

/**
 * POST /auth/refresh
 */
export const refreshToken = (data) =>
  api.post('/auth/refresh', data).then((r) => r.data);

/**
 * POST /auth/forgot-password
 */
export const forgotPassword = (data) =>
  api.post('/auth/forgot-password', data).then((r) => r.data);

/**
 * POST /auth/reset-password
 */
export const resetPassword = (data) =>
  api.post('/auth/reset-password', data).then((r) => r.data);

/**
 * GET /auth/me
 */
export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);

