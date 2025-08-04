import { apiPost, apiGet } from '@/lib/api-client';
import { setAuthToken, clearAuthToken } from '@/lib/auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  first_name: string;
  last_name: string;
  // Add other registration fields as needed
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    // Add other user fields as needed
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiPost<AuthResponse>('/token/', credentials);
      setAuthToken(response.access, response.refresh);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiPost<AuthResponse>('/users/register/', userData);
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    try {
      return await apiPost<{ access: string }>('/token/refresh/', {
        refresh: refreshToken,
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthToken();
      throw error;
    }
  },

  logout(): void {
    clearAuthToken();
    // Redirect to login or home page
    window.location.href = '/login';
  },

  async getCurrentUser(token: string) {
    try {
      return await apiGet<AuthResponse['user']>('/users/me/', {
        token,
      });
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  },
};
