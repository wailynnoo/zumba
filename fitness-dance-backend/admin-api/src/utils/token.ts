// admin-api/src/utils/token.ts
// Token hashing utilities for Admin API

import crypto from "crypto";

/**
 * Hash a refresh token for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Extract device information from request
 */
export function extractDeviceInfo(req: any): string {
  const userAgent = req.headers["user-agent"] || "Unknown";
  // Extract basic device info from user agent
  // Could be enhanced with a library like 'ua-parser-js'
  return userAgent.substring(0, 200); // Limit length
}

/**
 * Extract IP address from request
 */
export function extractIpAddress(req: any): string {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  // Check for real IP header
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return realIp;
  }
  
  // Fallback to connection IP
  return req.ip || req.connection?.remoteAddress || "Unknown";
}

