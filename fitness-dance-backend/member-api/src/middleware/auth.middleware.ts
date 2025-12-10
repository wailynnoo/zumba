// member-api/src/middleware/auth.middleware.ts
// Authentication middleware for Member API

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import prisma from "../config/database";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    phoneNumber?: string;
    displayName?: string;
    avatarUrl?: string;
    dateOfBirth?: Date;
    address?: string;
    weight?: number;
  };
}

/**
 * Middleware to verify JWT token
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const payload = verifyAccessToken(token);

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        isActive: true,
        email: true,
        phoneNumber: true,
        displayName: true,
        avatarUrl: true,
        dateOfBirth: true,
        address: true,
        weight: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
      return;
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
      displayName: user.displayName || undefined,
      avatarUrl: user.avatarUrl || undefined,
      dateOfBirth: user.dateOfBirth || undefined,
      address: user.address || undefined,
      weight: user.weight || undefined,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || "Invalid or expired token",
    });
    return;
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuthenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          isActive: true,
          email: true,
          phoneNumber: true,
          displayName: true,
          avatarUrl: true,
          dateOfBirth: true,
          address: true,
          weight: true,
        },
      });

      if (user && user.isActive) {
        req.user = {
          userId: user.id,
          email: user.email || undefined,
          phoneNumber: user.phoneNumber || undefined,
          displayName: user.displayName || undefined,
          avatarUrl: user.avatarUrl || undefined,
          dateOfBirth: user.dateOfBirth || undefined,
          address: user.address || undefined,
          weight: user.weight || undefined,
        };
      }
    }

    next();
  } catch {
    // Ignore errors for optional auth
    next();
  }
}

