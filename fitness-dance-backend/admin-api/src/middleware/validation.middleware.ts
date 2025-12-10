// admin-api/src/middleware/validation.middleware.ts
// Query parameter and request validation middleware

import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { AppError } from "./error.middleware";

/**
 * Validate query parameters using Zod schema
 * Stores validated values in req.validatedQuery for use in controllers
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      // Store validated values in a custom property since req.query is read-only
      (req as any).validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          `Invalid query parameters: ${error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
          400
        );
      }
      next(error);
    }
  };
}

/**
 * Validate request body using Zod schema
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          `Invalid request body: ${error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
          400
        );
      }
      next(error);
    }
  };
}

/**
 * Validate request params using Zod schema
 * Stores validated values in req.validatedParams
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      // Store validated values in a custom property
      (req as any).validatedParams = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          `Invalid route parameters: ${error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
          400
        );
      }
      next(error);
    }
  };
}

/**
 * Common query parameter schemas
 */
export const querySchemas = {
  /**
   * Pagination query schema
   */
  pagination: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || (val > 0 && val <= 1000), {
        message: "Page must be between 1 and 1000",
      }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || (val > 0 && val <= 100), {
        message: "Limit must be between 1 and 100",
      }),
  }),

  /**
   * Boolean query parameter schema
   */
  boolean: (paramName: string) =>
    z.object({
      [paramName]: z
        .string()
        .optional()
        .transform((val) => {
          if (val === undefined) return undefined;
          if (val === "true") return true;
          if (val === "false") return false;
          return val;
        })
        .refine((val) => val === undefined || typeof val === "boolean", {
          message: `${paramName} must be 'true' or 'false'`,
        }),
    }),

  /**
   * Search query schema
   */
  search: z.object({
    search: z.string().optional().refine((val) => !val || val.length <= 200, {
      message: "Search term must be 200 characters or less",
    }),
  }),

  /**
   * Category list query schema (combines pagination, boolean, and search)
   */
  categoryList: z
    .object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .refine((val) => val === undefined || (val > 0 && val <= 1000), {
          message: "Page must be between 1 and 1000",
        }),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .refine((val) => val === undefined || (val > 0 && val <= 100), {
          message: "Limit must be between 1 and 100",
        }),
      isActive: z
        .string()
        .optional()
        .transform((val) => {
          if (val === undefined) return undefined;
          if (val === "true") return true;
          if (val === "false") return false;
          return val;
        })
        .refine((val) => val === undefined || typeof val === "boolean", {
          message: "isActive must be 'true' or 'false'",
        }),
      search: z.string().optional().refine((val) => !val || val.length <= 200, {
        message: "Search term must be 200 characters or less",
      }),
    })
    .passthrough(), // Allow other query params to pass through
};

