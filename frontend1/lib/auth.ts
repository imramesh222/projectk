// Authentication and role management
export type UserRole = 'superadmin' | 'admin' | 'manager' | 'developer' | 'sales' | 'support' | 'verifier';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// JWT token type
export interface JwtPayload {
  user_id: number;
  email: string;
  role: UserRole;
  exp: number;
  // Add other JWT claims as needed
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  avatar?: string;
  // Add other user fields as needed
}

// Token management
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setAuthToken = (access: string, refresh: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    console.log('[AUTH] Checking token expiration...');
    
    // Check if token has the expected format
    if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
      console.error('[AUTH] Invalid token format');
      return true;
    }
    
    const parts = token.split('.');
    const base64Url = parts[1];
    
    // Add padding if needed
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    console.log('[AUTH] Decoding token payload...');
    const decodedPayload = atob(paddedBase64);
    console.log('[AUTH] Decoded payload:', decodedPayload);
    
    const payload = JSON.parse(decodedPayload) as JwtPayload;
    
    if (!payload.exp) {
      console.error('[AUTH] No expiration time in token');
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < currentTime;
    
    console.log(`[AUTH] Token expiration check - exp: ${payload.exp}, current: ${currentTime}, isExpired: ${isExpired}`);
    
    return isExpired;
  } catch (error) {
    console.error('[AUTH] Error checking token expiration:', error);
    return true;
  }
};

// Parse JWT token
export const parseJwt = (token: string): JwtPayload | null => {
  try {
    console.log('[AUTH] Parsing JWT token...');
    
    // Check if token has the expected format
    if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
      console.error('[AUTH] Invalid token format in parseJwt');
      return null;
    }
    
    const parts = token.split('.');
    const base64Url = parts[1];
    
    // Add padding if needed
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    console.log('[AUTH] Decoding token payload in parseJwt...');
    const decodedPayload = atob(paddedBase64);
    console.log('[AUTH] Decoded payload in parseJwt:', decodedPayload);
    
    const payload = JSON.parse(decodedPayload);
    
    // Validate the payload structure
    if (!payload || typeof payload !== 'object' || !payload.user_id || !payload.role) {
      console.error('[AUTH] Invalid token payload structure:', payload);
      return null;
    }
    
    return payload as JwtPayload;
  } catch (error) {
    console.error('[AUTH] Error parsing JWT token:', error);
    return null;
  }
};

// Get current user from token
export const getCurrentUser = (): User | null => {
  // Return null on server side
  if (typeof window === 'undefined') return null;
  
  const token = getAccessToken();
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    clearAuthToken();
    return null;
  }
  
  const payload = parseJwt(token);
  if (!payload) return null;
  
  // Map JWT payload to User interface
  return {
    id: payload.user_id,
    name: payload.email.split('@')[0], // Default name from email
    email: payload.email,
    role: payload.role,
    avatar: payload.email.charAt(0).toUpperCase(), // First letter of email as avatar
  };
};

// Mock user for development (remove in production)
export const getMockUser = (): User => {
  return {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'superadmin',
    avatar: 'A',
    organization: 'Example Corp'
  };
};

// Get current user with fallback to basic user data
export const getCurrentUserWithFallback = (): any => {
  // Get the basic user data from the token
  const user = getCurrentUser();
  if (!user) return null;
  
  // Note: We're not adding mock data here anymore
  // The actual organization memberships will be fetched from the API
  // in the dashboard page or other components that need them
  return user;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  // Always return false during server-side rendering
  if (typeof window === 'undefined') {
    console.log('[AUTH] Server-side rendering, not authenticated');
    return false;
  }
  
  try {
    console.log('[AUTH] Checking authentication status...');
    const token = getAccessToken();
    
    if (!token) {
      console.log('[AUTH] No access token found in localStorage');
      console.log('[AUTH] localStorage content:', JSON.stringify(window.localStorage, null, 2));
      return false;
    }
    
    console.log('[AUTH] Access token found, checking expiration...');
    const isExpired = isTokenExpired(token);
    
    if (isExpired) {
      console.log('[AUTH] Token is expired');
      // Try to parse the token to see its contents
      try {
        const tokenData = parseJwt(token);
        console.log('[AUTH] Expired token data:', tokenData);
        if (tokenData?.exp) {
          const expiryDate = new Date(tokenData.exp * 1000);
          console.log(`[AUTH] Token expired on: ${expiryDate.toISOString()}`);
        }
      } catch (e) {
        console.error('[AUTH] Error parsing token:', e);
      }
      return false;
    }
    
    // If we get here, token is valid
    const user = getCurrentUserWithFallback();
    console.log('[AUTH] User is authenticated');
    console.log('[AUTH] User data:', user);
    
    if (!user) {
      console.log('[AUTH] No user data found, not authenticated');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[AUTH] Error in isAuthenticated:', error);
    return false;
  }
};

// Role-based access control
export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    superadmin: 7,
    admin: 6,
    manager: 5,
    developer: 4,
    sales: 3,
    support: 2,
    verifier: 1,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    superadmin: 'Super Admin',
    admin: 'Organization Admin',
    manager: 'Project Manager',
    developer: 'Developer',
    sales: 'Salesperson',
    support: 'Support Staff',
    verifier: 'Verifier',
  };
  
  return roleNames[role] || role;
};

// Check if current user has required role
export const hasRequiredRole = (requiredRole: UserRole): boolean => {
  const user = getCurrentUserWithFallback();
  return user ? hasPermission(user.role, requiredRole) : false;
};