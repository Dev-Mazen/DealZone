import api from '../utils/api';

/**
 * GET /notifications
 * @param {object} params - { isRead, pageNumber, pageSize }
 */
export const getNotifications = (params) =>
  api.get('/notifications', { params }).then((r) => r.data);

/** GET /notifications/unread-count */
export const getUnreadCount = () =>
  api.get('/notifications/unread-count').then((r) => r.data);

/** POST /notifications/:id/read */
export const markAsRead = (id) =>
  api.post(`/notifications/${id}/read`).then((r) => r.data);

/** POST /notifications/read-all */
export const markAllAsRead = () =>
  api.post('/notifications/read-all').then((r) => r.data);

