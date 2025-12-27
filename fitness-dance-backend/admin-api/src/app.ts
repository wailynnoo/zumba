// admin-api/src/app.ts
// Express application setup for Admin API

import express, { Application, Request, Response, NextFunction } from "express";
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
// Railway and most cloud platforms are behind a proxy, so default to true in production
// Set to 1 if behind a single proxy, or number of proxies in chain
app.set("trust proxy", env.TRUST_PROXY ? 1 : false);
console.log(`[App] Trust proxy: ${env.TRUST_PROXY ? "enabled" : "disabled"} (NODE_ENV: ${env.NODE_ENV})`);

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
    allowedHeaders: ["Content-Type", "Authorization", "Range"], // Range header for video streaming
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"], // Expose headers for video streaming
  })
);

// Body parsing with size limits
app.use(express.json({ limit: bodySizeLimit.json }));
app.use(express.urlencoded({ extended: true, limit: bodySizeLimit.urlencoded }));

// Log all incoming requests (for debugging)
app.use((req: Request, _res: Response, next: NextFunction) => {
  // Log ALL POST requests to help debug
  if (req.method === "POST") {
    console.log("[App] Incoming POST request:", {
      method: req.method,
      path: req.path,
      url: req.url,
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
      hasAuth: !!req.headers.authorization,
      userAgent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
    });
  }
  // Always log file upload requests (only POST/PUT/PATCH, not GET)
  if ((req.method === "POST" || req.method === "PUT" || req.method === "PATCH") &&
      (req.path.includes("/video") || req.path.includes("/thumbnail") || req.path.includes("/audio"))) {
    console.log("[App] ⚠️ FILE UPLOAD REQUEST DETECTED:", {
      method: req.method,
      path: req.path,
      url: req.url,
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
      hasAuth: !!req.headers.authorization,
      timestamp: new Date().toISOString(),
    });
  }
  next();
});

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
import collectionRoutes from "./routes/collection.routes";
import videoRoutes from "./routes/video.routes";
import videoStepRoutes from "./routes/video-step.routes";
import danceStyleRoutes from "./routes/dance-style.routes";
import intensityLevelRoutes from "./routes/intensity-level.routes";
import adminRoutes from "./routes/admin.routes";
import analyticsRoutes from "./routes/analytics.routes";
import userRoutes from "./routes/user.routes";
import settingsRoutes from "./routes/settings.routes";
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api", videoStepRoutes);
app.use("/api/dance-styles", danceStyleRoutes);
app.use("/api/intensity-levels", intensityLevelRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Fitness Dance App - Admin API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      categories: "/api/categories",
      collections: "/api/collections",
      videos: "/api/videos",
      danceStyles: "/api/dance-styles",
      intensityLevels: "/api/intensity-levels",
      admins: "/api/admins",
      analytics: "/api/analytics",
      users: "/api/users",
      settings: "/api/settings",
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

