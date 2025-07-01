/**
 * 🎨 ELOUARATE ART - Professional API Client
 * Connects frontend to the Railway backend deployment
 */

// Backend URLs - Railway production and local development
const API_URLS = {
  production: 'https://artelouarate-backend-production.up.railway.app',
  development: 'http://localhost:3000',
};

// Determine which API URL to use
const getApiUrl = (): string => {
  // Check environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Auto-detect based on hostname
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return API_URLS.development;
  }
  
  // Default to production for Railway deployment
  return API_URLS.production;
};

const API_BASE = getApiUrl();

console.log(`🔗 API Client connecting to: ${API_BASE}`);

/**
 * Professional API Client with error handling and retry logic
 */
class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(useAdminToken = false): Record<string, string> {
    const tokenKey = useAdminToken ? 'adminToken' : 'userToken';
    const token = localStorage.getItem(tokenKey);
    
    return token
      ? { ...this.defaultHeaders, Authorization: `Bearer ${token}` }
      : this.defaultHeaders;
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
    const url = `${this.baseUrl}${endpoint}`;
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

  async adminLogin(email: string, password: string) {
    console.log('🔐 Admin login request');
    return this.makeRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async adminLogout() {
    console.log('🚪 Admin logout request');
    return this.makeRequest('/api/admin/logout', {
      method: 'POST',
    }, true);
  }

  async getAdminProfile() {
    console.log('👤 Fetching admin profile');
    return this.makeRequest('/api/admin/profile', {
      method: 'GET',
    }, true);
  }

  async refreshAdminToken(refreshToken: string) {
    console.log('🔄 Refreshing admin token');
    return this.makeRequest('/api/admin/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // =============================================================================
  // CATEGORIES API
  // =============================================================================

  async getCategories() {
    console.log('📂 Fetching categories');
    return this.makeRequest('/api/categories');
  }

  async getCategory(id: number) {
    console.log(`📂 Fetching category: ${id}`);
    return this.makeRequest(`/api/categories/${id}`);
  }

  async createCategory(categoryData: any) {
    console.log('📂 Creating category');
    return this.makeRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    }, true);
  }

  async updateCategory(id: number, categoryData: any) {
    console.log(`📂 Updating category: ${id}`);
    return this.makeRequest(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    }, true);
  }

  async deleteCategory(id: number) {
    console.log(`📂 Deleting category: ${id}`);
    return this.makeRequest(`/api/categories/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // =============================================================================
  // ARTWORKS API
  // =============================================================================

  async getArtworks(params: {
    category?: number;
    status?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/artworks${queryParams.toString() ? `?${queryParams}` : ''}`;
    console.log(`🎨 Fetching artworks: ${endpoint}`);
    return this.makeRequest(endpoint);
  }

  async getArtwork(id: number) {
    console.log(`🎨 Fetching artwork: ${id}`);
    return this.makeRequest(`/api/artworks/${id}`);
  }

  async createArtwork(artworkData: any) {
    console.log('🎨 Creating artwork');
    return this.makeRequest('/api/artworks', {
      method: 'POST',
      body: JSON.stringify(artworkData),
    }, true);
  }

  async updateArtwork(id: number, artworkData: any) {
    console.log(`🎨 Updating artwork: ${id}`);
    return this.makeRequest(`/api/artworks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(artworkData),
    }, true);
  }

  async deleteArtwork(id: number) {
    console.log(`🎨 Deleting artwork: ${id}`);
    return this.makeRequest(`/api/artworks/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // =============================================================================
  // FILE UPLOAD API
  // =============================================================================

  async uploadImage(file: File) {
    console.log(`📸 Uploading image: ${file.name}`);
    const formData = new FormData();
    formData.append('image', file);

    return this.makeRequest('/api/upload/image', {
      method: 'POST',
      body: formData,
      headers: this.getAuthHeaders(true), // Remove Content-Type for FormData
    }, true);
  }

  async uploadImages(files: File[]) {
    console.log(`📸 Uploading ${files.length} images`);
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    return this.makeRequest('/api/upload/images', {
      method: 'POST',
      body: formData,
      headers: this.getAuthHeaders(true), // Remove Content-Type for FormData
    }, true);
  }

  // =============================================================================
  // HEALTH & SYSTEM API
  // =============================================================================

  async getHealth() {
    console.log('🏥 Health check');
    return this.makeRequest('/health');
  }

  async getApiHealth() {
    console.log('🏥 API health check');
    return this.makeRequest('/api/health');
  }

  // =============================================================================
  // USER AUTHENTICATION API (Future implementation)
  // =============================================================================

  async userLogin(email: string, password: string) {
    console.log('🔐 User login request');
    return this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async userRegister(userData: any) {
    console.log('📝 User registration request');
    return this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserProfile() {
    console.log('👤 Fetching user profile');
    return this.makeRequest('/api/auth/profile', {
      method: 'GET',
    });
  }
}

// Export configured API client instance
export const api = new ApiClient(API_BASE);

// Export individual API modules for convenience
export const adminApi = {
  login: api.adminLogin.bind(api),
  logout: api.adminLogout.bind(api),
  getProfile: api.getAdminProfile.bind(api),
  refreshToken: api.refreshAdminToken.bind(api),
};

export const categoriesApi = {
  getAll: api.getCategories.bind(api),
  getById: api.getCategory.bind(api),
  create: api.createCategory.bind(api),
  update: api.updateCategory.bind(api),
  delete: api.deleteCategory.bind(api),
};

export const artworksApi = {
  getAll: api.getArtworks.bind(api),
  getById: api.getArtwork.bind(api),
  create: api.createArtwork.bind(api),
  update: api.updateArtwork.bind(api),
  delete: api.deleteArtwork.bind(api),
};

export const uploadApi = {
  image: api.uploadImage.bind(api),
  images: api.uploadImages.bind(api),
};

export const healthApi = {
  check: api.getHealth.bind(api),
  apiCheck: api.getApiHealth.bind(api),
};

// Export default API client
export default api;

// Test connection on module load
api.getHealth()
  .then(() => console.log('✅ Backend connection verified'))
  .catch(() => console.warn('⚠️ Backend connection failed - check if server is running')); 