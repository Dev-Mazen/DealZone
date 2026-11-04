import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText, Handshake, Bell, TrendingUp, Tag,
  PlusCircle, Store, LayoutGrid, Clock, CheckCircle,
  Info, AlertCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyRfqs, getPublishedRfqs } from '../../api/rfqs';
import { getMyDeals } from '../../api/deals';
import { getNotifications, getUnreadCount } from '../../api/notifications';
import { getMyOffers } from '../../api/offers';
import Badge from '../../components/ui/Badge';

/* ── Relative time helper ───────────────────────────────────────── */
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

/* ── KPI Card ───────────────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, color, loading, to }) {
  const content = (
    <div className="dz-card" style={{
      padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px',
      transition: 'all 200ms', cursor: to ? 'pointer' : 'default',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
        background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        {loading ? (
          <div className="skeleton" style={{ width: '56px', height: '32px', borderRadius: '6px', marginBottom: '6px' }} />
        ) : (
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {value ?? '—'}
          </div>
        )}
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{label}</div>
      </div>
    </div>
  );

  return to ? <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>{content}</Link> : content;
}

/* ── Notification icon by type ──────────────────────────────────── */
function NotifIcon({ type }) {
  const map = {
    NewOffer: { icon: Tag, color: '#00D9F5' },
    OfferAccepted: { icon: CheckCircle, color: '#10B981' },
    DealCreated: { icon: Handshake, color: '#1266D6' },
    RfqExpired: { icon: AlertCircle, color: '#F59E0B' },
    VerificationApproved: { icon: CheckCircle, color: '#10B981' },
  };
  const cfg = map[type] || { icon: Bell, color: '#94A3B8' };
  const Ic = cfg.icon;
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
      background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Ic size={18} style={{ color: cfg.color }} />
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation('common');
  const { user, companyRole, isAdmin } = useAuth();

  const isBuyer    = companyRole === 'Buyer';
  const isSupplier = companyRole === 'Supplier';

  /* ── Queries ──────────────────────────────────────────────────── */
  const { data: rfqs, isLoading: rfqsLoading } = useQuery({
    queryKey: ['dashboard-rfqs'],
    queryFn: () => isBuyer ? getMyRfqs({ pageSize: 1 }) : getPublishedRfqs({ pageSize: 1 }),
    enabled: !isAdmin,
  });

  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['dashboard-deals'],
    queryFn: () => getMyDeals({ pageSize: 1 }),
    enabled: !isAdmin,
  });

  const { data: unreadData, isLoading: unreadLoading } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60000,
  });

  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ['dashboard-offers'],
    queryFn: () => getMyOffers({ pageSize: 1 }),
    enabled: isSupplier,
  });

  const { data: notifs, isLoading: notifsLoading } = useQuery({
    queryKey: ['dashboard-notifications'],
    queryFn: () => getNotifications({ pageSize: 5 }),
  });

  const rfqCount    = rfqs?.totalCount ?? rfqs?.items?.length ?? 0;
  const dealCount   = deals?.totalCount ?? deals?.items?.length ?? 0;
  const unreadCount = unreadData?.count ?? unreadData ?? 0;
  const offerCount  = offersData?.totalCount ?? offersData?.items?.length ?? 0;
  const notifList   = notifs?.items ?? notifs ?? [];

  /* ── Quick actions ────────────────────────────────────────────── */
  const quickActions = isAdmin
    ? [
        { label: 'مراجعة الشركات', icon: CheckCircle, to: '/admin/verification', color: '#10B981' },
        { label: 'إدارة الكتالوج', icon: LayoutGrid, to: '/admin/catalog', color: '#1266D6' },
      ]
    : isBuyer
    ? [
        { label: 'إنشاء طلب عرض أسعار', icon: PlusCircle, to: '/rfqs/create', color: '#00D9F5' },
        { label: 'تصفح الكتالوج', icon: LayoutGrid, to: '/catalog', color: '#1266D6' },
        { label: 'صفقاتي', icon: Handshake, to: '/deals', color: '#10B981' },
      ]
    : [
        { label: 'تصفح طلبات العروض', icon: Store, to: '/rfqs', color: '#00D9F5' },
        { label: 'تصفح الكتالوج', icon: LayoutGrid, to: '/catalog', color: '#1266D6' },
        { label: 'صفقاتي', icon: Handshake, to: '/deals', color: '#10B981' },
      ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── Page Header ────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          أهلاً، {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          هذا ملخص نشاطك اليوم على منصة DealZone
        </p>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {!isAdmin && (
          <KpiCard
            label={isBuyer ? 'طلباتي النشطة' : 'طلبات العروض'}
            value={rfqCount}
            icon={FileText}
            color="#1266D6"
            loading={rfqsLoading}
            to="/rfqs"
          />
        )}
        {isSupplier && (
          <KpiCard
            label="عروضي المرسلة"
            value={offerCount}
            icon={Tag}
            color="#00D9F5"
            loading={offersLoading}
            to="/offers"
          />
        )}
        {!isAdmin && (
          <KpiCard
            label="الصفقات النشطة"
            value={dealCount}
            icon={Handshake}
            color="#10B981"
            loading={dealsLoading}
            to="/deals"
          />
        )}
        <KpiCard
          label="إشعارات غير مقروءة"
          value={unreadCount}
          icon={Bell}
          color="#F59E0B"
          loading={unreadLoading}
          to="/notifications"
        />
      </div>

      {/* ── Bottom Grid: Quick Actions + Recent Notifications ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            إجراءات سريعة
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quickActions.map(a => (
              <Link
                key={a.to}
                to={a.to}
                style={{ textDecoration: 'none' }}
              >
                <div className="dz-card" style={{
                  padding: '16px 20px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: '12px', cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                      background: `${a.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <a.icon size={18} style={{ color: a.color }} />
                    </div>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {a.label}
                    </span>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Notifications */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              آخر الإشعارات
            </h2>
            <Link to="/notifications" style={{ fontSize: '0.8125rem', color: 'var(--dz-cyan)', fontWeight: 500 }}>
              عرض الكل
            </Link>
          </div>

          <div className="dz-card" style={{ padding: 0, overflow: 'hidden' }}>
            {notifsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton" style={{ height: '14px', width: '70%', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ height: '12px', width: '40%', borderRadius: '4px' }} />
                  </div>
                </div>
              ))
            ) : notifList.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <Bell size={32} style={{ opacity: 0.3, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                لا توجد إشعارات
              </div>
            ) : (
              notifList.map((n, i) => (
                <div
                  key={n.id || i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '14px 16px',
                    borderBottom: i < notifList.length - 1 ? '1px solid var(--border)' : 'none',
                    background: n.isRead ? 'transparent' : 'rgba(0,217,245,0.03)',
                  }}
                >
                  <NotifIcon type={n.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4,
                      fontWeight: n.isRead ? 400 : 600,
                    }}>
                      {n.message || n.title}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {relativeTime(n.createdAt)}
                    </span>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--dz-cyan)', flexShrink: 0, marginTop: '5px' }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
