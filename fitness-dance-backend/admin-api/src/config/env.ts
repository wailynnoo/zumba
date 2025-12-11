// admin-api/src/config/env.ts
// Environment variable validation and configuration

import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Environment variable schema
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z
    .string()
    .optional()
    .default("3002")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 65535, {
      message: "PORT must be between 1 and 65535",
    }),

  // Database
  DATABASE_URL: z.string().url({
    message: "DATABASE_URL must be a valid URL",
  }),

  // JWT (support both old and new naming - at least one must be provided)
  JWT_SECRET: z.string().min(32, {
    message: "JWT_SECRET must be at least 32 characters",
  }).optional(),
  JWT_ACCESS_SECRET: z.string().min(32, {
    message: "JWT_ACCESS_SECRET must be at least 32 characters",
  }).optional(),
  JWT_REFRESH_SECRET: z.string().min(32, {
    message: "JWT_REFRESH_SECRET must be at least 32 characters",
  }),
  JWT_EXPIRES_IN: z
    .string()
    .optional()
    .default("30m")
    .refine((val) => /^\d+[smhd]$/.test(val), {
      message: "JWT_EXPIRES_IN must be in format like '30m', '1h', '7d'",
    }),
  JWT_ACCESS_EXPIRY: z
    .string()
    .optional()
    .default("30m")
    .refine((val) => /^\d+[smhd]$/.test(val), {
      message: "JWT_ACCESS_EXPIRY must be in format like '30m', '1h', '7d'",
    }),
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .optional()
    .default("7d")
    .refine((val) => /^\d+[smhd]$/.test(val), {
      message: "JWT_REFRESH_EXPIRES_IN must be in format like '30m', '1h', '7d'",
    }),
  JWT_REFRESH_EXPIRY: z
    .string()
    .optional()
    .default("7d")
    .refine((val) => /^\d+[smhd]$/.test(val), {
      message: "JWT_REFRESH_EXPIRY must be in format like '30m', '1h', '7d'",
    }),

  // JWT Issuer and Audience (for token validation)
  JWT_ISSUER: z
    .string()
    .optional()
    .default("fitness-dance-admin-api"),
  JWT_AUDIENCE: z
    .string()
    .optional()
    .default("fitness-dance-admin"),

  // CORS
  CORS_ORIGIN: z
    .string()
    .optional()
    .default("http://localhost:3000,http://localhost:3001")
    .transform((val) => val.split(",").map((origin) => origin.trim())),

  // Trust Proxy
  // Default to true in production (Railway, Heroku, etc. are behind proxies)
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((val) => {
      // If explicitly set, use that value
      if (val !== undefined) {
        return val === "true" || val === "1";
      }
      // Otherwise, default to true in production
      return process.env.NODE_ENV === "production";
    }),

  // Super Admin (optional, for seeding)
  SUPER_ADMIN_PASSWORD: z.string().optional(),

  // Cloudflare R2 (S3-compatible storage)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional().default("fitness-dance-videos"),
  R2_PUBLIC_URL: z.string().url().optional(), // Public URL for R2 bucket (if using custom domain)
  R2_ENDPOINT: z.string().optional().default("https://{account_id}.r2.cloudflarestorage.com"),
});

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    
    // Additional validation: at least one JWT secret must be provided
    if (!parsed.JWT_SECRET && !parsed.JWT_ACCESS_SECRET) {
      throw new Error("Either JWT_SECRET or JWT_ACCESS_SECRET must be provided");
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .filter((issue) => issue.code === "invalid_type" && (issue as any).received === "undefined")
        .map((issue) => issue.path.join("."));

      const invalidVars = error.issues
        .filter((issue) => issue.code !== "invalid_type" || (issue as any).received !== "undefined")
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`);

      const errors: string[] = [];

      if (missingVars.length > 0) {
        errors.push(`Missing required environment variables: ${missingVars.join(", ")}`);
      }

      if (invalidVars.length > 0) {
        errors.push(`Invalid environment variables: ${invalidVars.join("; ")}`);
      }

      throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
    }
    throw error;
  }
}

// Validate and export environment variables
export const env = validateEnv();

// Export individual variables for convenience
export const {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  JWT_SECRET,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRES_IN,
  JWT_REFRESH_EXPIRY,
  JWT_ISSUER,
  JWT_AUDIENCE,
  CORS_ORIGIN,
  TRUST_PROXY,
  SUPER_ADMIN_PASSWORD,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  R2_ENDPOINT,
} = env;

// Helper to get JWT secret (supports both old and new naming)
export const getJwtSecret = () => env.JWT_ACCESS_SECRET || env.JWT_SECRET || "";
export const getJwtExpiresIn = () => env.JWT_ACCESS_EXPIRY || env.JWT_EXPIRES_IN || "30m";
export const getJwtRefreshExpiresIn = () => env.JWT_REFRESH_EXPIRY || env.JWT_REFRESH_EXPIRES_IN || "7d";

