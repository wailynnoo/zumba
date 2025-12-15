// API client for admin-web
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken, setAuthTokens, removeAuthTokens, shouldRefreshToken } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002",
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/api/auth/refresh`,
      { refreshToken }
    );

    const newAccessToken = response.data?.data?.accessToken;
    const newRefreshToken = response.data?.data?.refreshToken;
    
    if (newAccessToken && newRefreshToken) {
      // Extract expiresIn from token or use default
      const expiresIn = 30 * 60; // 30 minutes default
      setAuthTokens(newAccessToken, newRefreshToken, expiresIn);
      return newAccessToken;
    }
    
    return null;
  } catch (error) {
    // Refresh failed - clear tokens and redirect to login
    removeAuthTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login?session=expired";
    }
    return null;
  }
};

// Request interceptor - add access token and handle refresh
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token refresh for refresh endpoint itself
    if (config.url?.includes("/auth/refresh")) {
      return config;
    }

    // For FormData requests, remove Content-Type header so axios can set it with boundary
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
      }
    }

    let token = getAccessToken();

    // Check if token needs refresh
    if (shouldRefreshToken() && !isRefreshing) {
      isRefreshing = true;
      token = await refreshAccessToken();
      isRefreshing = false;
      processQueue(null, token);
    }

    // If still refreshing, wait for it
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
          return config;
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Skip retry for login/refresh endpoints
      if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh")) {
        removeAuthTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login?error=unauthorized";
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If already refreshing, wait for it
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Try to refresh token
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        processQueue(null, newToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } else {
        // Refresh failed
        processQueue(error, null);
        removeAuthTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login?session=expired";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

