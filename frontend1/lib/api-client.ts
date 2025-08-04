import { API_URL } from '@/constant';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends RequestInit {
  token?: string;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Get the auth token from localStorage if available
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

export async function apiClient<T>(
  endpoint: string,
  method: RequestMethod = 'GET',
  data: any = null,
  options: RequestOptions = {}
): Promise<T> {
  // Get token from options or from localStorage
  const token = options.token || getAuthToken();
  const { headers: customHeaders, ...fetchOptions } = options;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...customHeaders,
    },
    credentials: 'include', // Include cookies if needed
    ...fetchOptions,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  // Ensure we don't have double slashes in the URL
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${API_URL}/${normalizedEndpoint}`;
  
  console.log(`Making ${method} request to:`, url);
  const response = await fetch(url, config);
  let responseData;
  
  try {
    responseData = await response.json();
  } catch (error) {
    throw new ApiError('Invalid JSON response', response.status);
  }

  if (!response.ok) {
    throw new ApiError(
      responseData.message || 'Something went wrong',
      response.status,
      responseData.error
    );
  }

  return responseData;
}

// Helper methods for common HTTP methods
export const apiGet = <T>(endpoint: string, options?: RequestOptions) =>
  apiClient<T>(endpoint, 'GET', null, options);

export const apiPost = <T>(endpoint: string, data: any, options?: RequestOptions) =>
  apiClient<T>(endpoint, 'POST', data, options);

export const apiPut = <T>(endpoint: string, data: any, options?: RequestOptions) =>
  apiClient<T>(endpoint, 'PUT', data, options);

export const apiPatch = <T>(endpoint: string, data: any, options?: RequestOptions) =>
  apiClient<T>(endpoint, 'PATCH', data, options);

export const apiDelete = <T>(endpoint: string, options?: RequestOptions) =>
  apiClient<T>(endpoint, 'DELETE', null, options);
