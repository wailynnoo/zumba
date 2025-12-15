// lib/services/categoryService.ts
// Category service for API calls

import api from "../api";

export interface Category {
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

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface CategoryListResponse {
  success: boolean;
  data: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const categoryService = {
  /**
   * Get all categories with pagination and filters
   */
  async getCategories(params?: CategoryListParams): Promise<CategoryListResponse> {
    const response = await api.get<CategoryListResponse>("/api/categories", { params });
    return response.data;
  },

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category> {
    const response = await api.get<{ success: boolean; data: Category }>(`/api/categories/${id}`);
    return response.data.data;
  },

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    const response = await api.get<{ success: boolean; data: Category }>(`/api/categories/slug/${slug}`);
    return response.data.data;
  },

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryData): Promise<Category> {
    const response = await api.post<{ success: boolean; data: Category }>("/api/categories", data);
    return response.data.data;
  },

  /**
   * Update category
   */
  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    const response = await api.put<{ success: boolean; data: Category }>(`/api/categories/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/api/categories/${id}`);
  },

  /**
   * Toggle category status
   */
  async toggleCategoryStatus(id: string): Promise<Category> {
    const response = await api.patch<{ success: boolean; data: Category }>(`/api/categories/${id}/toggle-status`);
    return response.data.data;
  },

  /**
   * Upload category image
   */
  async uploadCategoryImage(id: string, imageFile: File): Promise<{ imageUrl: string; category: Category }> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await api.post<{
      success: boolean;
      data: { imageUrl: string; category: Category };
    }>(`/api/categories/${id}/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  },

  /**
   * Delete category image
   */
  async deleteCategoryImage(id: string): Promise<Category> {
    const response = await api.delete<{ success: boolean; data: Category }>(`/api/categories/${id}/image`);
    return response.data.data;
  },

  /**
   * Get category image signed URL
   */
  async getCategoryImageUrl(id: string): Promise<string> {
    const response = await api.get<{ success: boolean; data: { imageUrl: string; expiresIn: number } }>(
      `/api/categories/${id}/image-url`
    );
    return response.data.data.imageUrl;
  },
};

export default categoryService;

