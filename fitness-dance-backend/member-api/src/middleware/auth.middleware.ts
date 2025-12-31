// member-api/src/middleware/auth.middleware.ts
// Authentication middleware for Member API

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import prisma from "../config/database";
import jwt from "jsonwebtoken";

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
    
    let payload: any;
    let userId: string;
    
    try {
      // Try to verify as member token first
      payload = verifyAccessToken(token);
      userId = payload.userId;
    } catch (error: any) {
      // If member token verification fails, try to decode as admin token
      // This allows admins to access member API
      try {
        const decoded = jwt.decode(token) as any;
        
        if (decoded && decoded.adminId) {
          // Admin token - find corresponding user by email
          const adminEmail = decoded.email;
          if (adminEmail) {
            const userByEmail = await prisma.user.findFirst({
              where: {
                email: adminEmail.toLowerCase(),
                deletedAt: null,
              },
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
                preferredLang: true,
              },
            });
            
            if (userByEmail) {
              userId = userByEmail.id;
              payload = { userId: userByEmail.id };
            } else {
              throw new Error("Admin account not linked to a user account");
            }
          } else {
            throw new Error("Invalid admin token: missing email");
          }
        } else {
          throw error; // Re-throw original error if not an admin token
        }
      } catch (adminError: any) {
        // If both fail, return original error
        throw error;
      }
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        preferredLang: true,
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

    // Set user's preferred language on request for i18n
    (req as any).userPreferredLang = user.preferredLang || 'en';

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
          preferredLang: true,
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
        // Set user's preferred language on request for i18n
        (req as any).userPreferredLang = user.preferredLang || 'en';
      }
    }

    next();
  } catch {
    // Ignore errors for optional auth
    next();
  }
}

