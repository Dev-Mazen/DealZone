import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Redirects unauthenticated users to /login.
 * Redirects authenticated users without a company to /onboarding/create-company.
 * Redirects unverified companies to /onboarding/verification.
 * Optionally restricts by adminOnly or company roles.
 */
const ProtectedRoute = ({
  children,
  adminOnly = false,
  requireApproved = false,
  allowedRoles = [],
}) => {
  const { isAuthenticated, loading, user, isAdmin, company, isApproved, companyRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-dz-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Must be authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Admin-only route
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Must have a company (skip for admin)
  if (!isAdmin && !company) {
    return <Navigate to="/onboarding/create-company" replace />;
  }

  // 4. Must be approved for commercial activity
  if (!isAdmin && requireApproved && !isApproved) {
    return <Navigate to="/onboarding/verification" replace />;
  }

  // 5. Role-based guard
  if (!isAdmin && allowedRoles.length > 0 && !allowedRoles.includes(companyRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

