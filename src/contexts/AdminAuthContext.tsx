import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

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
          await checkAuth();
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

      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.success && data.data) {
        // Store authentication data
        localStorage.setItem("isAdminAuthenticated", "true");
        localStorage.setItem("adminToken", data.data.tokens.accessToken);
        localStorage.setItem(
          "adminRefreshToken",
          data.data.tokens.refreshToken
        );
        localStorage.setItem("adminUser", JSON.stringify(data.data.admin));

        setAdmin(data.data.admin);
        console.log("✅ Admin login successful:", data.data.admin);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    // Clear all admin authentication data
    localStorage.removeItem("isAdminAuthenticated");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("adminUser");

    setAdmin(null);

    // Call logout endpoint if needed
    try {
      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      fetch(`${API_BASE}/admin/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      }).catch(console.error);
    } catch (error) {
      console.error("Logout API call failed:", error);
    }

    // Redirect to login
    navigate("/admin/login");
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem("adminRefreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${API_BASE}/admin/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Token refresh failed");
      }

      if (data.success && data.data.tokens) {
        localStorage.setItem("adminToken", data.data.tokens.accessToken);
        localStorage.setItem(
          "adminRefreshToken",
          data.data.tokens.refreshToken
        );
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

      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${API_BASE}/admin/profile`, {
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
          logout();
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    }
  };

  const value: AdminAuthContextType = {
    admin,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    checkAuth,
  };

  return (
    <AdminAuthContext.Provider value={value}>
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
