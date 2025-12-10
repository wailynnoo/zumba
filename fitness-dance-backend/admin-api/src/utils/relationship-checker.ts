// admin-api/src/utils/relationship-checker.ts
// Utility to check relationships before soft-delete operations

import prisma from "../config/database";

// Type for Prisma transaction client - extracted from transaction callback parameter
type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

/**
 * Relationship definition for a model
 */
export interface RelationshipConfig {
  model: string;
  field: string;
  countField?: string; // Field name in _count result
  message: string;
  cascade?: boolean; // Whether to cascade delete
}

/**
 * Get all relationships for VideoCategory
 * This is extensible - add new relationships here as they're added to the schema
 */
export function getVideoCategoryRelationships(): RelationshipConfig[] {
  return [
    {
      model: "Video",
      field: "categoryId",
      countField: "videos",
      message: "videos",
      cascade: false, // Don't cascade - require manual removal
    },
    {
      model: "VideoSubcategory",
      field: "categoryId",
      countField: "subcategories",
      message: "subcategories",
      cascade: false,
    },
    {
      model: "VideoCollection",
      field: "categoryId",
      countField: "collections",
      message: "collections",
      cascade: false,
    },
    // Future relationships can be added here:
    // {
    //   model: "Playlist",
    //   field: "categoryId",
    //   message: "playlists",
    //   cascade: false,
    // },
  ];
}

/**
 * Check relationships for a category through videos (indirect relationships)
 * These are relationships that exist on Video model, not directly on VideoCategory
 */
export async function checkIndirectCategoryRelationships(
  categoryId: string,
  tx?: PrismaTransactionClient
): Promise<{
  hasRelationships: boolean;
  relationships: Array<{ name: string; count: number }>;
}> {
  const client = tx || prisma;
  
  // Get all videos in this category
  const videoCount = await client.video.count({
    where: {
      categoryId,
      deletedAt: null,
    },
  });

  if (videoCount === 0) {
    return { hasRelationships: false, relationships: [] };
  }

  // Check indirect relationships through videos
  const relationships: Array<{ name: string; count: number }> = [];

  // Check indirect relationships through videos
  // Use try-catch for each model in case they don't exist in Prisma client yet
  
  // Check indirect relationships through videos
  // Use try-catch for each model in case they don't exist in Prisma client yet
  // These are optional checks for future features - fail gracefully if models don't exist
  
  const clientAny = client as any;
  
  // Helper to safely check a model relationship
  const checkModelRelationship = async (
    modelName: string,
    displayName: string
  ): Promise<void> => {
    try {
      // Check if model exists in Prisma client
      if (!(modelName in clientAny)) {
        return; // Model doesn't exist - skip silently
      }
      
      const model = clientAny[modelName];
      if (!model || typeof model.count !== 'function') {
        return; // Model exists but count method not available
      }
      
      const count = await model.count({
        where: {
          video: {
            categoryId,
            deletedAt: null,
          },
        },
      });
      
      if (count > 0) {
        relationships.push({ name: displayName, count });
      }
    } catch (error: any) {
      // Silently skip - model might not exist or query might fail
      // These are optional checks for future features
    }
  };
  
  // Check all indirect relationships
  await Promise.all([
    checkModelRelationship('playlistItem', 'playlist items'),
    checkModelRelationship('favorite', 'favorites'),
    checkModelRelationship('watchHistory', 'watch history entries'),
    checkModelRelationship('rating', 'ratings'),
    checkModelRelationship('feedback', 'feedback entries'),
  ]);

  return {
    hasRelationships: relationships.length > 0,
    relationships,
  };
}

/**
 * Check all relationships for a category (direct and indirect)
 */
export async function checkCategoryRelationships(
  categoryId: string,
  tx?: PrismaTransactionClient
): Promise<{
  hasBlockingRelationships: boolean;
  directRelationships: Array<{ name: string; count: number }>;
  indirectRelationships: Array<{ name: string; count: number }>;
  errorMessage?: string;
}> {
  const client = tx || prisma;
  
  // Check direct relationships using Prisma _count
  const category = await client.videoCategory.findFirst({
    where: {
      id: categoryId,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          videos: true,
          subcategories: true,
          collections: true,
        },
      },
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const directRelationships: Array<{ name: string; count: number }> = [];
  
  if (category._count.videos > 0) {
    directRelationships.push({ name: "videos", count: category._count.videos });
  }
  if (category._count.subcategories > 0) {
    directRelationships.push({ name: "subcategories", count: category._count.subcategories });
  }
  if (category._count.collections > 0) {
    directRelationships.push({ name: "collections", count: category._count.collections });
  }

  // Check indirect relationships
  const indirect = await checkIndirectCategoryRelationships(categoryId, tx);

  const allRelationships = [...directRelationships, ...indirect.relationships];
  const hasBlockingRelationships = allRelationships.length > 0;

  let errorMessage: string | undefined;
  if (hasBlockingRelationships) {
    const relationshipList = allRelationships
      .map((rel) => `${rel.count} ${rel.name}`)
      .join(", ");
    errorMessage = `Cannot delete category with associated data: ${relationshipList}. Please remove them first or deactivate the category instead.`;
  }

  return {
    hasBlockingRelationships,
    directRelationships,
    indirectRelationships: indirect.relationships,
    errorMessage,
  };
}

/**
 * Generic function to check relationships for any model
 * Can be extended for other models in the future
 */
export async function checkModelRelationships(
  _modelName: string,
  recordId: string,
  relationships: RelationshipConfig[]
): Promise<{
  hasBlockingRelationships: boolean;
  relationships: Array<{ name: string; count: number; cascade: boolean }>;
  errorMessage?: string;
}> {
  const foundRelationships: Array<{ name: string; count: number; cascade: boolean }> = [];

  for (const rel of relationships) {
    try {
      // Use Prisma client dynamically
      const model = (prisma as any)[rel.model.toLowerCase()];
      if (!model) continue;

      const count = await model.count({
        where: {
          [rel.field]: recordId,
          deletedAt: null,
        },
      });

      if (count > 0) {
        foundRelationships.push({
          name: rel.message,
          count,
          cascade: rel.cascade || false,
        });
      }
    } catch (error) {
      // Skip if model doesn't exist or field doesn't exist
      console.warn(`Could not check relationship ${rel.model}.${rel.field}:`, error);
    }
  }

  const hasBlockingRelationships = foundRelationships.some((rel) => !rel.cascade);

  let errorMessage: string | undefined;
  if (hasBlockingRelationships) {
    const blockingRelationships = foundRelationships
      .filter((rel) => !rel.cascade)
      .map((rel) => `${rel.count} ${rel.name}`)
      .join(", ");
    errorMessage = `Cannot delete record with associated data: ${blockingRelationships}. Please remove them first.`;
  }

  return {
    hasBlockingRelationships,
    relationships: foundRelationships,
    errorMessage,
  };
}

