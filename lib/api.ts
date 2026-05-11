const API_URL = 'http://localhost:3001/api/v1';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (typeof window !== 'undefined' && !headers.has('Authorization')) {
    const token = window.localStorage.getItem('accessToken');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      // Required for cookie-based authentication (JWT in cookies)
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    const isNetworkError = 
      (err.name === 'TypeError' && err.message === 'Failed to fetch') || // Chrome/Edge
      (err.name === 'NetworkError') || // Firefox
      (err.message?.includes('NetworkError')) ||
      (err.message?.includes('fetch resource'));

    if (isNetworkError) {
      throw new Error('Connection failed: The server is unreachable. Please check if the backend is running or use Demo Mode.');
    }
    throw err;
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint: string, options?: RequestInit) => 
    apiRequest(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, data: any, options?: RequestInit) => 
    apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  
  put: (endpoint: string, data: any, options?: RequestInit) => 
    apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  
  patch: (endpoint: string, data: any, options?: RequestInit) => 
    apiRequest(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  
  delete: (endpoint: string, options?: RequestInit) => 
    apiRequest(endpoint, { ...options, method: 'DELETE' }),

  upload: (endpoint: string, formData: FormData, options?: RequestInit) => 
    apiRequest(endpoint, { ...options, method: 'POST', body: formData }),

  // Special method for downloading files
  download: async (endpoint: string) => {
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  }
};
