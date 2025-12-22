// member-api/src/app.ts
// Express application setup for Member API

import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  securityHeaders,
  apiLimiter,
  bodySizeLimit,
} from "./middleware/security.middleware";
import { t, SupportedLanguage } from "./i18n";

// Load environment variables
dotenv.config();

const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxy/load balancer)
// Set to 1 if behind a single proxy, or number of proxies in chain
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

// Security middleware - Apply first
app.use(securityHeaders);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://localhost:3001"];

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

// Language detection middleware (must be before routes)
import { languageMiddleware } from "./i18n/middleware";
app.use(languageMiddleware);

// Apply general rate limiting to all routes
app.use(apiLimiter);

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Member API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import videoRoutes from "./routes/video.routes";
import collectionRoutes from "./routes/collection.routes";
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/collections", collectionRoutes);

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Fitness Dance App - Member API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      categories: "/api/categories",
      videos: "/api/videos",
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  const lang: SupportedLanguage = (req as any).language || 'en';
  res.status(404).json({
    error: "Not Found",
    message: t('errors.routeNotFound', lang),
  });
});

// Error handling middleware (must be last)
import { errorHandler } from "./middleware/error.middleware";
app.use(errorHandler);

export default app;

