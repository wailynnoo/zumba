// member-api/src/routes/category.routes.ts
// Category routes for Member API - Read-only

import { Router } from "express";
import { categoryController } from "../controllers/category.controller";

const router = Router();

// Public read-only routes (no authentication required)
router.get("/", categoryController.getCategories.bind(categoryController));
router.get("/slug/:slug", categoryController.getCategoryBySlug.bind(categoryController));
router.get("/:id", categoryController.getCategoryById.bind(categoryController));

export default router;

