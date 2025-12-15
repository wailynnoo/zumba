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
    // Log authentication attempt for video upload routes
    if (req.path.includes("/video") || req.path.includes("/thumbnail") || req.path.includes("/audio")) {
      console.log("[Auth] Authenticating request:", {
        method: req.method,
        path: req.path,
        hasAuthHeader: !!req.headers.authorization,
        hasTokenParam: !!req.query.token,
      });
    }

    // For video streaming, also check query parameter (since HTML video elements can't send headers)
    const isStreamingRequest = req.path.includes("/stream");
    let token: string | null = null;

    // First try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    // For streaming, also check query parameter
    else if (isStreamingRequest && req.query.token && typeof req.query.token === "string") {
      token = req.query.token;
    }

    if (!token) {
      if (req.path.includes("/video") || req.path.includes("/thumbnail") || req.path.includes("/audio")) {
        console.log("[Auth] No token provided for:", req.path);
      }
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }
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

    if (req.path.includes("/video") || req.path.includes("/thumbnail") || req.path.includes("/audio")) {
      console.log("[Auth] Authentication successful:", {
        adminId: admin.id,
        email: admin.email,
        roleSlug: admin.adminRole.slug,
      });
    }

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
      console.log("[Permission] No admin in request for:", req.path);
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const permissions = req.admin.permissions;
    if (!permissions) {
      console.log("[Permission] No permissions found for admin:", req.admin.adminId);
      res.status(403).json({
        success: false,
        message: "No permissions found",
      });
      return;
    }

    // Log permission check for collections and file upload routes
    if (req.path.includes("/collections") || req.path.includes("/video") || req.path.includes("/thumbnail") || req.path.includes("/audio")) {
      console.log("[Permission] Checking permission:", {
        resource,
        action,
        roleSlug: req.admin.roleSlug,
        hasPermissions: !!permissions,
        path: req.path,
      });
    }

    // Super admin has all permissions
    if (req.admin.roleSlug === "super_admin") {
      if (req.path.includes("/video") || req.path.includes("/thumbnail") || req.path.includes("/audio")) {
        console.log("[Permission] Super admin - access granted");
      }
      next();
      return;
    }

    // Check if resource exists in permissions
    const resourcePermissions = (permissions as any)[resource];
    if (!resourcePermissions || !Array.isArray(resourcePermissions)) {
      if (req.path.includes("/collections") || req.path.includes("/video") || req.path.includes("/thumbnail") || req.path.includes("/audio")) {
        console.log("[Permission] No access to resource:", {
          resource,
          action,
          hasResourcePerms: !!resourcePermissions,
          availableResources: Object.keys(permissions || {}),
          path: req.path,
        });
      }
      res.status(403).json({
        success: false,
        message: `No access to ${resource}`,
      });
      return;
    }

    // Check if action is allowed
    if (!resourcePermissions.includes(action)) {
      if (req.path.includes("/collections") || req.path.includes("/video") || req.path.includes("/thumbnail") || req.path.includes("/audio")) {
        console.log("[Permission] No permission for action:", {
          resource,
          action,
          allowedActions: resourcePermissions,
          path: req.path,
        });
      }
      res.status(403).json({
        success: false,
        message: `No permission to ${action} ${resource}`,
      });
      return;
    }

    if (req.path.includes("/collections") || req.path.includes("/video") || req.path.includes("/thumbnail") || req.path.includes("/audio")) {
      console.log("[Permission] Permission granted - proceeding to handler");
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

