import { useQuery } from '@tanstack/react-query';
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from '../api/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const NOTIF_KEYS = {
  count: ['notifications', 'unread-count'],
  list:  (params) => ['notifications', 'list', params],
};

/** Badge counter — lightweight, polls every 60s */
export const useUnreadCount = (enabled = true) =>
  useQuery({
    queryKey: NOTIF_KEYS.count,
    queryFn:  getUnreadCount,
    enabled,
    refetchInterval: 60_000,
    select: (d) => d.unreadCount ?? 0,
  });

/** Paginated notification list */
export const useNotifications = (params = {}) =>
  useQuery({
    queryKey: NOTIF_KEYS.list(params),
    queryFn:  () => getNotifications(params),
    enabled: true,
  });

/** Mark single notification as read */
export const useMarkAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

/** Mark all notifications as read */
export const useMarkAllAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

