// admin-web/lib/services/analyticsService.ts
// Analytics service for dashboard statistics

import api from "../api";

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    newLastMonth: number;
    growthPercentage: number;
  };
  videos: {
    total: number;
    published: number;
    draft: number;
    totalViews: number;
    averageViews: number;
  };
  categories: {
    total: number;
    active: number;
  };
  collections: {
    total: number;
    active: number;
    featured: number;
  };
  subscriptions: {
    total: number;
    active: number;
    expired: number;
    cancelled: number;
    trial: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growthPercentage: number;
  };
}

export interface RecentActivity {
  id: string;
  type: "video" | "category" | "collection" | "user" | "subscription";
  action: "created" | "updated" | "deleted";
  title: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

export interface RecentActivityResponse {
  success: boolean;
  data: RecentActivity[];
}

const analyticsService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStatsResponse>("/api/analytics/dashboard");
    return response.data.data;
  },

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit?: number): Promise<RecentActivity[]> {
    const response = await api.get<RecentActivityResponse>("/api/analytics/activity", {
      params: { limit },
    });
    return response.data.data;
  },
};

export default analyticsService;

