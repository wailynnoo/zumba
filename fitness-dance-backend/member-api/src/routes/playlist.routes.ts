// member-api/src/routes/playlist.routes.ts
// Playlist routes for Member API - Requires authentication

import { Router } from "express";
import { playlistController } from "../controllers/playlist.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All playlist routes require authentication
router.use(authenticate);

// Get all playlists
router.get("/", playlistController.getPlaylists.bind(playlistController));

// Get playlist count
router.get("/count", playlistController.getPlaylistsCount.bind(playlistController));

// Get playlist by ID
router.get("/:id", playlistController.getPlaylistById.bind(playlistController));

// Create playlist
router.post("/", playlistController.createPlaylist.bind(playlistController));

// Update playlist
router.put("/:id", playlistController.updatePlaylist.bind(playlistController));

// Delete playlist
router.delete("/:id", playlistController.deletePlaylist.bind(playlistController));

// Add video to playlist
router.post("/:id/videos", playlistController.addVideoToPlaylist.bind(playlistController));

// Remove video from playlist
router.delete("/:id/videos/:videoId", playlistController.removeVideoFromPlaylist.bind(playlistController));

// Reorder videos in playlist
router.post("/:id/reorder", playlistController.reorderVideos.bind(playlistController));

export default router;

