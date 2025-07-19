import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireHost?: boolean;
}

export function ProtectedRoute({ children, requireHost = true }: ProtectedRouteProps) {
  const { user, loading, isHost } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireHost && !isHost) {
    // Redirect to auth page with the current location for after-login redirect
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}