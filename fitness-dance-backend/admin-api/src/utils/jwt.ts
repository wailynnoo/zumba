// admin-api/src/utils/jwt.ts
// JWT token utilities for Admin API

import jwt from "jsonwebtoken";
import { getJwtSecret, getJwtExpiresIn, getJwtRefreshExpiresIn, env } from "../config/env";

const JWT_SECRET = getJwtSecret();
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = getJwtExpiresIn();
const JWT_REFRESH_EXPIRES_IN = getJwtRefreshExpiresIn();
const JWT_ISSUER = env.JWT_ISSUER;
const JWT_AUDIENCE = env.JWT_AUDIENCE;

/**
 * Convert JWT expiry string (e.g., "7d", "30m", "1h") to milliseconds
 * Supports: s (seconds), m (minutes), h (hours), d (days)
 */
export function parseJwtExpiryToMs(expiryString: string): number {
  const match = expiryString.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiryString}. Expected format: "30m", "7d", etc.`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,           // seconds to milliseconds
    m: 60 * 1000,      // minutes to milliseconds
    h: 60 * 60 * 1000, // hours to milliseconds
    d: 24 * 60 * 60 * 1000, // days to milliseconds
  };

  return value * multipliers[unit];
}

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  roleId: string;
  roleSlug: string;
  type: "access" | "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<AdminTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "access" },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    } as jwt.SignOptions
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: Omit<AdminTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "refresh" },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    } as jwt.SignOptions
  );
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: Omit<AdminTokenPayload, "type">): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): AdminTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as AdminTokenPayload;
    if (decoded.type !== "access") {
      throw new Error("Invalid token type");
    }
    return decoded;
  } catch (error: any) {
    if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
      throw new Error(`Invalid access token: ${error.message}`);
    }
    throw new Error("Invalid or expired access token");
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): AdminTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as AdminTokenPayload;
    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type");
    }
    return decoded;
  } catch (error: any) {
    if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
    throw new Error("Invalid or expired refresh token");
  }
}

