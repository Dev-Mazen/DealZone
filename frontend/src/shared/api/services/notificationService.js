import api from '../axios'

export const notificationService = {
  getAll: (params) =>
    api.get('/notifications', { params }).then((r) => r.data),

  getUnreadCount: () =>
    api.get('/notifications/unread-count').then((r) => r.data),

  markAsRead: (id) =>
    api.post(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    api.post('/notifications/read-all').then((r) => r.data),
}

