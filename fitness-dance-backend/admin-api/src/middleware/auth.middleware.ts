// admin-api/src/middleware/auth.middleware.ts
// Authentication and authorization middleware for Admin API

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import prisma from "../config/database";

export interface AdminAuthRequest extends Request {
  admin?: {
    adminId: string;
    email: string;
    roleId: string;
    roleSlug: string;
    permissions?: any;
  };
}

/**
 * Middleware to verify JWT token
 */
export async function authenticate(
  req: AdminAuthRequest,
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

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Verify admin exists and is active
    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      include: {
        adminRole: true,
      },
    });

    if (!admin || !admin.isActive) {
      res.status(401).json({
        success: false,
        message: "Admin not found or inactive",
      });
      return;
    }

    if (!admin.adminRole.isActive) {
      res.status(401).json({
        success: false,
        message: "Admin role is inactive",
      });
      return;
    }

    // Attach admin to request
    req.admin = {
      adminId: admin.id,
      email: admin.email,
      roleId: admin.adminRole.id,
      roleSlug: admin.adminRole.slug,
      permissions: admin.adminRole.permissions as any,
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
 * Middleware to check if admin has required permission
 */
export function requirePermission(resource: string, action: string) {
  return async (req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const permissions = req.admin.permissions;
    if (!permissions) {
      res.status(403).json({
        success: false,
        message: "No permissions found",
      });
      return;
    }

    // Super admin has all permissions
    if (req.admin.roleSlug === "super_admin") {
      next();
      return;
    }

    // Check if resource exists in permissions
    const resourcePermissions = (permissions as any)[resource];
    if (!resourcePermissions || !Array.isArray(resourcePermissions)) {
      res.status(403).json({
        success: false,
        message: `No access to ${resource}`,
      });
      return;
    }

    // Check if action is allowed
    if (!resourcePermissions.includes(action)) {
      res.status(403).json({
        success: false,
        message: `No permission to ${action} ${resource}`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if admin has one of the required roles
 */
export function requireRole(...roleSlugs: string[]) {
  return async (req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roleSlugs.includes(req.admin.roleSlug)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };
}

