import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "USER" | "ADMIN";
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireRole,
  redirectTo = "/login",
}) => {
  const {
    isAuthenticated: userAuthenticated,
    isLoading: userLoading,
    user,
  } = useAuth();
  const { isAuthenticated: adminAuthenticated, isLoading: adminLoading } =
    useAdminAuth();
  const location = useLocation();

  // Determine if this is an admin route
  const isAdminRoute =
    requireRole === "ADMIN" || location.pathname.startsWith("/admin");

  // Show loading spinner while checking authentication
  if ((isAdminRoute && adminLoading) || (!isAdminRoute && userLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Handle admin routes
  if (isAdminRoute) {
    if (!adminAuthenticated) {
      console.log("🔒 Admin route access denied - redirecting to login");
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    console.log("✅ Admin route access granted");
    return <>{children}</>;
  }

  // Handle regular user routes
  if (!userAuthenticated) {
    console.log("🔒 User route access denied - redirecting to login");
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requireRole === "USER" && user?.role !== "USER") {
    console.log("🔒 User role mismatch - redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ User route access granted");
  return <>{children}</>;
};

export default ProtectedRoute;
