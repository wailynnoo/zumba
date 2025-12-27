// lib/services/settingsService.ts
// Settings service for API calls

import api from "../api";

export interface SystemSetting {
  id: string;
  key: string;
  value: string | null;
  type: "string" | "number" | "boolean" | "json";
  category: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingData {
  key: string;
  value?: string;
  type?: "string" | "number" | "boolean" | "json";
  category?: string;
  description?: string;
}

export interface UpdateSettingData {
  value?: string;
  type?: "string" | "number" | "boolean" | "json";
  category?: string;
  description?: string;
}

const settingsService = {
  /**
   * Get all settings
   */
  async getSettings(category?: string): Promise<SystemSetting[]> {
    const response = await api.get<{ success: boolean; data: SystemSetting[] }>("/api/settings", {
      params: category ? { category } : undefined,
    });
    return response.data.data;
  },

  /**
   * Get setting by key
   */
  async getSettingByKey(key: string): Promise<SystemSetting> {
    const response = await api.get<{ success: boolean; data: SystemSetting }>(`/api/settings/${key}`);
    return response.data.data;
  },

  /**
   * Get setting value (parsed)
   */
  async getSettingValue(key: string): Promise<any> {
    const response = await api.get<{ success: boolean; data: { key: string; value: any } }>(
      `/api/settings/${key}/value`
    );
    return response.data.data.value;
  },

  /**
   * Create a new setting
   */
  async createSetting(data: CreateSettingData): Promise<SystemSetting> {
    const response = await api.post<{ success: boolean; data: SystemSetting }>("/api/settings", data);
    return response.data.data;
  },

  /**
   * Update setting
   */
  async updateSetting(key: string, data: UpdateSettingData): Promise<SystemSetting> {
    const response = await api.put<{ success: boolean; data: SystemSetting }>(`/api/settings/${key}`, data);
    return response.data.data;
  },

  /**
   * Delete setting
   */
  async deleteSetting(key: string): Promise<void> {
    await api.delete(`/api/settings/${key}`);
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const response = await api.get<{ success: boolean; data: string[] }>("/api/settings/categories");
    return response.data.data;
  },
};

export default settingsService;

