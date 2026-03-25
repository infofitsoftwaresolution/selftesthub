import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PageLoader from '../common/PageLoader';
interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRoles: ('user' | 'admin' | 'superadmin')[];
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children, requiredRoles }) => {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determine user role
  const userRole = isSuperAdmin ? 'superadmin' : isAdmin ? 'admin' : 'user';

  if (!requiredRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
