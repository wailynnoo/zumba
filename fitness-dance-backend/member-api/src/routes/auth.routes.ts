// member-api/src/routes/auth.routes.ts
// Authentication routes for Member API

import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/security.middleware";

const router = Router();

// Public routes with strict rate limiting for authentication endpoints
router.post("/register", authLimiter, (req, res) => authController.register(req, res));
router.post("/login", authLimiter, (req, res) => authController.login(req, res));
router.post("/refresh", authLimiter, (req, res) => authController.refreshToken(req, res));
router.post("/logout", authLimiter, (req, res) => authController.logout(req, res));
router.post("/verify/email", authLimiter, (req, res) => authController.verifyEmail(req, res));
router.post("/verify/phone", authLimiter, (req, res) => authController.verifyPhone(req, res));

// Protected routes
router.post("/logout-all", authenticate, (req, res) => authController.logoutAll(req, res));

export default router;

