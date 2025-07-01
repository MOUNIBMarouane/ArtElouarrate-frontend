import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ArtistShowcase = lazy(() => import("./pages/ArtistShowcase"));
const UserLogin = lazy(() => import("./pages/UserLogin"));
const UserRegister = lazy(() => import("./pages/UserRegister"));
const Artwork = lazy(() => import("./pages/Artwork"));
const Ma3rid = lazy(() => import("./pages/Ma3rid"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ArtManagement = lazy(() => import("./pages/ArtManagement"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
  </div>
);

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <AdminAuthProvider>
                <div className="min-h-screen bg-background font-sans antialiased">
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/artist" element={<ArtistShowcase />} />
                      <Route path="/artwork/:id" element={<Artwork />} />
                      <Route path="/ma3rid" element={<Ma3rid />} />

                      {/* User Authentication Routes */}
                      <Route path="/login" element={<UserLogin />} />
                      <Route path="/register" element={<UserRegister />} />

                      {/* Admin Authentication Routes */}
                      <Route path="/admin/login" element={<AdminLogin />} />

                      {/* Protected User Routes */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute requireRole="USER">
                            <Profile />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Admin Routes */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute requireRole="ADMIN">
                            <Admin />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/art-management"
                        element={
                          <ProtectedRoute requireRole="ADMIN">
                            <ArtManagement />
                          </ProtectedRoute>
                        }
                      />

                      {/* Catch all route */}
                      <Route path="/404" element={<NotFound />} />
                      <Route
                        path="*"
                        element={<Navigate to="/404" replace />}
                      />
                    </Routes>
                  </Suspense>
                </div>
                <Toaster />
                <Sonner />
              </AdminAuthProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
