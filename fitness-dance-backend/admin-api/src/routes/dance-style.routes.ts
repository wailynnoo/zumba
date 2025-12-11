// admin-api/src/routes/dance-style.routes.ts
// Dance Style routes for Admin API

import { Router } from "express";
import { danceStyleController } from "../controllers/dance-style.controller";
import { authenticate, requirePermission } from "../middleware/auth.middleware";

const router = Router();

// All dance style routes require authentication
router.use(authenticate);

// Get all dance styles - requires 'read' permission
router.get(
  "/",
  requirePermission("videos", "read"), // Using videos permission since dance styles are used in videos
  danceStyleController.getDanceStyles.bind(danceStyleController)
);

// Get dance style by ID - requires 'read' permission
router.get(
  "/:id",
  requirePermission("videos", "read"),
  danceStyleController.getDanceStyleById.bind(danceStyleController)
);

export default router;

