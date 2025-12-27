// admin-api/src/routes/user.routes.ts
// User routes for Admin API

import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate, requirePermission } from "../middleware/auth.middleware";

const router = Router();

// All user routes require authentication
router.use(authenticate);

// User CRUD routes with RBAC
router.get(
  "/",
  requirePermission("users", "read"),
  userController.getUsers.bind(userController)
);

router.get(
  "/stats",
  requirePermission("users", "read"),
  userController.getUserStats.bind(userController)
);

router.get(
  "/:id",
  requirePermission("users", "read"),
  userController.getUserById.bind(userController)
);

router.put(
  "/:id",
  requirePermission("users", "update"),
  userController.updateUser.bind(userController)
);

router.patch(
  "/:id/toggle-status",
  requirePermission("users", "update"),
  userController.toggleUserStatus.bind(userController)
);

export default router;

