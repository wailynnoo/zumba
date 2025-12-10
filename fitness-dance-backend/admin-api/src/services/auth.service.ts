// admin-api/src/services/auth.service.ts
// Authentication service for Admin API

import prisma from "../config/database";
import { comparePassword } from "../utils/password";
import { generateTokenPair, verifyRefreshToken, parseJwtExpiryToMs } from "../utils/jwt";
import { hashToken, extractDeviceInfo, extractIpAddress } from "../utils/token";
import { getJwtRefreshExpiresIn } from "../config/env";
import { Request } from "express";

export interface LoginInput {
  email: string;
  password: string;
}

export interface DeviceMetadata {
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AdminAuthService {
  /**
   * Login admin
   */
  async login(input: LoginInput, req?: Request) {
    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: input.email },
      include: {
        adminRole: true,
      },
    });

    if (!admin) {
      throw new Error("Invalid credentials");
    }

    // Check password
    const passwordValid = await comparePassword(input.password, admin.passwordHash);
    if (!passwordValid) {
      throw new Error("Invalid credentials");
    }

    // Check if admin is active
    if (!admin.isActive) {
      throw new Error("Admin account is deactivated");
    }

    // Check if role is active
    if (!admin.adminRole.isActive) {
      throw new Error("Admin role is inactive");
    }

    // Update last login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = generateTokenPair({
      adminId: admin.id,
      email: admin.email,
      roleId: admin.adminRole.id,
      roleSlug: admin.adminRole.slug,
    });

    // Extract device metadata
    const deviceInfo = req ? extractDeviceInfo(req) : "Unknown";
    const ipAddress = req ? extractIpAddress(req) : "Unknown";
    const userAgent = req?.headers["user-agent"] || "Unknown";

    // Hash and persist refresh token
    const tokenHash = hashToken(tokens.refreshToken);
    const refreshExpiryMs = parseJwtExpiryToMs(getJwtRefreshExpiresIn());
    await prisma.adminRefreshToken.create({
      data: {
        adminId: admin.id,
        tokenHash,
        expiresAt: new Date(Date.now() + refreshExpiryMs),
        deviceInfo,
        ipAddress,
        userAgent,
      },
    });

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: {
          id: admin.adminRole.id,
          name: admin.adminRole.name,
          slug: admin.adminRole.slug,
          permissions: admin.adminRole.permissions,
        },
      },
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, req?: Request) {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Hash the token to look it up in database
    const tokenHash = hashToken(refreshToken);

    // Check if refresh token exists and is valid
    const tokenRecord = await prisma.adminRefreshToken.findFirst({
      where: {
        adminId: payload.adminId,
        tokenHash,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new Error("Invalid or expired refresh token");
    }

    // Get admin
    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      include: {
        adminRole: true,
      },
    });

    if (!admin || !admin.isActive) {
      throw new Error("Admin not found or inactive");
    }

    if (!admin.adminRole.isActive) {
      throw new Error("Admin role is inactive");
    }

    // Generate new token pair
    const tokens = generateTokenPair({
      adminId: admin.id,
      email: admin.email,
      roleId: admin.adminRole.id,
      roleSlug: admin.adminRole.slug,
    });

    // Revoke old refresh token (token rotation)
    await prisma.adminRefreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    // Extract device metadata for new token
    const deviceInfo = req ? extractDeviceInfo(req) : tokenRecord.deviceInfo || "Unknown";
    const ipAddress = req ? extractIpAddress(req) : tokenRecord.ipAddress || "Unknown";
    const userAgent = req?.headers["user-agent"] || tokenRecord.userAgent || "Unknown";

    // Save new refresh token
    const newTokenHash = hashToken(tokens.refreshToken);
    const refreshExpiryMs = parseJwtExpiryToMs(getJwtRefreshExpiresIn());
    await prisma.adminRefreshToken.create({
      data: {
        adminId: admin.id,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + refreshExpiryMs),
        deviceInfo,
        ipAddress,
        userAgent,
      },
    });

    return tokens;
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    // Revoke the refresh token
    await prisma.adminRefreshToken.updateMany({
      where: {
        tokenHash,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    return { message: "Logged out successfully" };
  }

  /**
   * Logout from all devices - revoke all refresh tokens for an admin
   */
  async logoutAll(adminId: string) {
    await prisma.adminRefreshToken.updateMany({
      where: {
        adminId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    return { message: "Logged out from all devices successfully" };
  }
}

export const adminAuthService = new AdminAuthService();

