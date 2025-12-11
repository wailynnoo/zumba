// admin-api/src/services/dance-style.service.ts
// Dance Style service for Admin API

import prisma from "../config/database";

export class DanceStyleService {
  /**
   * Get all dance styles
   */
  async getDanceStyles(params?: { isActive?: boolean }) {
    const where: any = {};
    
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const danceStyles = await prisma.danceStyle.findMany({
      where,
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return danceStyles;
  }

  /**
   * Get dance style by ID
   */
  async getDanceStyleById(id: string) {
    const danceStyle = await prisma.danceStyle.findFirst({
      where: { id },
    });

    if (!danceStyle) {
      throw new Error("Dance style not found");
    }

    return danceStyle;
  }
}

export const danceStyleService = new DanceStyleService();

