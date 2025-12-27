// admin-api/src/services/settings.service.ts
// System Settings service for Admin API

import prisma from "../config/database";
import { z } from "zod";

// Validation schemas
export const updateSettingSchema = z.object({
  value: z.string().optional(),
  type: z.enum(["string", "number", "boolean", "json"]).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const createSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().optional(),
  type: z.enum(["string", "number", "boolean", "json"]).default("string"),
  category: z.string().optional(),
  description: z.string().optional(),
});

export class SettingsService {
  /**
   * Get all settings
   */
  async getSettings(category?: string) {
    const where: any = {};
    if (category) {
      where.category = category;
    }

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { key: "asc" },
      ],
    });

    return settings;
  }

  /**
   * Get setting by key
   */
  async getSettingByKey(key: string) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new Error("Setting not found");
    }

    return setting;
  }

  /**
   * Get setting value (parsed by type)
   */
  async getSettingValue(key: string) {
    const setting = await this.getSettingByKey(key);
    return this.parseValue(setting.value, setting.type);
  }

  /**
   * Create a new setting
   */
  async createSetting(data: z.infer<typeof createSettingSchema>) {
    // Check if key already exists
    const existing = await prisma.systemSetting.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      throw new Error("Setting with this key already exists");
    }

    const setting = await prisma.systemSetting.create({
      data: {
        key: data.key,
        value: data.value || null,
        type: data.type,
        category: data.category || null,
        description: data.description || null,
      },
    });

    return setting;
  }

  /**
   * Update setting
   */
  async updateSetting(key: string, data: z.infer<typeof updateSettingSchema>) {
    const existing = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new Error("Setting not found");
    }

    const setting = await prisma.systemSetting.update({
      where: { key },
      data: {
        ...(data.value !== undefined && { value: data.value || null }),
        ...(data.type && { type: data.type }),
        ...(data.category !== undefined && { category: data.category || null }),
        ...(data.description !== undefined && { description: data.description || null }),
      },
    });

    return setting;
  }

  /**
   * Delete setting
   */
  async deleteSetting(key: string) {
    const existing = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new Error("Setting not found");
    }

    await prisma.systemSetting.delete({
      where: { key },
    });

    return { success: true };
  }

  /**
   * Get all categories
   */
  async getCategories() {
    const categories = await prisma.systemSetting.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
      where: {
        category: { not: null },
      },
    });

    return categories.map((c) => c.category).filter(Boolean) as string[];
  }

  /**
   * Parse value based on type
   */
  private parseValue(value: string | null, type: string): any {
    if (value === null) return null;

    switch (type) {
      case "number":
        return Number(value);
      case "boolean":
        return value === "true" || value === "1";
      case "json":
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }
}

export const settingsService = new SettingsService();

