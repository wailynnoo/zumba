// lib/services/danceStyleService.ts
// Dance Style service for API calls

import api from "../api";

export interface DanceStyle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const danceStyleService = {
  /**
   * Get all dance styles
   */
  async getDanceStyles(isActive?: boolean): Promise<DanceStyle[]> {
    const params = isActive !== undefined ? { isActive: String(isActive) } : {};
    const response = await api.get<{ success: boolean; data: DanceStyle[] }>("/api/dance-styles", { params });
    return response.data.data;
  },

  /**
   * Get dance style by ID
   */
  async getDanceStyleById(id: string): Promise<DanceStyle> {
    const response = await api.get<{ success: boolean; data: DanceStyle }>(`/api/dance-styles/${id}`);
    return response.data.data;
  },
};

export default danceStyleService;

