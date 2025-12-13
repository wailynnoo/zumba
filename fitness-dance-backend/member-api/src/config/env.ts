// member-api/src/config/env.ts
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
    .default("3001")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 65535, {
      message: "PORT must be between 1 and 65535",
    }),

  // Database
  DATABASE_URL: z.string().url({
    message: "DATABASE_URL must be a valid URL",
  }),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, {
    message: "JWT_ACCESS_SECRET must be at least 32 characters",
  }),
  JWT_REFRESH_SECRET: z.string().min(32, {
    message: "JWT_REFRESH_SECRET must be at least 32 characters",
  }),
  JWT_ACCESS_EXPIRY: z
    .string()
    .optional()
    .default("30m")
    .refine((val) => /^\d+[smhd]$/.test(val), {
      message: "JWT_ACCESS_EXPIRY must be in format like '30m', '1h', '7d'",
    }),
  JWT_REFRESH_EXPIRY: z
    .string()
    .optional()
    .default("7d")
    .refine((val) => /^\d+[smhd]$/.test(val), {
      message: "JWT_REFRESH_EXPIRY must be in format like '30m', '1h', '7d'",
    }),

  // CORS
  CORS_ORIGIN: z
    .string()
    .optional()
    .default("http://localhost:3000,http://localhost:3001")
    .transform((val) => val.split(",").map((origin) => origin.trim())),

  // Trust Proxy
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((val) => {
      if (val !== undefined) {
        return val === "true" || val === "1";
      }
      return process.env.NODE_ENV === "production";
    }),

  // Cloudflare R2 (for video streaming)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional().default("fitness-dance-videos"),
  R2_ENDPOINT: z.string().optional(),
});

// Validate environment variables
const env = envSchema.parse(process.env);

export { env };

