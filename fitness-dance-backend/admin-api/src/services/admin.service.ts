// admin-api/src/services/admin.service.ts
// Admin service for Admin API - Full CRUD operations

import prisma from "../config/database";
import { z } from "zod";
import { hashPassword, comparePassword } from "../utils/password";

// Validation schemas
export const createAdminSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  adminRoleId: z.string().uuid("Invalid role ID"),
  isActive: z.boolean().default(true),
});

export const updateAdminSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  displayName: z.string().max(100).optional(),
  avatarUrl: z.union([
    z.string().url("Must be a valid URL"),
    z.literal(""),
  ]).optional(),
  adminRoleId: z.string().uuid("Invalid role ID").optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export class AdminService {
  /**
   * Create a new admin
   */
  async createAdmin(data: z.infer<typeof createAdminSchema>, createdById: string) {
    // Check if email already exists (excluding soft-deleted)
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        email: data.email,
        deletedAt: null,
      },
    });

    if (existingAdmin) {
      throw new Error("Admin with this email already exists");
    }

    // Check if there's a soft-deleted admin with this email
    // If so, hard delete it first to allow reuse of the email
    const softDeletedAdmin = await prisma.admin.findFirst({
      where: {
        email: data.email,
        deletedAt: { not: null },
      },
    });

    if (softDeletedAdmin) {
      // Hard delete the soft-deleted admin to free up the email
      await prisma.admin.delete({
        where: { id: softDeletedAdmin.id },
      });
    }

    // Validate role exists and is active
    const role = await prisma.adminRole.findUnique({
      where: { id: data.adminRoleId },
    });

    if (!role) {
      throw new Error("Admin role not found");
    }

    if (!role.isActive) {
      throw new Error("Admin role is inactive");
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: data.email,
        passwordHash,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl || null,
        adminRoleId: data.adminRoleId,
        isActive: data.isActive,
        createdById,
      },
      include: {
        adminRole: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    // Remove passwordHash from response
    const { passwordHash: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }

  /**
   * Get all admins (with pagination and filters)
   */
  async getAdmins(params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    adminRoleId?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.adminRoleId) {
      where.adminRoleId = params.adminRoleId;
    }

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: "insensitive" } },
        { displayName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [admins, total] = await Promise.all([
      prisma.admin.findMany({
        where,
        include: {
          adminRole: true,
          createdBy: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
        orderBy: [
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.admin.count({ where }),
    ]);

    // Remove passwordHash from all admins
    const adminsWithoutPassword = admins.map((admin: any) => {
      const { passwordHash, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    });

    return {
      data: adminsWithoutPassword,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get admin by ID
   */
  async getAdminById(id: string) {
    const admin = await prisma.admin.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        adminRole: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    // Remove passwordHash from response
    const { passwordHash: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }

  /**
   * Update admin
   */
  async updateAdmin(id: string, data: z.infer<typeof updateAdminSchema>) {
    // Check if admin exists
    const existing = await prisma.admin.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new Error("Admin not found");
    }

    // Check if email conflicts with another admin
    if (data.email && data.email !== existing.email) {
      const conflict = await prisma.admin.findFirst({
        where: {
          id: { not: id },
          email: data.email,
          deletedAt: null,
        },
      });

      if (conflict) {
        throw new Error("Admin with this email already exists");
      }

      // Check if there's a soft-deleted admin with this email
      // If so, hard delete it first to allow reuse of the email
      const softDeletedAdmin = await prisma.admin.findFirst({
        where: {
          id: { not: id },
          email: data.email,
          deletedAt: { not: null },
        },
      });

      if (softDeletedAdmin) {
        // Hard delete the soft-deleted admin to free up the email
        await prisma.admin.delete({
          where: { id: softDeletedAdmin.id },
        });
      }
    }

    // Validate role if provided
    if (data.adminRoleId) {
      const role = await prisma.adminRole.findUnique({
        where: { id: data.adminRoleId },
      });

      if (!role) {
        throw new Error("Admin role not found");
      }

      if (!role.isActive) {
        throw new Error("Admin role is inactive");
      }
    }

    // Update admin
    const admin = await prisma.admin.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
        ...(data.adminRoleId && { adminRoleId: data.adminRoleId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        adminRole: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    // Remove passwordHash from response
    const { passwordHash: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }

  /**
   * Delete admin (soft delete)
   */
  async deleteAdmin(id: string, currentAdminId: string) {
    // Prevent self-deletion
    if (id === currentAdminId) {
      throw new Error("Cannot delete your own account");
    }

    // Check if admin exists
    const admin = await prisma.admin.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    // Soft delete
    await prisma.admin.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: "Admin deleted successfully" };
  }

  /**
   * Toggle admin active status
   */
  async toggleAdminStatus(id: string) {
    const admin = await prisma.admin.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    const updated = await prisma.admin.update({
      where: { id },
      data: {
        isActive: !admin.isActive,
      },
      include: {
        adminRole: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    // Remove passwordHash from response
    const { passwordHash: _, ...adminWithoutPassword } = updated;
    return adminWithoutPassword;
  }

  /**
   * Change password (for own account)
   */
  async changePassword(adminId: string, oldPassword: string, newPassword: string) {
    // Get admin
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    // Verify old password
    const isOldPasswordValid = await comparePassword(oldPassword, admin.passwordHash);
    if (!isOldPasswordValid) {
      throw new Error("Invalid old password");
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.admin.update({
      where: { id: adminId },
      data: { passwordHash },
    });

    return { message: "Password changed successfully" };
  }

  /**
   * Reset password (admin-initiated, no old password required)
   */
  async resetPassword(adminId: string, newPassword: string) {
    // Check if admin exists
    const admin = await prisma.admin.findFirst({
      where: {
        id: adminId,
        deletedAt: null,
      },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.admin.update({
      where: { id: adminId },
      data: { passwordHash },
    });

    return { message: "Password reset successfully" };
  }

  /**
   * Get all admin roles
   */
  async getAdminRoles() {
    const roles = await prisma.adminRole.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return roles;
  }
}

export const adminService = new AdminService();

