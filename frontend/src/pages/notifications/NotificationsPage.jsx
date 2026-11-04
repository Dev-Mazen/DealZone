import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Mail, Handshake, Tag, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications';
import Button from '../../components/ui/Button';

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

const NOTIF_TYPE_MAP = {
  NewOffer:             { icon: Tag,          color: '#00D9F5', link: id => `/rfqs/${id}` },
  OfferAccepted:        { icon: CheckCircle,  color: '#10B981', link: id => `/offers/${id}` },
  OfferRejected:        { icon: AlertCircle,  color: '#EF4444', link: id => `/offers/${id}` },
  DealCreated:          { icon: Handshake,    color: '#1266D6', link: id => `/deals/${id}` },
  DealConfirmed:        { icon: CheckCircle,  color: '#10B981', link: id => `/deals/${id}` },
  DealCompleted:        { icon: CheckCircle,  color: '#10B981', link: id => `/deals/${id}` },
  DealCancelled:        { icon: AlertCircle,  color: '#EF4444', link: id => `/deals/${id}` },
  DisputeOpened:        { icon: AlertCircle,  color: '#F59E0B', link: id => `/deals/${id}` },
  DisputeResolved:      { icon: CheckCircle,  color: '#10B981', link: id => `/deals/${id}` },
  RfqExpired:           { icon: FileText,     color: '#F59E0B', link: id => `/rfqs/${id}` },
  VerificationApproved: { icon: CheckCircle,  color: '#10B981', link: () => '/profile' },
  VerificationRejected: { icon: AlertCircle,  color: '#EF4444', link: () => '/profile' },
  VerificationPending:  { icon: Info,         color: '#1266D6', link: () => '/profile' },
};

function NotifIcon({ type }) {
  const cfg = NOTIF_TYPE_MAP[type] || { icon: Bell, color: '#94A3B8' };
  const Ic = cfg.icon;
  return (
    <div style={{
      width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
      background: `${cfg.color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Ic size={20} style={{ color: cfg.color }} />
    </div>
  );
}

export default function NotificationsPage() {
  const [page, setPage]       = useState(1);
  const [readFilter, setRead] = useState(''); // '' | 'unread'
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', { page, readFilter }],
    queryFn: () => getNotifications({
      pageNumber: page,
      pageSize: 15,
      isRead: readFilter === 'unread' ? false : undefined,
    }),
  });

  const notifs     = data?.items ?? data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? notifs.length;

  const markReadMut = useMutation({
    mutationFn: (notifId) => markAsRead(notifId),
    onSuccess: () => {
      qc.invalidateQueries(['notifications']);
      qc.invalidateQueries(['unread-count']);
    },
  });

  const markAllMut = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries(['notifications']);
      qc.invalidateQueries(['unread-count']);
    },
  });

  const handleNotifClick = (notif) => {
    if (!notif.isRead) {
      markReadMut.mutate(notif.id);
    }
    // Navigate to relevant page
    const cfg = NOTIF_TYPE_MAP[notif.type];
    if (cfg && notif.referenceId) {
      navigate(cfg.link(notif.referenceId));
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            الإشعارات 🔔
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {totalCount} إشعار إجمالاً
          </p>
        </div>
        <Button
          variant="ghost"
          leftIcon={CheckCheck}
          loading={markAllMut.isLoading}
          onClick={() => markAllMut.mutate()}
        >
          تحديد الكل كمقروء
        </Button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: '', label: 'الكل' },
          { key: 'unread', label: 'غير مقروء' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setRead(tab.key); setPage(1); }}
            style={{
              padding: '7px 18px', borderRadius: '20px', fontSize: '0.875rem',
              border: `1px solid ${readFilter === tab.key ? 'var(--dz-cyan)' : 'var(--border)'}`,
              background: readFilter === tab.key ? 'rgba(0,217,245,0.1)' : 'var(--bg-card)',
              color: readFilter === tab.key ? 'var(--dz-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: readFilter === tab.key ? 600 : 400, transition: 'all 150ms',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="dz-card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              display: 'flex', gap: '14px', padding: '16px 20px',
              borderBottom: i < 7 ? '1px solid var(--border)' : 'none',
            }}>
              <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                <div className="skeleton" style={{ height: '14px', width: '75%', borderRadius: '4px' }} />
                <div className="skeleton" style={{ height: '12px', width: '40%', borderRadius: '4px' }} />
              </div>
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <Bell size={48} style={{ color: 'var(--text-muted)', opacity: 0.25, margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>
              {readFilter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}
            </p>
          </div>
        ) : (
          notifs.map((notif, i) => (
            <div
              key={notif.id || i}
              onClick={() => handleNotifClick(notif)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                padding: '16px 20px',
                borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none',
                background: notif.isRead ? 'transparent' : 'rgba(0,217,245,0.03)',
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(0,217,245,0.03)'}
            >
              <NotifIcon type={notif.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0,
                  fontWeight: notif.isRead ? 400 : 600, lineHeight: 1.5,
                }}>
                  {notif.message || notif.title}
                </p>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  {relativeTime(notif.createdAt)}
                </span>
              </div>
              {!notif.isRead && (
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--dz-cyan)', flexShrink: 0, marginTop: '7px',
                }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            السابق
          </button>
          <span style={{ padding: '7px 14px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>صفحة {page} من {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
