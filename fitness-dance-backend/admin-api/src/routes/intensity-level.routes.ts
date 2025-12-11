// admin-api/src/routes/intensity-level.routes.ts
// Intensity Level routes for Admin API

import { Router } from "express";
import { intensityLevelController } from "../controllers/intensity-level.controller";
import { authenticate, requirePermission } from "../middleware/auth.middleware";

const router = Router();

// All intensity level routes require authentication
router.use(authenticate);

// Get all intensity levels - requires 'read' permission
router.get(
  "/",
  requirePermission("videos", "read"), // Using videos permission since intensity levels are used in videos
  intensityLevelController.getIntensityLevels.bind(intensityLevelController)
);

// Get intensity level by ID - requires 'read' permission
router.get(
  "/:id",
  requirePermission("videos", "read"),
  intensityLevelController.getIntensityLevelById.bind(intensityLevelController)
);

export default router;

