import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

// API configuration
const API_CONFIG = {
  getBaseUrl: () => {
    // Use environment variable if available
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }

    // Auto-detect based on hostname
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:3000";
    }

    // Default to production URL
    return "https://artelouarate-backend-production.up.railway.app";
  },
  endpoints: {
    login: "/api/admin/login",
    logout: "/api/admin/logout",
    profile: "/api/admin/profile",
    refreshToken: "/api/admin/refresh-token",
  },
};

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: "ADMIN";
  isActive: boolean;
  createdAt?: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({
  children,
}) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!admin;

  // Check if admin is authenticated on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const isAdminAuth =
          localStorage.getItem("isAdminAuthenticated") === "true";
        const adminToken = localStorage.getItem("adminToken");
        const adminUserData = localStorage.getItem("adminUser");

        if (isAdminAuth && adminToken && adminUserData) {
          const userData = JSON.parse(adminUserData);
          setAdmin(userData);

          // Verify token is still valid
          const isValid = await checkAuth();
          if (!isValid) {
            logout();
          }
        }
      } catch (error) {
        console.error("Admin auth initialization failed:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);

      const API_BASE = API_CONFIG.getBaseUrl();
      const loginUrl = `${API_BASE}${API_CONFIG.endpoints.login}`;

      console.log(`🔐 Attempting admin login to: ${loginUrl}`);

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log(`📡 Login response status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("❌ Login error response:", errorData);
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("📦 Login response data:", data);

      // Handle the response structure properly
      if (data.success) {
        // Check if we have the expected data structure
        if (!data.data) {
          console.error(
            "❌ Invalid response structure - missing data object:",
            data
          );
          throw new Error("Invalid response from server");
        }

        const { admin: adminData, tokens } = data.data;

        if (!adminData || !tokens) {
          console.error(
            "❌ Invalid response structure - missing admin or tokens:",
            data.data
          );
          throw new Error("Invalid response from server");
        }

        // Store authentication data
        localStorage.setItem("isAdminAuthenticated", "true");
        localStorage.setItem("adminToken", tokens.accessToken);
        localStorage.setItem("adminRefreshToken", tokens.refreshToken);
        localStorage.setItem("adminUser", JSON.stringify(adminData));

        setAdmin(adminData);
        console.log("✅ Admin login successful:", adminData);
      } else {
        console.error("❌ Login failed - success is false:", data);
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("🚨 Admin login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    console.log("🚪 Admin logout");

    // Clear all admin authentication data
    localStorage.removeItem("isAdminAuthenticated");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("adminUser");

    setAdmin(null);

    // Call logout endpoint if needed
    try {
      const API_BASE = API_CONFIG.getBaseUrl();
      const logoutUrl = `${API_BASE}${API_CONFIG.endpoints.logout}`;
      const token = localStorage.getItem("adminToken");

      if (token) {
        fetch(logoutUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch(console.error);
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    }

    // Redirect to login
    navigate("/admin/login");
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const refreshTokenValue = localStorage.getItem("adminRefreshToken");
      if (!refreshTokenValue) {
        throw new Error("No refresh token available");
      }

      const API_BASE = API_CONFIG.getBaseUrl();
      const refreshUrl = `${API_BASE}${API_CONFIG.endpoints.refreshToken}`;

      const response = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();

      if (data.success && data.data?.tokens) {
        localStorage.setItem("adminToken", data.data.tokens.accessToken);
        localStorage.setItem(
          "adminRefreshToken",
          data.data.tokens.refreshToken
        );
        console.log("✅ Token refreshed successfully");
        return;
      }

      throw new Error("Invalid refresh response");
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      throw error;
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        return false;
      }

      const API_BASE = API_CONFIG.getBaseUrl();
      const profileUrl = `${API_BASE}${API_CONFIG.endpoints.profile}`;

      const response = await fetch(profileUrl, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        return true;
      } else if (response.status === 401) {
        // Try to refresh token
        try {
          await refreshToken();
          return true;
        } catch {
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshToken,
        checkAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
