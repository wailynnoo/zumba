// member-api/src/services/category.service.ts
// Category service for Member API - Read-only operations

import prisma from "../config/database";

export class CategoryService {
  /**
   * Get all active categories
   */
  async getCategories(params?: {
    includeCounts?: boolean;
  }) {
    const categories = await prisma.videoCategory.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      include: params?.includeCounts
        ? {
            _count: {
              select: {
                videos: {
                  where: {
                    isPublished: true,
                    deletedAt: null,
                  },
                },
                subcategories: {
                  where: {
                    isActive: true,
                    deletedAt: null,
                  },
                },
                collections: {
                  where: {
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            },
          }
        : undefined,
    });

    return categories;
  }

  /**
   * Get category by ID (only active)
   */
  async getCategoryById(id: string) {
    const category = await prisma.videoCategory.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            videos: {
              where: {
                isPublished: true,
                deletedAt: null,
              },
            },
            subcategories: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
            collections: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  }

  /**
   * Get category by slug (only active)
   */
  async getCategoryBySlug(slug: string) {
    const category = await prisma.videoCategory.findFirst({
      where: {
        slug,
        isActive: true,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            videos: {
              where: {
                isPublished: true,
                deletedAt: null,
              },
            },
            subcategories: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
            collections: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  }
}

export const categoryService = new CategoryService();

