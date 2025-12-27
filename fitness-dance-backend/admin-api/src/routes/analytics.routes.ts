// admin-api/src/routes/analytics.routes.ts
// Analytics routes for dashboard statistics

import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { authenticate, requirePermission } from "../middleware/auth.middleware";

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Dashboard statistics - requires 'read' permission on analytics
router.get(
  "/dashboard",
  requirePermission("analytics", "read"),
  analyticsController.getDashboardStats.bind(analyticsController)
);

// Recent activity feed - requires 'read' permission on analytics
router.get(
  "/activity",
  requirePermission("analytics", "read"),
  analyticsController.getRecentActivity.bind(analyticsController)
);

export default router;

