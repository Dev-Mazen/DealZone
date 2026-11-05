import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { notificationService } from '../../shared/api/services/notificationService'
import { useTranslation } from '../../hooks/useTranslation'
import { useToast } from '../../hooks/useToast'
import { formatRelativeTime } from '../../utils/format'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { PageSpinner } from '../../components/ui/Spinner'

export default function NotificationsPage() {
  const { t, language } = useTranslation()
  const toast = useToast()
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all') // 'all' | 'unread'

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () =>
      notificationService.getAll({
        isRead: filter === 'unread' ? false : undefined,
        pageSize: 50,
      }),
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: (res) => {
      toast.success(`Marked ${res?.markedAsReadCount ?? 0} notifications as read`)
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => toast.error('Failed to mark all as read'),
  })

  const notifications = data?.items ?? []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (isLoading) return <PageSpinner />

  if (error) {
    return (
      <div className="text-center py-16 text-[#EF4444]">
        {t('common.errorLoadingData')}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#06245B]">
            {t('notification.title')}
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-[#64748B] mt-1">
              {t('notification.unread', { count: unreadCount })}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            icon={<CheckCheck size={16} />}
            loading={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            {t('notification.markAllRead')}
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              filter === f
                ? 'bg-[#06245B] text-white'
                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#EAF4FF]',
            ].join(' ')}
          >
            {f === 'all' ? t('common.all') : 'Unread'}
          </button>
        ))}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('notification.noNotifications')}
          description="You're all caught up!"
        />
      ) : (
        <Card noPadding>
          <ul className="divide-y divide-[rgba(6,36,91,0.06)]">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={[
                  'flex items-start gap-4 px-5 py-4 transition-colors',
                  !n.isRead ? 'bg-[#EAF4FF]' : 'hover:bg-[#F8FAFC]',
                ].join(' ')}
              >
                {/* Unread indicator */}
                <div className="pt-1 shrink-0">
                  {!n.isRead ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00D9F5]" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={[
                    'text-sm leading-relaxed',
                    !n.isRead ? 'font-semibold text-[#06245B]' : 'text-[#475569]',
                  ].join(' ')}>
                    {n.message}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    {formatRelativeTime(n.createdAt, language)}
                  </p>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markReadMutation.mutate(n.id)}
                    disabled={markReadMutation.isPending}
                    className="shrink-0 text-xs text-[#1266D6] hover:text-[#06245B] transition-colors whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

