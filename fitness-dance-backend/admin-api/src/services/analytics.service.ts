// admin-api/src/services/analytics.service.ts
// Analytics service for dashboard statistics

import prisma from "../config/database";

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
  timestamp: Date;
  userId?: string;
  userName?: string;
}

export class AnalyticsService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Users statistics
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      newUsersLastMonth,
    ] = await Promise.all([
      prisma.user.count({
        where: { deletedAt: null },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          isActive: true,
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),
    ]);

    const userGrowthPercentage =
      newUsersLastMonth > 0
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
        : newUsersThisMonth > 0
        ? 100
        : 0;

    // Videos statistics
    const [
      totalVideos,
      publishedVideos,
      draftVideos,
      videosWithViews,
    ] = await Promise.all([
      prisma.video.count({
        where: { deletedAt: null },
      }),
      prisma.video.count({
        where: {
          deletedAt: null,
          isPublished: true,
        },
      }),
      prisma.video.count({
        where: {
          deletedAt: null,
          isPublished: false,
        },
      }),
      prisma.video.aggregate({
        where: { deletedAt: null },
        _sum: { viewCount: true },
        _count: { id: true },
      }),
    ]);

    const totalViews = videosWithViews._sum.viewCount || 0;
    const averageViews =
      videosWithViews._count.id > 0
        ? Math.round(totalViews / videosWithViews._count.id)
        : 0;

    // Categories statistics
    const [totalCategories, activeCategories] = await Promise.all([
      prisma.videoCategory.count({
        where: { deletedAt: null },
      }),
      prisma.videoCategory.count({
        where: {
          deletedAt: null,
          isActive: true,
        },
      }),
    ]);

    // Collections statistics
    const [
      totalCollections,
      activeCollections,
      featuredCollections,
    ] = await Promise.all([
      prisma.videoCollection.count({
        where: { deletedAt: null },
      }),
      prisma.videoCollection.count({
        where: {
          deletedAt: null,
          isActive: true,
        },
      }),
      prisma.videoCollection.count({
        where: {
          deletedAt: null,
          isActive: true,
          isFeatured: true,
        },
      }),
    ]);

    // Subscriptions statistics
    const [
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      cancelledSubscriptions,
      trialSubscriptions,
    ] = await Promise.all([
      prisma.subscription.count({
        where: { deletedAt: null },
      }),
      prisma.subscription.count({
        where: {
          deletedAt: null,
          status: "active",
        },
      }),
      prisma.subscription.count({
        where: {
          deletedAt: null,
          status: "expired",
        },
      }),
      prisma.subscription.count({
        where: {
          deletedAt: null,
          status: "cancelled",
        },
      }),
      prisma.subscription.count({
        where: {
          deletedAt: null,
          status: "active",
          trialEndsAt: { gte: now },
        },
      }),
    ]);

    // Revenue statistics (Payment model doesn't have deletedAt)
    const [totalRevenue, thisMonthRevenue, lastMonthRevenue] =
      await Promise.all([
        prisma.payment.aggregate({
          where: {
            status: "completed",
          },
          _sum: { amountMmk: true },
        }),
        prisma.payment.aggregate({
          where: {
            status: "completed",
            createdAt: { gte: startOfMonth },
          },
          _sum: { amountMmk: true },
        }),
        prisma.payment.aggregate({
          where: {
            status: "completed",
            createdAt: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
          _sum: { amountMmk: true },
        }),
      ]);

    const totalRevenueAmount = totalRevenue._sum.amountMmk 
      ? Number(totalRevenue._sum.amountMmk) 
      : 0;
    const thisMonthRevenueAmount = thisMonthRevenue._sum.amountMmk 
      ? Number(thisMonthRevenue._sum.amountMmk) 
      : 0;
    const lastMonthRevenueAmount = lastMonthRevenue._sum.amountMmk 
      ? Number(lastMonthRevenue._sum.amountMmk) 
      : 0;

    const revenueGrowthPercentage =
      lastMonthRevenueAmount > 0
        ? ((thisMonthRevenueAmount - lastMonthRevenueAmount) /
            lastMonthRevenueAmount) *
          100
        : thisMonthRevenueAmount > 0
        ? 100
        : 0;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        newLastMonth: newUsersLastMonth,
        growthPercentage: Math.round(userGrowthPercentage * 100) / 100,
      },
      videos: {
        total: totalVideos,
        published: publishedVideos,
        draft: draftVideos,
        totalViews,
        averageViews,
      },
      categories: {
        total: totalCategories,
        active: activeCategories,
      },
      collections: {
        total: totalCollections,
        active: activeCollections,
        featured: featuredCollections,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        expired: expiredSubscriptions,
        cancelled: cancelledSubscriptions,
        trial: trialSubscriptions,
      },
      revenue: {
        total: totalRevenueAmount,
        thisMonth: thisMonthRevenueAmount,
        lastMonth: lastMonthRevenueAmount,
        growthPercentage: Math.round(revenueGrowthPercentage * 100) / 100,
      },
    };
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // Get recent videos
    const recentVideos = await prisma.video.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    recentVideos.forEach((video) => {
      activities.push({
        id: video.id,
        type: "video",
        action: video.createdAt.getTime() === video.updatedAt.getTime() ? "created" : "updated",
        title: video.title,
        timestamp: video.updatedAt,
      });
    });

    // Get recent categories
    const recentCategories = await prisma.videoCategory.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: Math.floor(limit / 3),
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    recentCategories.forEach((category) => {
      activities.push({
        id: category.id,
        type: "category",
        action: category.createdAt.getTime() === category.updatedAt.getTime() ? "created" : "updated",
        title: category.name,
        timestamp: category.updatedAt,
      });
    });

    // Get recent collections
    const recentCollections = await prisma.videoCollection.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: Math.floor(limit / 3),
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    recentCollections.forEach((collection) => {
      activities.push({
        id: collection.id,
        type: "collection",
        action: collection.createdAt.getTime() === collection.updatedAt.getTime() ? "created" : "updated",
        title: collection.name,
        timestamp: collection.updatedAt,
      });
    });

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: Math.floor(limit / 3),
      select: {
        id: true,
        displayName: true,
        email: true,
        createdAt: true,
      },
    });

    recentUsers.forEach((user) => {
      activities.push({
        id: user.id,
        type: "user",
        action: "created",
        title: user.displayName || user.email || "User",
        timestamp: user.createdAt,
        userId: user.id,
        userName: user.displayName || user.email || undefined,
      });
    });

    // Sort by timestamp and return top N
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const analyticsService = new AnalyticsService();

