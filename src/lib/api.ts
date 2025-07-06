/**
 * 🎨 ELOUARATE ART - Professional API Client
 * Connects frontend to the Railway backend deployment
 */

import type { Category, Artwork, User, ApiResponse, PaginatedResponse } from '@/types/database';

// API Configuration
export const API_CONFIG = {
  getBaseUrl: (): string => {
    // Check environment variable first
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }

    // Auto-detect based on hostname
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }

    // Default to production for Railway deployment
    return 'https://artelouarate-backend-production.up.railway.app';
  },
  endpoints: {
    // Admin
    adminLogin: '/admin/login',
    adminLogout: '/admin/logout',
    adminProfile: '/admin/profile',
    adminRefreshToken: '/admin/refresh-token',

    // Categories
    categories: '/categories',
    category: (id: string) => `/categories/${id}`,

    // Artworks
    artworks: '/artworks',
    artwork: (id: string) => `/artworks/${id}`,

    // Users
    users: '/users',
    user: (id: string) => `/users/${id}`,

    // Upload
    uploadImage: '/upload/image',
    uploadImages: '/upload/multiple',

    // Health
    health: '/health',
    apiHealth: '/health'
  }
};

// Initialize API base URL
const API_BASE = API_CONFIG.getBaseUrl();
console.log(`🔗 API Client connecting to: ${API_BASE}`);

// Utility to build endpoint URLs
const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  let url = `${API_BASE}${endpoint}`;

  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, value.toString());
      }
    });
    url += `?${query}`;
  }

  return url;
};

/**
 * Professional API Client with error handling and retry logic
 */
class ApiClient {
  /**
   * Get authentication headers
   */
  private getAuthHeaders(useAdminToken = false): Record<string, string> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const tokenKey = useAdminToken ? 'adminToken' : 'userToken';
    const token = localStorage.getItem(tokenKey);

    return token
      ? { ...defaultHeaders, Authorization: `Bearer ${token}` }
      : defaultHeaders;
  }

  /**
   * Handle API responses professionally
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: any = null;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData;
        console.error('❌ API Error:', errorData);
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
      }

      // Handle different error types
      if (response.status === 401) {
        // Clear invalid tokens
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userToken');
        localStorage.removeItem('isAdminAuthenticated');
        console.log('🔐 Cleared invalid authentication tokens');

        if (window.location.pathname.includes('/admin')) {
          window.location.href = '/admin/login';
        }
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ API Success:', data.message || 'Request completed');
    return data;
  }

  /**
   * Make HTTP requests with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    useAdminToken = false,
    retries = 3
  ): Promise<T> {
    const url = buildUrl(endpoint);
    const headers = this.getAuthHeaders(useAdminToken);

    const requestOptions: RequestInit = {
      ...options,
      headers: { ...headers, ...options.headers },
      credentials: 'include' as RequestCredentials,
    };

    console.log(`📤 API Request: ${options.method || 'GET'} ${url}`);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response);

      } catch (error: any) {
        console.warn(`⚠️ API Request attempt ${attempt} failed:`, error.message);

        if (attempt === retries) {
          console.error(`❌ API Request failed after ${retries} attempts:`, error);
          throw new Error(`Request failed: ${error.message}`);
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('Request failed after all retries');
  }

  // =============================================================================
  // ADMIN AUTHENTICATION API
  // =============================================================================

  async adminLogin(email: string, password: string): Promise<ApiResponse<any>> {
    return this.makeRequest(API_CONFIG.endpoints.adminLogin, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async adminLogout(): Promise<ApiResponse<any>> {
    return this.makeRequest(API_CONFIG.endpoints.adminLogout, {
      method: 'POST',
    }, true);
  }

  async getAdminProfile(): Promise<ApiResponse<any>> {
    return this.makeRequest(API_CONFIG.endpoints.adminProfile, {
      method: 'GET',
    }, true);
  }

  async refreshAdminToken(refreshToken: string): Promise<ApiResponse<any>> {
    return this.makeRequest(API_CONFIG.endpoints.adminRefreshToken, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // =============================================================================
  // CATEGORIES API
  // =============================================================================

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.makeRequest(API_CONFIG.endpoints.categories);
  }

  async getCategory(id: string): Promise<ApiResponse<Category>> {
    return this.makeRequest(API_CONFIG.endpoints.category(id));
  }

  async createCategory(categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.makeRequest(API_CONFIG.endpoints.categories, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    }, true);
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.makeRequest(API_CONFIG.endpoints.category(id), {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    }, true);
  }

  async deleteCategory(id: string): Promise<ApiResponse<Category>> {
    return this.makeRequest(API_CONFIG.endpoints.category(id), {
      method: 'DELETE',
    }, true);
  }

  // =============================================================================
  // ARTWORKS API
  // =============================================================================

  async getArtworks(params: Record<string, any> = {}): Promise<ApiResponse<Artwork[]>> {
    return this.makeRequest(`${API_CONFIG.endpoints.artworks}${params ? '?' + new URLSearchParams(params).toString() : ''}`);
  }

  async getArtwork(id: string): Promise<ApiResponse<Artwork>> {
    return this.makeRequest(API_CONFIG.endpoints.artwork(id));
  }

  async createArtwork(artworkData: Partial<Artwork>): Promise<ApiResponse<Artwork>> {
    return this.makeRequest(API_CONFIG.endpoints.artworks, {
      method: 'POST',
      body: JSON.stringify(artworkData),
    }, true);
  }

  async updateArtwork(id: string, artworkData: Partial<Artwork>): Promise<ApiResponse<Artwork>> {
    return this.makeRequest(API_CONFIG.endpoints.artwork(id), {
      method: 'PUT',
      body: JSON.stringify(artworkData),
    }, true);
  }

  async deleteArtwork(id: string): Promise<ApiResponse<Artwork>> {
    return this.makeRequest(API_CONFIG.endpoints.artwork(id), {
      method: 'DELETE',
    }, true);
  }

  // =============================================================================
  // FILE UPLOAD API
  // =============================================================================

  async uploadImage(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('image', file);

    return this.makeRequest(API_CONFIG.endpoints.uploadImage, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }, true);
  }

  async uploadImages(files: File[]): Promise<ApiResponse<any>> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    return this.makeRequest(API_CONFIG.endpoints.uploadImages, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }, true);
  }

  // =============================================================================
  // USERS API
  // =============================================================================

  async getUsers(params: Record<string, any> = {}): Promise<PaginatedResponse<User>> {
    return this.makeRequest(`${API_CONFIG.endpoints.users}${params ? '?' + new URLSearchParams(params).toString() : ''}`, {}, true);
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.makeRequest(API_CONFIG.endpoints.user(id), {}, true);
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.makeRequest(API_CONFIG.endpoints.users, {
      method: 'POST',
      body: JSON.stringify(userData),
    }, true);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.makeRequest(API_CONFIG.endpoints.user(id), {
      method: 'PUT',
      body: JSON.stringify(userData),
    }, true);
  }

  async deleteUser(id: string): Promise<ApiResponse<User>> {
    return this.makeRequest(API_CONFIG.endpoints.user(id), {
      method: 'DELETE',
    }, true);
  }

  // =============================================================================
  // HEALTH & SYSTEM API
  // =============================================================================

  async getHealth(): Promise<ApiResponse<any>> {
    return this.makeRequest(API_CONFIG.endpoints.health);
  }

  async getApiHealth(): Promise<ApiResponse<any>> {
    return this.makeRequest(API_CONFIG.endpoints.apiHealth);
  }

  // =============================================================================
  // USER AUTHENTICATION API (Future implementation)
  // =============================================================================

  async userLogin(email: string, password: string): Promise<ApiResponse<any>> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async userRegister(userData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.makeRequest('/auth/profile', {
      method: 'GET',
    }, false);
  }
}

const apiClient = new ApiClient();

// Export a singleton instance
// const api = new ApiClient(
// );
// Create the structured API that hooks expect
const api = {
  // Core methods
  getHealth: () => apiClient.getHealth(),

  // Admin methods
  admin: {
    login: (email: string, password: string) => apiClient.adminLogin(email, password),
    logout: () => apiClient.adminLogout(),
    getProfile: () => apiClient.getAdminProfile(),
    refreshToken: (token: string) => apiClient.refreshAdminToken(token),
  },

  // Categories methods (what your hooks need)
  categories: {
    getAll: () => apiClient.getCategories(),
    getById: (id: string) => apiClient.getCategory(id),
    create: (data: any) => apiClient.createCategory(data),
    update: (id: string, data: any) => apiClient.updateCategory(id, data),
    delete: (id: string) => apiClient.deleteCategory(id),
  },

  // Artworks methods (what your hooks need)
  artworks: {
    getAll: (params?: any) => apiClient.getArtworks(params),
    getById: (id: string) => apiClient.getArtwork(id),
    create: (data: any) => apiClient.createArtwork(data),
    update: (id: string, data: any) => apiClient.updateArtwork(id, data),
    delete: (id: string) => apiClient.deleteArtwork(id),
  },

  // Upload methods
  upload: {
    image: (file: File) => apiClient.uploadImage(file),
    images: (files: File[]) => apiClient.uploadImages(files),
  },
};

// Export the structured API
export default api;

// Test connection
api.getHealth()
  .then(() => console.log('✅ Backend connection verified'))
  .catch(() => console.warn('⚠️ Backend connection failed - check if server is running'));