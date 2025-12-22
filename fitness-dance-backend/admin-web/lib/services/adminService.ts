// lib/services/adminService.ts
// Admin service for API calls

import api from "../api";

export interface AdminRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
}

export interface Admin {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  adminRoleId: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  adminRole: AdminRole;
  createdBy?: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
}

export interface CreateAdminData {
  email: string;
  password: string;
  displayName?: string;
  avatarUrl?: string;
  adminRoleId: string;
  isActive?: boolean;
}

export interface UpdateAdminData {
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  adminRoleId?: string;
  isActive?: boolean;
}

export interface AdminListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  adminRoleId?: string;
  search?: string;
}

export interface AdminListResponse {
  success: boolean;
  data: Admin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordData {
  newPassword: string;
}

const adminService = {
  /**
   * Get all admins with pagination and filters
   */
  async getAdmins(params?: AdminListParams): Promise<AdminListResponse> {
    const response = await api.get<AdminListResponse>("/api/admins", { params });
    return response.data;
  },

  /**
   * Get admin by ID
   */
  async getAdminById(id: string): Promise<Admin> {
    const response = await api.get<{ success: boolean; data: Admin }>(`/api/admins/${id}`);
    return response.data.data;
  },

  /**
   * Create a new admin
   */
  async createAdmin(data: CreateAdminData): Promise<Admin> {
    const response = await api.post<{ success: boolean; data: Admin }>("/api/admins", data);
    return response.data.data;
  },

  /**
   * Update admin
   */
  async updateAdmin(id: string, data: UpdateAdminData): Promise<Admin> {
    const response = await api.put<{ success: boolean; data: Admin }>(`/api/admins/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete admin
   */
  async deleteAdmin(id: string): Promise<void> {
    await api.delete(`/api/admins/${id}`);
  },

  /**
   * Toggle admin status
   */
  async toggleAdminStatus(id: string): Promise<Admin> {
    const response = await api.patch<{ success: boolean; data: Admin }>(`/api/admins/${id}/toggle-status`);
    return response.data.data;
  },

  /**
   * Change password (own account)
   */
  async changePassword(id: string, data: ChangePasswordData): Promise<void> {
    await api.patch(`/api/admins/${id}/change-password`, data);
  },

  /**
   * Reset password (admin-initiated)
   */
  async resetPassword(id: string, data: ResetPasswordData): Promise<void> {
    await api.patch(`/api/admins/${id}/reset-password`, data);
  },

  /**
   * Get all admin roles
   */
  async getAdminRoles(): Promise<AdminRole[]> {
    try {
      const response = await api.get<{ success: boolean; data: AdminRole[] }>("/api/admins/roles");
      return response.data.data;
    } catch (error: any) {
      console.error("[adminService.getAdminRoles] Error:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
      throw error;
    }
  },

  /**
   * Upload admin avatar
   */
  async uploadAdminAvatar(id: string, file: File): Promise<{ avatarUrl: string; admin: Admin }> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post<{ success: boolean; data: { avatarUrl: string; admin: Admin } }>(
      `/api/admins/${id}/avatar`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  /**
   * Delete admin avatar
   */
  async deleteAdminAvatar(id: string): Promise<Admin> {
    const response = await api.delete<{ success: boolean; data: Admin }>(`/api/admins/${id}/avatar`);
    return response.data.data;
  },
};

export default adminService;

