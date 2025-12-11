// admin-api/src/app.ts
// Express application setup for Admin API

import express, { Application, Request, Response } from "express";
import cors from "cors";
import {
  securityHeaders,
  apiLimiter,
  bodySizeLimit,
} from "./middleware/security.middleware";

// Validate environment variables at startup
import "./config/env";
import { env } from "./config/env";

const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxy/load balancer)
// Set to 1 if behind a single proxy, or number of proxies in chain
app.set("trust proxy", env.TRUST_PROXY ? 1 : false);

// Security middleware - Apply first
app.use(securityHeaders);

// CORS configuration (using validated env)
const allowedOrigins = env.CORS_ORIGIN;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing with size limits
app.use(express.json({ limit: bodySizeLimit.json }));
app.use(express.urlencoded({ extended: true, limit: bodySizeLimit.urlencoded }));

// Apply general rate limiting to all routes
app.use(apiLimiter);

// Serve static files (uploaded images)
import path from "path";
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Admin API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Fitness Dance App - Admin API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      categories: "/api/categories",
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware (must be last)
import { errorHandler } from "./middleware/error.middleware";
app.use(errorHandler);

export default app;

