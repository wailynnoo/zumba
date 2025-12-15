// lib/services/collectionService.ts
// Collection service for API calls

import api from "../api";

export interface Collection {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    videos: number;
  };
}

export interface CreateCollectionData {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCollectionData {
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CollectionListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
}

export interface CollectionListResponse {
  success: boolean;
  data: Collection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const collectionService = {
  /**
   * Get all collections with pagination and filters
   */
  async getCollections(params?: CollectionListParams): Promise<CollectionListResponse> {
    const response = await api.get<CollectionListResponse>("/api/collections", { params });
    return response.data;
  },

  /**
   * Get collection by ID
   */
  async getCollectionById(id: string): Promise<Collection> {
    const response = await api.get<{ success: boolean; data: Collection }>(`/api/collections/${id}`);
    return response.data.data;
  },

  /**
   * Get collection by slug
   */
  async getCollectionBySlug(slug: string): Promise<Collection> {
    const response = await api.get<{ success: boolean; data: Collection }>(`/api/collections/slug/${slug}`);
    return response.data.data;
  },

  /**
   * Create a new collection
   */
  async createCollection(data: CreateCollectionData): Promise<Collection> {
    const response = await api.post<{ success: boolean; data: Collection }>("/api/collections", data);
    return response.data.data;
  },

  /**
   * Update collection
   */
  async updateCollection(id: string, data: UpdateCollectionData): Promise<Collection> {
    const response = await api.put<{ success: boolean; data: Collection }>(`/api/collections/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete collection
   */
  async deleteCollection(id: string): Promise<void> {
    await api.delete(`/api/collections/${id}`);
  },

  /**
   * Toggle collection active status
   */
  async toggleCollectionStatus(id: string): Promise<Collection> {
    const response = await api.patch<{ success: boolean; data: Collection }>(`/api/collections/${id}/toggle-status`);
    return response.data.data;
  },

  /**
   * Toggle collection featured status
   */
  async toggleFeaturedStatus(id: string): Promise<Collection> {
    const response = await api.patch<{ success: boolean; data: Collection }>(`/api/collections/${id}/toggle-featured`);
    return response.data.data;
  },

  /**
   * Get collection thumbnail signed URL
   */
  async getThumbnailUrl(collectionId: string): Promise<string> {
    try {
      const response = await api.get<{ success: boolean; data: { thumbnailUrl: string; expiresIn: number } }>(
        `/api/collections/${collectionId}/thumbnail-url`
      );
      return response.data.data.thumbnailUrl;
    } catch (error) {
      console.error("[Collection Service] Error fetching thumbnail URL:", error);
      throw error;
    }
  },

  /**
   * Upload collection thumbnail
   */
  async uploadCollectionThumbnail(id: string, imageFile: File): Promise<{ thumbnailUrl: string; collection: Collection }> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await api.post<{
      success: boolean;
      data: { thumbnailUrl: string; collection: Collection };
    }>(`/api/collections/${id}/thumbnail`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  },

  /**
   * Delete collection thumbnail
   */
  async deleteCollectionThumbnail(id: string): Promise<void> {
    await api.delete(`/api/collections/${id}/thumbnail`);
  },
};

export default collectionService;

