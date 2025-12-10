// admin-api/src/routes/auth.routes.ts
// Authentication routes for Admin API

import { Router } from "express";
import { adminAuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/security.middleware";

const router = Router();

// Public routes with strict rate limiting for authentication endpoints
router.post("/login", authLimiter, (req, res) => adminAuthController.login(req, res));
router.post("/refresh", authLimiter, (req, res) => adminAuthController.refreshToken(req, res));
router.post("/logout", authLimiter, (req, res) => adminAuthController.logout(req, res));

// Protected routes
router.post("/logout-all", authenticate, (req, res) => adminAuthController.logoutAll(req, res));

export default router;

