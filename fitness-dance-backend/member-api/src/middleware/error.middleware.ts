// member-api/src/middleware/error.middleware.ts
// Centralized error handling middleware for Member API

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

/**
 * Custom application error class
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Map Prisma error codes to user-friendly messages
 */
function getPrismaErrorMessage(error: any): string {
  const { code, meta } = error;

  switch (code) {
    case "P2002": {
      // Unique constraint violation
      const target = (meta?.target as string[]) || [];
      const field = target[0] || "field";
      return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please use a different ${field}.`;
    }
    case "P2003": {
      // Foreign key constraint violation
      const field = (meta?.field_name as string) || "related record";
      return `Cannot perform this operation because it would violate a foreign key constraint. The ${field} does not exist or is referenced by other records.`;
    }
    case "P2025": {
      // Record not found
      return "The requested record was not found.";
    }
    case "P2000": {
      // Value too long
      return "The provided value is too long for the database field.";
    }
    case "P2001": {
      // Record does not exist
      return "The requested record does not exist.";
    }
    case "P2014": {
      // Required relation violation
      const relation = (meta?.relation_name as string) || "relation";
      return `The change you are trying to make would violate the required relation '${relation}'.`;
    }
    case "P2015": {
      // Related record not found
      return "A related record was not found.";
    }
    case "P2016": {
      // Query interpretation error
      return "The query could not be interpreted. Please check your input.";
    }
    case "P2017": {
      // Records for relation not connected
      return "The records for this relation are not connected.";
    }
    case "P2018": {
      // Required connected records not found
      return "Required connected records were not found.";
    }
    case "P2019": {
      // Input error
      return "Invalid input provided.";
    }
    case "P2020": {
      // Value out of range
      return "The provided value is out of range for the database field.";
    }
    case "P2021": {
      // Table does not exist
      return "The requested table does not exist in the database.";
    }
    case "P2022": {
      // Column does not exist
      return "The requested column does not exist in the database.";
    }
    case "P2023": {
      // Inconsistent column data
      return "The data in the database is inconsistent.";
    }
    case "P2024": {
      // Connection timeout
      return "The database connection timed out. Please try again.";
    }
    case "P2026": {
      // Unsupported feature
      return "The requested database feature is not supported.";
    }
    case "P2027": {
      // Multiple errors
      return "Multiple errors occurred while processing your request.";
    }
    default:
      return "A database error occurred. Please try again.";
  }
}

/**
 * Get HTTP status code for Prisma error
 */
function getPrismaStatusCode(error: any): number {
  const { code } = error;

  switch (code) {
    case "P2002": // Unique constraint violation
      return 409; // Conflict
    case "P2003": // Foreign key constraint violation
      return 400; // Bad Request
    case "P2025": // Record not found
      return 404; // Not Found
    case "P2000": // Value too long
    case "P2001": // Record does not exist
    case "P2014": // Required relation violation
    case "P2015": // Related record not found
    case "P2016": // Query interpretation error
    case "P2017": // Records for relation not connected
    case "P2018": // Required connected records not found
    case "P2019": // Input error
    case "P2020": // Value out of range
      return 400; // Bad Request
    case "P2021": // Table does not exist
    case "P2022": // Column does not exist
    case "P2023": // Inconsistent column data
      return 500; // Internal Server Error
    case "P2024": // Connection timeout
      return 503; // Service Unavailable
    case "P2026": // Unsupported feature
      return 501; // Not Implemented
    case "P2027": // Multiple errors
      return 400; // Bad Request
    default:
      return 500; // Internal Server Error
  }
}

/**
 * Centralized error handling middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging
  console.error("Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  // Handle Prisma known request errors (P2002, P2003, etc.)
  if (err && typeof err === "object" && "code" in err && typeof err.code === "string" && err.code.startsWith("P")) {
    const prismaError = err as any;
    const statusCode = getPrismaStatusCode(prismaError);
    const message = getPrismaErrorMessage(prismaError);

    res.status(statusCode).json({
      success: false,
      message,
      error: {
        code: prismaError.code,
        meta: process.env.NODE_ENV === "development" ? prismaError.meta : undefined,
      },
    });
    return;
  }

  // Handle Prisma validation errors
  if (err && typeof err === "object" && err.constructor && err.constructor.name === "PrismaClientValidationError") {
    res.status(400).json({
      success: false,
      message: "Invalid input provided. Please check your request data.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
    return;
  }

  // Handle Prisma client initialization errors
  if (err && typeof err === "object" && err.constructor && err.constructor.name === "PrismaClientInitializationError") {
    res.status(503).json({
      success: false,
      message: "Database connection error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
    return;
  }

  // Handle Prisma client unknown request errors
  if (err && typeof err === "object" && err.constructor && err.constructor.name === "PrismaClientUnknownRequestError") {
    res.status(500).json({
      success: false,
      message: "An unexpected database error occurred. Please try again.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Handle generic errors
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "development" 
      ? err.message 
      : "An unexpected error occurred. Please try again.",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}

/**
 * Async error wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

