// admin-api/src/types/express.d.ts
// TypeScript declarations to extend Express Request type

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: Record<string, any>;
      validatedParams?: Record<string, any>;
    }
  }
}

export {};

