// member-api/src/routes/collection.routes.ts
// Collection routes for Member API - Read-only

import { Router } from "express";
import { collectionController } from "../controllers/collection.controller";

const router = Router();

// Public read-only routes (no authentication required)
router.get("/", collectionController.getCollections.bind(collectionController));
router.get("/slug/:slug", collectionController.getCollectionBySlug.bind(collectionController));
router.get("/:id", collectionController.getCollectionById.bind(collectionController));

export default router;

