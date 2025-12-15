// lib/services/intensityLevelService.ts
// Intensity Level service for API calls

import api from "../api";

export interface IntensityLevel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const intensityLevelService = {
  /**
   * Get all intensity levels
   */
  async getIntensityLevels(): Promise<IntensityLevel[]> {
    const response = await api.get<{ success: boolean; data: IntensityLevel[] }>("/api/intensity-levels");
    return response.data.data;
  },

  /**
   * Get intensity level by ID
   */
  async getIntensityLevelById(id: string): Promise<IntensityLevel> {
    const response = await api.get<{ success: boolean; data: IntensityLevel }>(`/api/intensity-levels/${id}`);
    return response.data.data;
  },
};

export default intensityLevelService;

