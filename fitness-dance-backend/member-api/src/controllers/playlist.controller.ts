// member-api/src/controllers/playlist.controller.ts
// Playlist controller for Member API

import { Response } from "express";
import { playlistService } from "../services/playlist.service";
import { AuthRequest } from "../middleware/auth.middleware";

export class PlaylistController {
  /**
   * Get all playlists for authenticated user
   * GET /api/user/playlists
   */
  async getPlaylists(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const playlists = await playlistService.getPlaylists(userId);

      res.status(200).json({
        success: true,
        data: playlists,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch playlists",
      });
    }
  }

  /**
   * Get playlist count
   * GET /api/user/playlists/count
   */
  async getPlaylistsCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const count = await playlistService.getPlaylistCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch playlist count",
      });
    }
  }

  /**
   * Get playlist by ID with videos
   * GET /api/user/playlists/:id
   */
  async getPlaylistById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const playlist = await playlistService.getPlaylistById(id, userId);

      if (!playlist) {
        res.status(404).json({
          success: false,
          message: "Playlist not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: playlist,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch playlist",
      });
    }
  }

  /**
   * Create a new playlist
   * POST /api/user/playlists
   */
  async createPlaylist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { name, description } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: "Playlist name is required",
        });
        return;
      }

      const playlist = await playlistService.createPlaylist(
        userId,
        name.trim(),
        description?.trim()
      );

      res.status(201).json({
        success: true,
        data: playlist,
        message: "Playlist created successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create playlist",
      });
    }
  }

  /**
   * Update playlist
   * PUT /api/user/playlists/:id
   */
  async updatePlaylist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { name, description } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
        res.status(400).json({
          success: false,
          message: "Playlist name cannot be empty",
        });
        return;
      }

      const playlist = await playlistService.updatePlaylist(
        id,
        userId,
        name?.trim(),
        description?.trim()
      );

      if (!playlist) {
        res.status(404).json({
          success: false,
          message: "Playlist not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: playlist,
        message: "Playlist updated successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update playlist",
      });
    }
  }

  /**
   * Delete playlist
   * DELETE /api/user/playlists/:id
   */
  async deletePlaylist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const deleted = await playlistService.deletePlaylist(id, userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Playlist not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Playlist deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete playlist",
      });
    }
  }

  /**
   * Add video to playlist
   * POST /api/user/playlists/:id/videos
   */
  async addVideoToPlaylist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id: playlistId } = req.params;
      const { videoId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!videoId || typeof videoId !== "string") {
        res.status(400).json({
          success: false,
          message: "Video ID is required",
        });
        return;
      }

      const added = await playlistService.addVideoToPlaylist(playlistId, videoId, userId);

      if (!added) {
        res.status(404).json({
          success: false,
          message: "Playlist or video not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Video added to playlist successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to add video to playlist",
      });
    }
  }

  /**
   * Remove video from playlist
   * DELETE /api/user/playlists/:id/videos/:videoId
   */
  async removeVideoFromPlaylist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id: playlistId, videoId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const removed = await playlistService.removeVideoFromPlaylist(playlistId, videoId, userId);

      if (!removed) {
        res.status(404).json({
          success: false,
          message: "Playlist not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Video removed from playlist successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to remove video from playlist",
      });
    }
  }

  /**
   * Reorder videos in playlist
   * POST /api/user/playlists/:id/reorder
   */
  async reorderVideos(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id: playlistId } = req.params;
      const { videoIds } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        res.status(400).json({
          success: false,
          message: "Video IDs array is required",
        });
        return;
      }

      const reordered = await playlistService.reorderVideos(playlistId, videoIds, userId);

      if (!reordered) {
        res.status(404).json({
          success: false,
          message: "Playlist not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Videos reordered successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to reorder videos",
      });
    }
  }
}

export const playlistController = new PlaylistController();

