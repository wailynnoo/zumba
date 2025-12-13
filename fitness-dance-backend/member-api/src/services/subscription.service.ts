// member-api/src/services/subscription.service.ts
// Subscription service for Member API

import prisma from "../config/database";

export class SubscriptionService {
  /**
   * Check if user has active subscription
   * @param userId - User ID
   * @returns true if user has active subscription, false otherwise
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
        expiresAt: {
          gt: new Date(), // Not expired
        },
        deletedAt: null,
      },
      orderBy: {
        expiresAt: "desc", // Get the latest subscription
      },
    });

    return !!subscription;
  }

  /**
   * Get user's active subscription
   * @param userId - User ID
   * @returns Active subscription or null
   */
  async getActiveSubscription(userId: string) {
    return await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
        expiresAt: {
          gt: new Date(),
        },
        deletedAt: null,
      },
      include: {
        subscriptionPlan: true,
      },
      orderBy: {
        expiresAt: "desc",
      },
    });
  }
}

export const subscriptionService = new SubscriptionService();

