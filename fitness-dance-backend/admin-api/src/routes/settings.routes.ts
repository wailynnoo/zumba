// admin-api/src/routes/settings.routes.ts
// Settings routes for Admin API

import { Router } from "express";
import { settingsController } from "../controllers/settings.controller";
import { authenticate, requirePermission } from "../middleware/auth.middleware";

const router = Router();

// All settings routes require authentication
router.use(authenticate);

// Settings CRUD routes with RBAC (only super admin should have full access)
router.get(
  "/",
  requirePermission("settings", "read"),
  settingsController.getSettings.bind(settingsController)
);

router.get(
  "/categories",
  requirePermission("settings", "read"),
  settingsController.getCategories.bind(settingsController)
);

router.get(
  "/:key",
  requirePermission("settings", "read"),
  settingsController.getSettingByKey.bind(settingsController)
);

router.get(
  "/:key/value",
  requirePermission("settings", "read"),
  settingsController.getSettingValue.bind(settingsController)
);

router.post(
  "/",
  requirePermission("settings", "create"),
  settingsController.createSetting.bind(settingsController)
);

router.put(
  "/:key",
  requirePermission("settings", "update"),
  settingsController.updateSetting.bind(settingsController)
);

router.delete(
  "/:key",
  requirePermission("settings", "delete"),
  settingsController.deleteSetting.bind(settingsController)
);

export default router;

