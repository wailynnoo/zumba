// member-api/src/services/auth.service.ts
// Authentication service for Member API

import prisma from "../config/database";
import { hashPassword, comparePassword, validatePasswordStrength } from "../utils/password";
import { generateTokenPair, verifyRefreshToken, parseJwtExpiryToMs } from "../utils/jwt";
import { hashToken, extractDeviceInfo, extractIpAddress } from "../utils/token";
import crypto from "crypto";
import { Request } from "express";

export interface RegisterInput {
  email?: string;
  phoneNumber?: string;
  password: string;
  displayName?: string;
  avatarUrl?: string;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  address?: string;
  weight?: number; // Weight in kg
}

export interface LoginInput {
  email?: string;
  phoneNumber?: string;
  password: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput, req?: Request) {
    // Validate that at least email or phone is provided
    if (!input.email && !input.phoneNumber) {
      throw new Error("Either email or phone number is required");
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(input.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(", "));
    }

    // Check if user already exists
    if (input.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existingEmail) {
        throw new Error("User with this email already exists");
      }
    }

    if (input.phoneNumber) {
      const existingPhone = await prisma.user.findUnique({
        where: { phoneNumber: input.phoneNumber },
      });
      if (existingPhone) {
        throw new Error("User with this phone number already exists");
      }
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Generate verification tokens
    const emailVerificationToken = input.email
      ? crypto.randomBytes(32).toString("hex")
      : null;
    const phoneVerificationCode = input.phoneNumber
      ? Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
      : null;

    // Create user with all profile information
    const user = await prisma.user.create({
      data: {
        // Authentication
        email: input.email || null,
        phoneNumber: input.phoneNumber || null,
        passwordHash,
        
        // Profile Information
        displayName: input.displayName || null,
        avatarUrl: input.avatarUrl || null,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        address: input.address || null,
        weight: input.weight || null,
        
        // Email Verification
        emailVerificationToken: emailVerificationToken
          ? crypto.createHash("sha256").update(emailVerificationToken).digest("hex")
          : null,
        emailVerificationExpiresAt: emailVerificationToken
          ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          : null,
        
        // Phone Verification
        phoneVerificationCode: phoneVerificationCode
          ? await hashPassword(phoneVerificationCode) // Hash the code
          : null,
        phoneVerificationExpiresAt: phoneVerificationCode
          ? new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
          : null,
      },
    });

    // Generate tokens (user can use app but with limited access until verified)
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
    });

    // Extract device metadata
    const deviceInfo = req ? extractDeviceInfo(req) : "Unknown";
    const ipAddress = req ? extractIpAddress(req) : "Unknown";
    const userAgent = req?.headers["user-agent"] || "Unknown";

    // Hash and save refresh token (secure storage)
    const tokenHash = hashToken(tokens.refreshToken);
    const refreshExpiryMs = parseJwtExpiryToMs(process.env.JWT_REFRESH_EXPIRES_IN || "7d");
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + refreshExpiryMs),
        deviceInfo,
        ipAddress,
        userAgent,
      },
    });

    // Calculate age from dateOfBirth
    const age = user.dateOfBirth
      ? Math.floor((Date.now() - user.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    return {
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        dateOfBirth: user.dateOfBirth,
        age,
        address: user.address,
        weight: user.weight,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
      tokens,
      // Return plain verification tokens/codes (only on registration)
      verification: {
        emailToken: emailVerificationToken,
        phoneCode: phoneVerificationCode,
      },
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput, req?: Request) {
    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          input.email ? { email: input.email } : {},
          input.phoneNumber ? { phoneNumber: input.phoneNumber } : {},
        ],
      },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check password
    const passwordValid = await comparePassword(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new Error("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
    });

    // Extract device metadata
    const deviceInfo = req ? extractDeviceInfo(req) : "Unknown";
    const ipAddress = req ? extractIpAddress(req) : "Unknown";
    const userAgent = req?.headers["user-agent"] || "Unknown";

    // Hash and save refresh token (secure storage)
    const tokenHash = hashToken(tokens.refreshToken);
    const refreshExpiryMs = parseJwtExpiryToMs(process.env.JWT_REFRESH_EXPIRES_IN || "7d");
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + refreshExpiryMs),
        deviceInfo,
        ipAddress,
        userAgent,
      },
    });

    // Calculate age from dateOfBirth
    let age: number | undefined = undefined;
    if (user.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(user.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        dateOfBirth: user.dateOfBirth,
        age: age,
        address: user.address,
        weight: user.weight,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
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

    // Check if refresh token exists in database
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        userId: payload.userId,
        tokenHash,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new Error("Invalid or expired refresh token");
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new Error("User not found or inactive");
    }

    // Generate new token pair
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
    });

    // Revoke old refresh token (token rotation)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    // Extract device metadata for new token
    const deviceInfo = req ? extractDeviceInfo(req) : tokenRecord.deviceInfo || "Unknown";
    const ipAddress = req ? extractIpAddress(req) : tokenRecord.ipAddress || "Unknown";
    const userAgent = req?.headers["user-agent"] || tokenRecord.userAgent || "Unknown";

    // Hash and save new refresh token
    const newTokenHash = hashToken(tokens.refreshToken);
    const refreshExpiryMs = parseJwtExpiryToMs(process.env.JWT_REFRESH_EXPIRES_IN || "7d");
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
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
    await prisma.refreshToken.updateMany({
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
   * Logout from all devices - revoke all refresh tokens for a user
   */
  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    return { message: "Logged out from all devices successfully" };
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired verification token");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { message: "Email verified successfully" };
  }

  /**
   * Verify phone
   */
  async verifyPhone(phoneNumber: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.phoneVerificationCode || !user.phoneVerificationExpiresAt) {
      throw new Error("No verification code found");
    }

    if (user.phoneVerificationExpiresAt < new Date()) {
      throw new Error("Verification code expired");
    }

    const codeValid = await comparePassword(code, user.phoneVerificationCode);
    if (!codeValid) {
      throw new Error("Invalid verification code");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isPhoneVerified: true,
        phoneVerifiedAt: new Date(),
        phoneVerificationCode: null,
        phoneVerificationExpiresAt: null,
      },
    });

    return { message: "Phone number verified successfully" };
  }
}

export const authService = new AuthService();

