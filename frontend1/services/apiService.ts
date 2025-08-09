import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_URL } from '@/constant';
// Create axios instance with base URL from environment variables
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Keep for session/auth cookies if needed
});

// Flag to prevent multiple simultaneous token refresh requests
let isRefreshing = false;
let failedQueue: Array<{resolve: (value?: any) => void; reject: (error: any) => void}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  async (config) => {
    // Only run this in the browser
    if (typeof window === 'undefined') {
      return config;
    }

    // Add auth token if available
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error status is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const response = await axios.post(
          `${API_URL}/auth/token/refresh/`,
          { refresh: localStorage.getItem('refresh_token') }
        );
        
        const { access } = response.data;
        
        // Update the tokens
        localStorage.setItem('access_token', access);
        
        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (error) {
        // If refresh token is invalid, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // If the error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No refresh token available, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return reject(error);
        }

        // Try to refresh the token
        api
          .post('/auth/token/refresh/', { refresh: refreshToken })
          .then(({ data }) => {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            // Update the Authorization header
            api.defaults.headers.common['Authorization'] = 'Bearer ' + data.access;
            originalRequest.headers['Authorization'] = 'Bearer ' + data.access;
            
            // Process any queued requests
            processQueue(null, data.access);
            
            // Retry the original request
            resolve(api(originalRequest));
          })
          .catch((err) => {
            // If refresh fails, clear tokens and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            
            processQueue(err, null);
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const apiGet = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.get<T>(url, config);
  return response.data;
};

export const apiPost = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.post<T>(url, data, config);
  return response.data;
};

export const apiPut = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.put<T>(url, data, config);
  return response.data;
};

export const apiPatch = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.patch<T>(url, data, config);
  return response.data;
};

export const apiDelete = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.delete<T>(url, config);
  return response.data;
};

export default api;
