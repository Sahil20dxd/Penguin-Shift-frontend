// src/components/ProtectedRoute.tsx
// Require only 'user' (isAuthenticated) — bearer is optional now.

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  return <>{children}</>;
}
