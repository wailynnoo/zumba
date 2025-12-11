// admin-api/src/services/intensity-level.service.ts
// Intensity Level service for Admin API

import prisma from "../config/database";

export class IntensityLevelService {
  /**
   * Get all intensity levels
   */
  async getIntensityLevels() {
    const intensityLevels = await prisma.intensityLevel.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return intensityLevels;
  }

  /**
   * Get intensity level by ID
   */
  async getIntensityLevelById(id: string) {
    const intensityLevel = await prisma.intensityLevel.findFirst({
      where: { id },
    });

    if (!intensityLevel) {
      throw new Error("Intensity level not found");
    }

    return intensityLevel;
  }
}

export const intensityLevelService = new IntensityLevelService();

