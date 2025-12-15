// Authentication utilities for admin-web
// Using sessionStorage instead of localStorage for better XSS protection
// Note: For production, consider httpOnly cookies (requires backend changes)

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  name?: string;
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp when access token expires
}

const TOKEN_KEY = "admin_tokens";
const TOKEN_EXPIRY_BUFFER = 60000; // Refresh 1 minute before expiry

/**
 * Store both access and refresh tokens
 * Using sessionStorage for better XSS protection (cleared on tab close)
 */
export const setAuthTokens = (accessToken: string, refreshToken: string, expiresIn?: number) => {
  if (typeof window !== "undefined") {
    const expiresAt = expiresIn 
      ? Date.now() + expiresIn * 1000 
      : Date.now() + 30 * 60 * 1000; // Default 30 minutes
    
    const tokenData: TokenData = {
      accessToken,
      refreshToken,
      expiresAt,
    };
    
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
  }
};

/**
 * Get access token (returns null if expired or not found)
 */
export const getAccessToken = (): string | null => {
  if (typeof window !== "undefined") {
    const tokenData = getTokenData();
    if (!tokenData) return null;
    
    // Check if token is expired
    if (Date.now() >= tokenData.expiresAt) {
      return null;
    }
    
    return tokenData.accessToken;
  }
  return null;
};

/**
 * Get refresh token
 */
export const getRefreshToken = (): string | null => {
  if (typeof window !== "undefined") {
    const tokenData = getTokenData();
    return tokenData?.refreshToken || null;
  }
  return null;
};

/**
 * Get token data from sessionStorage
 */
const getTokenData = (): TokenData | null => {
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored) as TokenData;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Check if access token needs refresh (within buffer time)
 */
export const shouldRefreshToken = (): boolean => {
  const tokenData = getTokenData();
  if (!tokenData) return false;
  
  const timeUntilExpiry = tokenData.expiresAt - Date.now();
  return timeUntilExpiry < TOKEN_EXPIRY_BUFFER;
};

/**
 * Get time until token expires (in milliseconds)
 */
export const getTimeUntilExpiry = (): number | null => {
  const tokenData = getTokenData();
  if (!tokenData) return null;
  
  const timeUntilExpiry = tokenData.expiresAt - Date.now();
  return timeUntilExpiry > 0 ? timeUntilExpiry : 0;
};

/**
 * Clear all tokens
 */
export const removeAuthTokens = () => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use setAuthTokens instead
 */
export const setAuthToken = (token: string) => {
  // For backward compatibility, treat as access token only
  // This should be updated to use refresh token from API response
  setAuthTokens(token, "", 30 * 60); // 30 minutes default
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getAccessToken instead
 */
export const getAuthToken = (): string | null => {
  return getAccessToken();
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use removeAuthTokens instead
 */
export const removeAuthToken = () => {
  removeAuthTokens();
};

