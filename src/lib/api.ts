const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Connection status tracking
let isServerOnline = true;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// API client configuration with enhanced error handling
const apiClient = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get authentication token
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('userToken');
    const token = adminToken || userToken;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    config.signal = controller.signal;

    try {
      console.log(`🔄 API Request: ${options.method || 'GET'} ${endpoint}`);
      
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
        if (response.status === 500) {
          throw new Error(errorData.message || 'Server error. Please try again later.');
        } else if (response.status === 404) {
          throw new Error(errorData.message || 'Resource not found.');
        } else if (response.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('adminToken');
          localStorage.removeItem('userToken');
          throw new Error('Unauthorized. Please log in again.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ API Success: ${endpoint}`, data);
      clearTimeout(timeoutId); // Clear timeout on success
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId); // Clear timeout on error
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

// Comprehensive API object
const api = {
  // Auth endpoints
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      return await apiClient.post('/admin/login', credentials);
    },
    register: async (userData: any) => {
      return await apiClient.post('/admin/register', userData);
    },
    forgotPassword: async (email: string) => {
      return await apiClient.post('/admin/forgot-password', { email });
    },
    resetPassword: async (data: { token: string; password: string }) => {
      return await apiClient.post('/admin/reset-password', data);
    },
    logout: async () => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('userToken');
    }
  },
  
  // Category management
  categories: categoriesApi,
  
  // Artwork management
  artworks: artworksApi,
  
  // User management
  users: {
    getAll: async (page = 1, limit = 10) => {
      return await apiClient.get(`/users?page=${page}&limit=${limit}`);
    },
    getById: async (id: string) => {
      return await apiClient.get(`/users/${id}`);
    },
    create: async (user: any) => {
      return await apiClient.post('/users', user);
    },
    update: async (id: string, user: any) => {
      return await apiClient.put(`/users/${id}`, user);
    },
    delete: async (id: string) => {
      return await apiClient.delete(`/users/${id}`);
    }
  },
  
  // Dashboard stats
  stats: {
    getDashboard: async () => {
      return await apiClient.get('/admin/stats');
    }
  },
  
  // Upload endpoints
  uploads: {
    uploadImage: async (formData: FormData) => {
      const headers = { 'Content-Type': 'multipart/form-data' };
      return await apiClient.request('/uploads/image', { method: 'POST', body: formData, headers });
    }
  },
  
  // Server health check
  health: {
    check: async () => {
      return await apiClient.checkHealth();
    },
    getStatus: () => apiClient.getServerStatus()
  }
};

export default api; 