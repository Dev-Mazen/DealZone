import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.jpeg';
import {
  LayoutDashboard, FileText, PlusCircle, Store, Tag, Handshake,
  LayoutGrid, Bell, User, ShieldCheck, Package, AlertTriangle, Truck, X,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation('common');
  const { isAdmin, companyRole, user } = useAuth();
  const isBuyer    = companyRole === 'Buyer';
  const isSupplier = companyRole === 'Supplier';

  // Always-visible nav items
  const commonItems = [
    { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
  ];

  // Buyer-only items
  const buyerItems = isBuyer ? [
    { to: '/rfqs', label: t('nav.myRfqs', 'My RFQs'), icon: FileText, end: true },
    { to: '/rfqs/create', label: t('nav.createRfq', 'Create RFQ'), icon: PlusCircle },
    { to: '/deals', label: t('nav.myDeals', 'My Deals'), icon: Handshake },
  ] : [];

  // Supplier-only items
  const supplierItems = isSupplier ? [
    { to: '/rfqs', label: t('nav.rfqMarketplace', 'RFQ Marketplace'), icon: Store, end: true },
    { to: '/offers', label: t('nav.myOffers', 'My Offers'), icon: Tag },
    { to: '/deals', label: t('nav.myDeals', 'My Deals'), icon: Handshake },
  ] : [];

  // Shared items (both buyer & supplier, not admin)
  const sharedItems = (isBuyer || isSupplier) ? [
    { to: '/catalog', label: t('nav.catalog', 'Catalog'), icon: LayoutGrid },
    { to: '/notifications', label: t('nav.notifications', 'Notifications'), icon: Bell },
    { to: '/profile', label: t('nav.profile', 'Profile'), icon: User },
  ] : [];

  // Admin-only items
  const adminItems = isAdmin ? [
    { to: '/admin/verification', label: t('nav.verification', 'Verification'), icon: ShieldCheck },
    { to: '/admin/catalog', label: t('nav.catalogMgmt', 'Catalog Mgmt'), icon: Package },
    { to: '/admin/disputes', label: t('nav.disputes', 'Disputes'), icon: AlertTriangle },
    { to: '/admin/shipping', label: t('nav.shipping', 'Shipping'), icon: Truck },
  ] : [];

  const roleName = isAdmin ? 'Admin' : isBuyer ? 'Buyer' : isSupplier ? 'Supplier' : user?.role || '';
  const roleBadgeVariant = isAdmin ? 'dz-badge-warning' : isBuyer ? 'dz-badge-info' : 'dz-badge-success';

  const navLinkClass = ({ isActive }) => `dz-nav-item${isActive ? ' active' : ''}`;

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    if (window.innerWidth < 769) {
      onClose();
    }
  };

  const renderNavItems = (items) =>
    items.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={navLinkClass}
        onClick={handleNavClick}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
      >
        <Icon size={18} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
      </NavLink>
    ));

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 149,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar panel */}
      <aside
        id="sidebar-panel"
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          insetBlockStart: 0,
          insetInlineStart: 0,
          width: '240px',
          height: '100svh',
          background: 'var(--bg-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 150,
          transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}      >
        {/* Logo / Header area */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: '16px',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={logo}
              alt="DealZone"
              style={{ height: '36px', width: '36px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
            />
            <span style={{
              fontWeight: 800,
              fontSize: '1rem',
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
            }}>
              DEAL ZONE
            </span>
          </div>

          {/* Close button (mobile only) */}
          <button
            id="sidebar-close-btn"
            className="dz-btn-ghost"
            onClick={onClose}
            aria-label="Close sidebar"
            style={{ padding: '6px', display: 'none', color: 'var(--text-on-sidebar, white)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Always visible */}
          {renderNavItems(commonItems)}

          {/* Buyer section */}
          {buyerItems.length > 0 && (
            <>
              <div className="dz-section-label" style={{ marginTop: '12px' }}>
                {t('nav.section.buyer', 'Buyer')}
              </div>
              {renderNavItems(buyerItems)}
            </>
          )}

          {/* Supplier section */}
          {supplierItems.length > 0 && (
            <>
              <div className="dz-section-label" style={{ marginTop: '12px' }}>
                {t('nav.section.supplier', 'Supplier')}
              </div>
              {renderNavItems(supplierItems)}
            </>
          )}

          {/* Shared section */}
          {sharedItems.length > 0 && (
            <>
              <div className="dz-section-label" style={{ marginTop: '12px' }}>
                {t('nav.section.general', 'General')}
              </div>
              {renderNavItems(sharedItems)}
            </>
          )}

          {/* Admin section */}
          {adminItems.length > 0 && (
            <>
              <div className="dz-section-label" style={{ marginTop: '12px' }}>
                {t('nav.section.admin', 'Admin')}
              </div>
              {renderNavItems(adminItems)}
            </>
          )}
        </nav>

        {/* Bottom: User info + role badge */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'rgba(0,217,245,0.15)',
            border: '2px solid var(--dz-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--dz-cyan)',
            flexShrink: 0,
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-on-sidebar, white)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.name || 'User'}
            </div>
            <span className={`dz-badge ${roleBadgeVariant}`} style={{ marginTop: '3px', display: 'inline-block' }}>
              {roleName}
            </span>
          </div>
        </div>
      </aside>

      {/* Responsive sidebar CSS */}
      <style>{`
        /* Mobile: sidebar hidden by default, slides in when open */
        @media (max-width: 768px) {
          #sidebar-panel {
            transform: translateX(-100%);
          }
          #sidebar-panel[data-open="true"] {
            transform: translateX(0);
          }
          #sidebar-close-btn {
            display: flex !important;
          }
        }
        /* Desktop: always visible */
        @media (min-width: 769px) {
          #sidebar-panel {
            transform: none !important;
          }
        }
        /* RTL support */
        [dir="rtl"] #sidebar-panel {
          transform: translateX(100%);
        }
        [dir="rtl"] #sidebar-panel[data-open="true"] {
          transform: translateX(0);
        }
      `}</style>

      {/* Apply data-open attribute via a hidden span trick — controlled by injected style below */}
      <style>{`
        @media (max-width: 768px) {
          #sidebar-panel {
            transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'};
          }
        }
      `}</style>
    </>
  );
}
