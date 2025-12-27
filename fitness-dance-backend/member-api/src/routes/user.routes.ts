// member-api/src/routes/user.routes.ts
// User profile routes for Member API

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { userController } from "../controllers/user.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get("/profile", userController.getProfile.bind(userController));

// Update user profile
router.patch("/profile", userController.updateProfile.bind(userController));

export default router;

