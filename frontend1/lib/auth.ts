// Authentication and role management
export type UserRole = 'superadmin' | 'admin' | 'manager' | 'developer' | 'sales' | 'support' | 'verifier';

// Token storage keys - match Django's default JWT token keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// For backward compatibility with old token keys
const LEGACY_ACCESS_TOKEN_KEY = 'access';
const LEGACY_REFRESH_TOKEN_KEY = 'refresh';

// JWT token type
export interface JwtPayload {
  user_id: number;
  email: string;
  role: UserRole;
  exp: number;
  iat?: number; // Issued At (optional)
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
  // Try to get the token from standard location first, then fall back to legacy key
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // Try to get the token from standard location first, then fall back to legacy key
  return localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
};

export const setAuthToken = (access: string, refresh: string): void => {
  if (typeof window !== 'undefined') {
    // Store in both new and legacy formats for compatibility
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, access);
    localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, refresh);
    
    console.log('[AUTH] Tokens stored in localStorage');
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    // Clear both new and legacy token keys
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    
    console.log('[AUTH] Tokens cleared from localStorage');
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    console.log('[AUTH] Checking token expiration...');
    
    // Basic validation
    if (!token || typeof token !== 'string') {
      console.error('[AUTH] Invalid token');
      return true;
    }
    
    // Try to parse the token
    const payload = parseJwt(token);
    if (!payload) {
      console.error('[AUTH] Failed to parse token');
      return true;
    }
    
    if (!payload.exp) {
      console.error('[AUTH] No expiration time in token');
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    // Add a small buffer (5 minutes) to account for clock skew
    const isExpired = payload.exp < (currentTime - 300);
    
    console.log(`[AUTH] Token expiration check - exp: ${new Date(payload.exp * 1000).toISOString()}, current: ${new Date(currentTime * 1000).toISOString()}, isExpired: ${isExpired}`);
    
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
    
    // Basic validation
    if (!token || typeof token !== 'string') {
      console.error('[AUTH] Invalid token in parseJwt');
      return null;
    }
    
    // Split the token
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[AUTH] Invalid token format in parseJwt: expected 3 parts');
      return null;
    }
    
    // Get the payload part
    const base64Url = parts[1];
    
    // Add padding if needed and replace URL-safe characters
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    try {
      // Decode the base64 string
      const jsonPayload = atob(paddedBase64);
      
      // Parse the JSON payload
      const payload = JSON.parse(jsonPayload);
      
      // Log the token payload for debugging (without sensitive data)
      const { exp, iat, ...safePayload } = payload;
      console.log('[AUTH] Decoded token payload:', {
        ...safePayload,
        exp: exp ? new Date(exp * 1000).toISOString() : null,
        iat: iat ? new Date(iat * 1000).toISOString() : null,
      });
      
      // Map to expected JwtPayload with fallbacks
      return {
        user_id: payload.user_id,
        email: payload.email || '',
        role: payload.role || 'user',
        exp: payload.exp || 0,
      };
    } catch (error) {
      console.error('[AUTH] Error decoding token payload:', error);
      return null;
    }
  } catch (error) {
    console.error('[AUTH] Error parsing JWT:', error);
    return null;
  }
};

// Get current user from token
export const getCurrentUser = (): User | null => {
  try {
    console.log('[AUTH] Getting current user from token...');
    
    // Return null on server side
    if (typeof window === 'undefined') {
      console.log('[AUTH] Server-side rendering, returning null');
      return null;
    }
    
    const token = getAccessToken();
    if (!token) {
      console.log('[AUTH] No access token found');
      return null;
    }
    
    console.log('[AUTH] Access token found, validating...');
    
    if (isTokenExpired(token)) {
      console.log('[AUTH] Token is expired, clearing auth data');
      clearAuthToken();
      return null;
    }
    
    console.log('[AUTH] Token is valid, parsing payload...');
    const payload = parseJwt(token);
    if (!payload) {
      console.error('[AUTH] Failed to parse token payload');
      return null;
    }
    
    // Log user info for debugging
    console.log('[AUTH] User authenticated:', {
      userId: payload.user_id,
      email: payload.email,
      role: payload.role
    });
    
    // Map JWT payload to User interface with fallbacks
    const user: User = {
      id: payload.user_id,
      name: payload.email?.split('@')[0] || 'User', // Default name from email
      email: payload.email || '',
      role: payload.role || 'user',
      avatar: payload.email?.charAt(0).toUpperCase() || 'U', // First letter of email as avatar
    };
    
    return user;
  } catch (error) {
    console.error('[AUTH] Error getting current user:', error);
    return null;
  }
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

// Get current user with fallback to mock for development
export const getCurrentUserWithFallback = (): User | null => {
  const user = getCurrentUser();
  
  // In development, return mock user if no real user is found
  if (!user && process.env.NODE_ENV === 'development') {
    return getMockUser();
  }
  
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