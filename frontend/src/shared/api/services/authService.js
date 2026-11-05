import api from '../axios'

export const authService = {
  register: (data) =>
    api.post('/auth/register', data).then((r) => r.data),

  confirmEmail: (email, token) =>
    api.post('/auth/confirm-email', { email, token }).then((r) => r.data),

  resendConfirmation: (email) =>
    api.post('/auth/resend-confirmation', { email }).then((r) => r.data),

  login: (data) =>
    api.post('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken) =>
    api.post('/auth/logout', refreshToken ? { refreshToken } : {}).then((r) => r.data),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (email, token, newPassword) =>
    api.post('/auth/reset-password', { email, token, newPassword }).then((r) => r.data),

  me: () =>
    api.get('/auth/me').then((r) => r.data),
}

