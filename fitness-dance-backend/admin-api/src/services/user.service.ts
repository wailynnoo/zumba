// admin-api/src/services/user.service.ts
// User service for Admin API - User management operations

import prisma from "../config/database";
import { z } from "zod";

// Validation schemas
export const updateUserSchema = z.object({
  displayName: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  preferredLang: z.string().optional(),
});

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export class UserService {
  /**
   * Get all users with pagination and filters
   */
  async getUsers(params: UserListParams = {}) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    // Search filter
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: "insensitive" } },
        { phoneNumber: { contains: params.search, mode: "insensitive" } },
        { displayName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    // Active status filter
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    // Email verification filter
    if (params.isEmailVerified !== undefined) {
      where.isEmailVerified = params.isEmailVerified;
    }

    // Phone verification filter
    if (params.isPhoneVerified !== undefined) {
      where.isPhoneVerified = params.isPhoneVerified;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          displayName: true,
          avatarUrl: true,
          dateOfBirth: true,
          gender: true,
          preferredLang: true,
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              subscriptions: {
                where: {
                  status: "active",
                  deletedAt: null,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        displayName: true,
        avatarUrl: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        weight: true,
        preferredLang: true,
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: true,
        isPhoneVerified: true,
        phoneVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        preferences: true,
        _count: {
          select: {
            subscriptions: true,
            payments: true,
            playlists: true,
            favorites: true,
            watchHistory: true,
          },
        },
        subscriptions: {
          where: {
            deletedAt: null,
          },
          include: {
            subscriptionPlan: {
              select: {
                id: true,
                name: true,
                priceMmk: true,
                durationMonths: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
    const existing = await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new Error("User not found");
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.preferredLang !== undefined && { preferredLang: data.preferredLang }),
      },
    });

    return user;
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(id: string) {
    const user = await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    return updated;
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      usersWithSubscriptions,
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
          OR: [
            { isEmailVerified: true },
            { isPhoneVerified: true },
          ],
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          subscriptions: {
            some: {
              status: "active",
              deletedAt: null,
            },
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      usersWithSubscriptions,
    };
  }
}

export const userService = new UserService();

