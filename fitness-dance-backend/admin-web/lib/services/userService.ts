// lib/services/userService.ts
// User service for API calls

import api from "../api";

export interface User {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  weight: number | null;
  preferredLang: string;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  isPhoneVerified: boolean;
  phoneVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  preferences: any;
  _count?: {
    subscriptions: number;
    payments: number;
    playlists: number;
    favorites: number;
    watchHistory: number;
  };
  subscriptions?: Array<{
    id: string;
    status: string;
    subscriptionPlan: {
      id: string;
      name: string;
      priceMmk: number;
      durationMonths: number;
    };
  }>;
}

export interface UpdateUserData {
  displayName?: string;
  isActive?: boolean;
  preferredLang?: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface UserListResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  usersWithSubscriptions: number;
}

const userService = {
  /**
   * Get all users with pagination and filters
   */
  async getUsers(params?: UserListParams): Promise<UserListResponse> {
    const response = await api.get<UserListResponse>("/api/users", { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>(`/api/users/${id}`);
    return response.data.data;
  },

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>(`/api/users/${id}`, data);
    return response.data.data;
  },

  /**
   * Toggle user active status
   */
  async toggleUserStatus(id: string): Promise<User> {
    const response = await api.patch<{ success: boolean; data: User }>(`/api/users/${id}/toggle-status`);
    return response.data.data;
  },

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    const response = await api.get<{ success: boolean; data: UserStats }>("/api/users/stats");
    return response.data.data;
  },
};

export default userService;

