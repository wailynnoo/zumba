// admin-api/src/middleware/security.middleware.ts
// Security middleware configuration for Admin API

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/**
 * Helmet configuration for security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * General API rate limiter
 * Configurable via environment variables:
 * - RATE_LIMIT_WINDOW_MS: Time window in milliseconds (default: 900000 = 15 minutes)
 * - RATE_LIMIT_MAX_REQUESTS: Max requests per window (default: 100)
 * Note: For file uploads, we use a separate limiter with higher limits
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // Configurable window (default: 15 minutes)
  max: env.RATE_LIMIT_MAX_REQUESTS, // Configurable max requests (default: 100)
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks and file upload endpoints
    // File uploads are large and should not be rate limited the same way
    return req.path === "/health" || 
           req.path.includes("/video") || 
           req.path.includes("/thumbnail") || 
           req.path.includes("/audio");
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Configurable via environment variables:
 * - RATE_LIMIT_WINDOW_MS: Time window in milliseconds (default: 900000 = 15 minutes)
 * - RATE_LIMIT_AUTH_MAX_REQUESTS: Max auth requests per window (default: 5)
 */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // Configurable window (default: 15 minutes)
  max: env.RATE_LIMIT_AUTH_MAX_REQUESTS, // Configurable max auth requests (default: 5)
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Body size limit configuration
 * Express default is 100kb, we'll set it to 1MB for JSON and 10MB for URL-encoded
 */
export const bodySizeLimit = {
  json: "1mb",
  urlencoded: "10mb",
};

