const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Connection status tracking
let isServerOnline = true;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// Enhanced API client with proper authentication
const apiClient = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get authentication token - prioritize admin token for admin routes
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('userToken');
    
    // Use admin token for admin routes, user token for user routes
    const isAdminRoute = endpoint.startsWith('/admin');
    const token = isAdminRoute ? adminToken : (adminToken || userToken);
    
    const config: RequestInit = {
      headers: {
        // Only set Content-Type if body is not FormData
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        // Properly format Authorization header with Bearer token
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    config.signal = controller.signal;

    try {
      console.log(`🔄 API Request: ${options.method || 'GET'} ${endpoint}`, {
        hasToken: !!token,
        tokenType: isAdminRoute ? 'admin' : 'user',
        headers: config.headers
      });
      
      const response = await fetch(url, config);
      
      // Update server status
      if (response.ok || response.status < 500) {
        isServerOnline = true;
        reconnectAttempts = 0;
      }
      
      if (!response.ok) {
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error(`❌ API Error: ${response.status}`, errorData);
        
        // Handle specific error types
        if (response.status === 401) {
          // Handle unauthorized access - clear appropriate tokens
          if (isAdminRoute) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminRefreshToken');
            localStorage.removeItem('isAdminAuthenticated');
            localStorage.removeItem('adminUser');
          } else {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('isUserAuthenticated');
          }
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Insufficient permissions.');
        } else if (response.status === 404) {
          throw new Error(errorData.message || 'Resource not found.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (response.status >= 500) {
          throw new Error(errorData.message || 'Server error. Please try again later.');
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ API Success: ${endpoint}`, data);
      clearTimeout(timeoutId);
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('🚨 API request failed:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        isServerOnline = false;
        throw new Error('Unable to connect to server. Please check your connection and try again.');
      }
      
      throw error;
    }
  },

  // Enhanced GET with retry logic
  async get(endpoint: string, retries = 1) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.request(endpoint, { method: 'GET' });
      } catch (error) {
        if (attempt === retries) throw error;
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${delay}ms... (attempt ${attempt + 1}/${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  // POST request with validation
  post(endpoint: string, data?: any) {
    const body = data ? JSON.stringify(data) : undefined;
    console.log(`📤 POST data:`, data);
    
    return this.request(endpoint, {
      method: 'POST',
      body,
    });
  },

  // PUT request
  put(endpoint: string, data?: any) {
    const body = data ? JSON.stringify(data) : undefined;
    console.log(`📝 PUT data:`, data);
    
    return this.request(endpoint, {
      method: 'PUT',
      body,
    });
  },

  // DELETE request
  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // Check server health
  async checkHealth(): Promise<boolean> {
    try {
      await this.request('/health', { method: 'GET' });
      isServerOnline = true;
      return true;
    } catch (error) {
      isServerOnline = false;
      return false;
    }
  },

  // Get server status
  getServerStatus() {
    return {
      isOnline: isServerOnline,
      reconnectAttempts,
      maxAttempts: MAX_RECONNECT_ATTEMPTS
    };
  }
};

// Enhanced authentication service
const authService = {
  // Admin authentication
  async adminLogin(credentials: { email: string; password: string }) {
    return apiClient.post('/admin/login', credentials);
  },

  async adminLogout() {
    try {
      return await apiClient.post('/admin/logout');
    } catch (error) {
      console.error('Admin logout error:', error);
    }
  },

  async adminRefreshToken() {
    const refreshToken = localStorage.getItem('adminRefreshToken');
    if (!refreshToken) throw new Error('No refresh token available');
    
    return apiClient.post('/admin/refresh-token', { refreshToken });
  },

  // User authentication  
  async userLogin(credentials: { email: string; password: string }) {
    return apiClient.post('/auth/login', credentials);
  },

  async userRegister(userData: any) {
    return apiClient.post('/auth/register', userData);
  },

  async userLogout() {
    try {
      return await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('User logout error:', error);
    }
  },

  async me() {
    return apiClient.get('/auth/me');
  }
};

// API response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Data types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Artwork {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  medium: string;
  dimensions: string;
  year: number;
  status: "AVAILABLE" | "SOLD" | "RESERVED";
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  categoryId: string;
  category?: Category;
  images?: ArtworkImage[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  artworkCount?: number;
  artworks?: Artwork[];
  createdAt: string;
  updatedAt: string;
}

export interface ArtworkImage {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  isPrimary: boolean;
  artworkId: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  totalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  customer?: Customer;
  orderItems?: OrderItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  orderCount?: number;
  orders?: Order[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  artworkId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  artwork?: Artwork;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  method: string;
  stripeId?: string;
  transactionId?: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  artworkId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  users: {
    total: number;
    recent: number;
    growth: number;
  };
  artworks: {
    total: number;
    featured: number;
    growth: number;
  };
  categories: {
    total: number;
    active: number;
    growth: number;
  };
  orders: {
    total: number;
    recent: number;
    growth: number;
  };
  inquiries: {
    total: number;
    recent: number;
    pending: number;
  };
  customers: {
    total: number;
    active: number;
  };
  revenue: {
    total: number;
    currency: string;
  };
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export interface SearchResults {
  artworks?: Artwork[];
  categories?: Category[];
  users?: User[];
}

// API endpoints for Categories
const categoriesApi = {
  getAll: async () => {
    return await apiClient.get('/categories');
  },
  getById: async (id: string) => {
    return await apiClient.get(`/categories/${id}`);
  },
  create: async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await apiClient.post('/categories', category);
  },
  update: async (id: string, category: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => {
    return await apiClient.put(`/categories/${id}`, category);
  },
  delete: async (id: string) => {
    return await apiClient.delete(`/categories/${id}`);
  }
};

// API endpoints for Artworks
const artworksApi = {
  getAll: async (queryParams: string = '') => {
    const endpoint = queryParams ? `/artworks?${queryParams}` : '/artworks';
    return await apiClient.get(endpoint, 1);
  },
  getById: async (id: string) => {
    return await apiClient.get(`/artworks/${id}`);
  },
  create: async (artwork: any) => {
    return await apiClient.post('/artworks', artwork);
  },
  update: async (id: string, artwork: any) => {
    return await apiClient.put(`/artworks/${id}`, artwork);
  },
  delete: async (id: string) => {
    return await apiClient.delete(`/artworks/${id}`);
  }
};

// Enhanced API structure with proper admin authentication
const api = {
  // Authentication endpoints
  auth: authService,
  
  // Admin endpoints
  admin: {
    // Dashboard and stats
    getDashboardStats: () => apiClient.get('/admin/stats'),
    getRecentActivities: () => apiClient.get('/admin/activities'),
    
    // Admin management
    getProfile: () => apiClient.get('/admin/profile'),
    updateProfile: (data: any) => apiClient.put('/admin/profile', data),
    changePassword: (data: any) => apiClient.put('/admin/change-password', data),
    
    // Users management
    getUsers: (params?: any) => apiClient.get(`/admin/users${params ? `?${new URLSearchParams(params)}` : ''}`),
    getUserById: (id: string) => apiClient.get(`/admin/users/${id}`),
    updateUser: (id: string, data: any) => apiClient.put(`/admin/users/${id}`, data),
    deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
    
    // Orders management  
    getOrders: (params?: any) => apiClient.get(`/admin/orders${params ? `?${new URLSearchParams(params)}` : ''}`),
    getOrderById: (id: string) => apiClient.get(`/admin/orders/${id}`),
    updateOrderStatus: (id: string, status: string) => apiClient.put(`/admin/orders/${id}/status`, { status }),
    
    // Inquiries management
    getInquiries: (params?: any) => apiClient.get(`/admin/inquiries${params ? `?${new URLSearchParams(params)}` : ''}`),
    getInquiryById: (id: string) => apiClient.get(`/admin/inquiries/${id}`),
    updateInquiryStatus: (id: string, status: string) => apiClient.put(`/admin/inquiries/${id}/status`, { status }),
    replyToInquiry: (id: string, reply: string) => apiClient.post(`/admin/inquiries/${id}/reply`, { reply }),
  },

  // Artworks endpoints
  artworks: {
    getAll: (params?: any) => apiClient.get(`/artworks${params ? `?${new URLSearchParams(params)}` : ''}`),
    getById: (id: string) => apiClient.get(`/artworks/${id}`),
    create: (data: any) => apiClient.post('/artworks', data),
    update: (id: string, data: any) => apiClient.put(`/artworks/${id}`, data),
    delete: (id: string) => apiClient.delete(`/artworks/${id}`),
    search: (query: string) => apiClient.get(`/artworks/search?q=${encodeURIComponent(query)}`),
    getFeatured: () => apiClient.get('/artworks/featured'),
    getByCategory: (categoryId: string) => apiClient.get(`/artworks/category/${categoryId}`),
  },

  // Categories endpoints
  categories: {
    getAll: () => apiClient.get('/categories'),
    getById: (id: string) => apiClient.get(`/categories/${id}`),
    create: (data: any) => apiClient.post('/categories', data),
    update: (id: string, data: any) => apiClient.put(`/categories/${id}`, data),
    delete: (id: string) => apiClient.delete(`/categories/${id}`),
    reorder: (data: any) => apiClient.put('/categories/reorder', data),
  },

  // Image upload endpoints
  upload: {
    image: (file: File, artworkId?: string) => {
      const formData = new FormData();
      formData.append('image', file);
      if (artworkId) formData.append('artworkId', artworkId);
      
      return apiClient.request('/upload/image', {
        method: 'POST',
        body: formData,
      });
    },
    multipleImages: (files: File[], artworkId?: string) => {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      if (artworkId) formData.append('artworkId', artworkId);
      
      return apiClient.request('/upload/multiple', {
        method: 'POST',
        body: formData,
      });
    },
  },

  // Customers endpoints (for orders and inquiries)
  customers: {
    getAll: (params?: any) => apiClient.get(`/customers${params ? `?${new URLSearchParams(params)}` : ''}`),
    getById: (id: string) => apiClient.get(`/customers/${id}`),
    create: (data: any) => apiClient.post('/customers', data),
    update: (id: string, data: any) => apiClient.put(`/customers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/customers/${id}`),
  },

  // Orders endpoints
  orders: {
    getAll: (params?: any) => apiClient.get(`/orders${params ? `?${new URLSearchParams(params)}` : ''}`),
    getById: (id: string) => apiClient.get(`/orders/${id}`),
    create: (data: any) => apiClient.post('/orders', data),
    update: (id: string, data: any) => apiClient.put(`/orders/${id}`, data),
    cancel: (id: string) => apiClient.put(`/orders/${id}/cancel`),
  },

  // Inquiries endpoints
  inquiries: {
    getAll: (params?: any) => apiClient.get(`/inquiries${params ? `?${new URLSearchParams(params)}` : ''}`),
    getById: (id: string) => apiClient.get(`/inquiries/${id}`),
    create: (data: any) => apiClient.post('/inquiries', data),
    update: (id: string, data: any) => apiClient.put(`/inquiries/${id}`, data),
    delete: (id: string) => apiClient.delete(`/inquiries/${id}`),
  },

  // Health check
  health: () => apiClient.get('/health'),
  
  // Server status
  getServerStatus: () => apiClient.getServerStatus(),
};

export default api;

// Export individual services for convenience
export { authService, apiClient };

// Export utility functions
export const getServerOnlineStatus = () => apiClient.getServerStatus().isOnline;
export const checkServerHealth = () => apiClient.checkHealth(); 