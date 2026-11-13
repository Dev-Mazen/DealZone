import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { authService } from './shared/api/services/authService'
import { tokenStore } from './shared/api/axios'
import { FullPageSpinner } from './components/ui/Spinner'
import ToastContainer from './components/ui/Toast'
import AppLayout, { PublicLayout } from './components/layout/AppLayout'
import ErrorBoundary from './components/common/ErrorBoundary'
import ScrollToTop from './components/common/ScrollToTop'

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'))
const AboutPage = lazy(() => import('./pages/public/AboutPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ConfirmEmailPage = lazy(() => import('./pages/auth/ConfirmEmailPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const CatalogPage = lazy(() => import('./pages/catalog/CatalogPage'))
const MarketplacePage = lazy(() => import('./pages/marketplace/MarketplacePage'))
const SupplierProductsPage = lazy(() => import('./pages/catalog/SupplierProductsPage'))
const NegotiationsPage = lazy(() => import('./pages/negotiations/NegotiationsPage'))
const NegotiationDetailPage = lazy(() => import('./pages/negotiations/NegotiationDetailPage'))
const CompanyOnboardingPage = lazy(() => import('./pages/company/CompanyOnboardingPage'))
const VerificationPage = lazy(() => import('./pages/company/VerificationPage'))
const RfqsPage = lazy(() => import('./pages/RfqsPage'))
const CreateRfqPage = lazy(() => import('./pages/CreateRfqPage'))
const RfqDetailPage = lazy(() => import('./pages/RfqDetailPage'))
const MyOffersPage = lazy(() => import('./pages/offers/MyOffersPage'))
const OfferRevisionsPage = lazy(() => import('./pages/offers/OfferRevisionsPage'))
const SubmitOfferPage = lazy(() => import('./pages/offers/SubmitOfferPage'))
const ReviseOfferPage = lazy(() => import('./pages/offers/ReviseOfferPage'))
const DealsListPage = lazy(() => import('./pages/deals/DealsListPage'))
const DealDetailPage = lazy(() => import('./pages/deals/DealDetailPage'))
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'))
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage'))
const CompanySettingsPage = lazy(() => import('./pages/settings/CompanySettingsPage'))
const ShipmentDetailPage = lazy(() => import('./pages/shipments/ShipmentDetailPage'))
const ShipmentsListPage = lazy(() => import('./pages/shipments/ShipmentsListPage'))
const SupplierDirectoryPage = lazy(() => import('./pages/suppliers/SupplierDirectoryPage'))
const CompanyProfilePage = lazy(() => import('./pages/suppliers/CompanyProfilePage'))
const ButtonTestPage = lazy(() => import('./pages/ButtonTestPage'))

// Tender & Bidding pages
const TendersListPage = lazy(() => import('./pages/tenders/TendersListPage'))
const CreateTenderPage = lazy(() => import('./pages/tenders/CreateTenderPage'))
const TenderDetailPage = lazy(() => import('./pages/tenders/TenderDetailPage'))
const BidDetailPage = lazy(() => import('./pages/tenders/BidDetailPage'))
const MyBidsPage = lazy(() => import('./pages/tenders/MyBidsPage'))

// Admin pages
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminVerificationPage = lazy(() => import('./pages/admin/AdminVerificationPage'))
const AdminVerificationDetailPage = lazy(() => import('./pages/admin/AdminVerificationDetailPage'))
const AdminCatalogPage = lazy(() => import('./pages/admin/AdminCatalogPage'))
const AdminDisputesPage = lazy(() => import('./pages/admin/AdminDisputesPage'))
const AdminShippingPage = lazy(() => import('./pages/admin/AdminShippingPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  // Try to rehydrate user session on mount
  useEffect(() => {
    const rehydrate = async () => {
      const refreshToken = tokenStore.getRefresh()
      if (!refreshToken) {
        setLoading(false)
        return
      }

      try {
        const u = await authService.me()
        setUser(u)
      } catch {
        tokenStore.clearAll()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    rehydrate()
  }, [setUser, setLoading])

  // Listen for session expiration
  useEffect(() => {
    const handler = () => {
      queryClient.clear()
      setUser(null)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    window.addEventListener('auth:session-expired', handler)
    return () => window.removeEventListener('auth:session-expired', handler)
  }, [setUser])

  if (isLoading) {
    return <FullPageSpinner />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <ErrorBoundary>
          <Suspense fallback={<FullPageSpinner />}>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                {!isAuthenticated && (
                  <>
                    <Route path="/suppliers" element={<SupplierDirectoryPage />} />
                    <Route path="/suppliers/:companyId" element={<CompanyProfilePage />} />
                    <Route path="/companies/:companyId" element={<CompanyProfilePage />} />
                  </>
                )}
                <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
                <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
                <Route path="/confirm-email" element={<ConfirmEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                {import.meta.env.DEV && <Route path="/button-test" element={<ButtonTestPage />} />}
              </Route>

              {/* Protected routes */}
              <Route
                element={
                  isAuthenticated ? (
                    <AppLayout />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              >
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="marketplace" element={<MarketplacePage />} />
                <Route path="catalog/my-products" element={<SupplierProductsPage />} />
                <Route path="catalog" element={<Navigate to="/marketplace" replace />} />
                <Route path="negotiations" element={<NegotiationsPage />} />
                <Route path="negotiations/:negotiationId" element={<NegotiationDetailPage />} />
                <Route path="suppliers" element={<SupplierDirectoryPage />} />
                <Route path="suppliers/:companyId" element={<CompanyProfilePage />} />
                <Route path="companies/:companyId" element={<CompanyProfilePage />} />
                <Route path="onboarding/company" element={<CompanyOnboardingPage />} />
                <Route path="onboarding/verification" element={<VerificationPage />} />

                {/* RFQs */}
                <Route path="rfqs" element={<RfqsPage />} />
                <Route path="rfqs/create" element={<CreateRfqPage />} />
                <Route path="rfqs/:rfqId" element={<RfqDetailPage />} />
                <Route path="rfqs/:rfqId/submit-offer" element={<SubmitOfferPage />} />

                {/* Tenders & Reverse Bidding */}
                <Route path="tenders" element={<TendersListPage />} />
                <Route path="tenders/create" element={<CreateTenderPage />} />
                <Route path="tenders/:tenderId" element={<TenderDetailPage />} />
                <Route path="tenders/bids/mine" element={<MyBidsPage />} />
                <Route path="tenders/bids/:bidId" element={<BidDetailPage />} />

                {/* Offers */}
                <Route path="offers" element={<MyOffersPage />} />
                <Route path="offers/:offerId/revisions" element={<OfferRevisionsPage />} />
                <Route path="offers/:offerId/revise" element={<ReviseOfferPage />} />

                {/* Deals */}
                <Route path="deals" element={<DealsListPage />} />
                <Route path="deals/:dealId" element={<DealDetailPage />} />

                {/* Shipments */}
                <Route path="shipments" element={<ShipmentsListPage />} />
                <Route path="shipments/:shipmentId" element={<ShipmentDetailPage />} />

                {/* Notifications */}
                <Route path="notifications" element={<NotificationsPage />} />

                {/* Profile & Company settings */}
                <Route path="profile" element={<ProfilePage />} />
                <Route path="company" element={<CompanySettingsPage />} />
                <Route path="company/members" element={<Navigate to="/company?tab=members" replace />} />

                {/* Admin — nested under AdminLayout */}
                <Route
                  path="admin"
                  element={
                    user?.isSystemAdmin ? <AdminLayout /> : <Navigate to="/dashboard" replace />
                  }
                >
                  <Route index element={<Navigate to="/admin/analytics" replace />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="verification" element={<AdminVerificationPage />} />
                  <Route path="verification/:companyId" element={<AdminVerificationDetailPage />} />
                  <Route path="catalog" element={<AdminCatalogPage />} />
                  <Route path="disputes" element={<AdminDisputesPage />} />
                  <Route path="shipping" element={<AdminShippingPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>

        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

