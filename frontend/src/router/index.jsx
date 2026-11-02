import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './ProtectedRoute';
import LoadingSpinner from '../components/shared/LoadingSpinner';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────

// Auth
const LoginPage             = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage          = lazy(() => import('../pages/auth/RegisterPage'));
const ConfirmEmailPage      = lazy(() => import('../pages/auth/ConfirmEmailPage'));
const ForgotPasswordPage    = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage     = lazy(() => import('../pages/auth/ResetPasswordPage'));

// Onboarding
const CreateCompanyPage     = lazy(() => import('../pages/company/CreateCompanyPage'));
const VerificationPage      = lazy(() => import('../pages/company/VerificationPage'));

// Main App
const DashboardPage         = lazy(() => import('../pages/dashboard/DashboardPage'));
const CatalogPage           = lazy(() => import('../pages/catalog/CatalogPage'));
const NotificationsPage     = lazy(() => import('../pages/notifications/NotificationsPage'));
const ProfilePage           = lazy(() => import('../pages/profile/ProfilePage'));

// RFQs
const RfqsPage              = lazy(() => import('../pages/rfqs/RfqsPage'));
const CreateRfqPage         = lazy(() => import('../pages/rfqs/CreateRfqPage'));
const RfqDetailPage         = lazy(() => import('../pages/rfqs/RfqDetailPage'));

// Offers
const MyOffersPage          = lazy(() => import('../pages/offers/MyOffersPage'));
const OfferDetailPage       = lazy(() => import('../pages/offers/OfferDetailPage'));

// Deals
const DealsPage             = lazy(() => import('../pages/deals/DealsPage'));
const DealDetailPage        = lazy(() => import('../pages/deals/DealDetailPage'));

// Admin
const AdminVerificationPage = lazy(() => import('../pages/admin/verification/AdminVerificationPage'));
const AdminCatalogPage      = lazy(() => import('../pages/admin/catalog/AdminCatalogPage'));
const AdminDisputesPage     = lazy(() => import('../pages/admin/disputes/AdminDisputesPage'));
const AdminShippingPage     = lazy(() => import('../pages/admin/shipping/AdminShippingPage'));

// ─── Fallback ─────────────────────────────────────────────────────────────────
const NotFoundPage          = lazy(() => import('../pages/NotFoundPage'));

// ─── App Router ───────────────────────────────────────────────────────────────
const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* ── Public Auth Routes ── */}
        <Route path="/login"              element={<LoginPage />} />
        <Route path="/register"           element={<RegisterPage />} />
        <Route path="/confirm-email"      element={<ConfirmEmailPage />} />
        <Route path="/forgot-password"    element={<ForgotPasswordPage />} />
        <Route path="/reset-password"     element={<ResetPasswordPage />} />

        {/* ── Onboarding (authenticated, but no company yet) ── */}
        <Route
          path="/onboarding/create-company"
          element={
            <ProtectedRoute>
              <CreateCompanyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/verification"
          element={
            <ProtectedRoute>
              <VerificationPage />
            </ProtectedRoute>
          }
        />

        {/* ── Main App (authenticated + company) ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalog"
          element={<CatalogPage />}
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ── RFQs (requires approved company) ── */}
        <Route
          path="/rfqs"
          element={
            <ProtectedRoute requireApproved>
              <RfqsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/create"
          element={
            <ProtectedRoute requireApproved allowedRoles={['Owner', 'Admin', 'ProcurementManager']}>
              <CreateRfqPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/:id"
          element={
            <ProtectedRoute requireApproved>
              <RfqDetailPage />
            </ProtectedRoute>
          }
        />

        {/* ── Offers ── */}
        <Route
          path="/offers/mine"
          element={
            <ProtectedRoute requireApproved allowedRoles={['Owner', 'Admin', 'SalesManager']}>
              <MyOffersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offers/:id"
          element={
            <ProtectedRoute requireApproved>
              <OfferDetailPage />
            </ProtectedRoute>
          }
        />

        {/* ── Deals ── */}
        <Route
          path="/deals"
          element={
            <ProtectedRoute requireApproved>
              <DealsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deals/:id"
          element={
            <ProtectedRoute requireApproved>
              <DealDetailPage />
            </ProtectedRoute>
          }
        />

        {/* ── Admin Panel ── */}
        <Route
          path="/admin/verification"
          element={
            <ProtectedRoute adminOnly>
              <AdminVerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/catalog"
          element={
            <ProtectedRoute adminOnly>
              <AdminCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/disputes"
          element={
            <ProtectedRoute adminOnly>
              <AdminDisputesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shipping"
          element={
            <ProtectedRoute adminOnly>
              <AdminShippingPage />
            </ProtectedRoute>
          }
        />

        {/* ── Redirects ── */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;

