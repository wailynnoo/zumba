// member-api/src/services/auth.service.ts
// Authentication service for Member API

import prisma from "../config/database";
import { hashPassword, comparePassword, validatePasswordStrength } from "../utils/password";
import { generateTokenPair, verifyRefreshToken, parseJwtExpiryToMs } from "../utils/jwt";
import { hashToken, extractDeviceInfo, extractIpAddress } from "../utils/token";
import { t, SupportedLanguage } from "../i18n";
import crypto from "crypto";
import { Request } from "express";

export interface RegisterInput {
  email?: string;
  phoneNumber?: string;
  password: string;
  displayName?: string;
  avatarUrl?: string;
  gender?: string;
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
    // Get language from request
    const lang: SupportedLanguage = (req as any)?.language || 'en';

    // Sanitize inputs (trim whitespace, lowercase email)
    const sanitizedInput = {
      ...input,
      email: input.email?.trim().toLowerCase(),
      phoneNumber: input.phoneNumber?.trim(),
      displayName: input.displayName?.trim(),
      address: input.address?.trim(),
    };

    // Validate that at least email or phone is provided
    if (!sanitizedInput.email && !sanitizedInput.phoneNumber) {
      throw new Error(t('auth.register.emailOrPhoneRequired', lang));
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(sanitizedInput.password);
    if (!passwordValidation.valid) {
      // Use translated message for password validation
      throw new Error(t('auth.register.passwordWeak', lang));
    }

    // Check if user already exists (excluding soft-deleted users)
    if (sanitizedInput.email) {
      const existingEmail = await prisma.user.findFirst({
        where: { 
          email: sanitizedInput.email,
          deletedAt: null, // Only check active (non-deleted) users
        },
      });
      if (existingEmail) {
        throw new Error(t('auth.register.emailExists', lang));
      }
    }

    if (sanitizedInput.phoneNumber) {
      const existingPhone = await prisma.user.findFirst({
        where: { 
          phoneNumber: sanitizedInput.phoneNumber,
          deletedAt: null, // Only check active (non-deleted) users
        },
      });
      if (existingPhone) {
        throw new Error(t('auth.register.phoneExists', lang));
      }
    }

    // Hash password
    const passwordHash = await hashPassword(sanitizedInput.password);

    // Generate verification tokens
    const emailVerificationToken = sanitizedInput.email
      ? crypto.randomBytes(32).toString("hex")
      : null;
    const phoneVerificationCode = sanitizedInput.phoneNumber
      ? Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
      : null;

    // Use transaction to ensure atomicity: user creation and token creation happen together
    const { user, tokens } = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      // Create user with all profile information
      const user = await tx.user.create({
        data: {
          // Authentication
          email: sanitizedInput.email || null,
          phoneNumber: sanitizedInput.phoneNumber || null,
          passwordHash,
          
          // Profile Information
          displayName: sanitizedInput.displayName || null,
          avatarUrl: sanitizedInput.avatarUrl || null,
          gender: sanitizedInput.gender || null,
          dateOfBirth: sanitizedInput.dateOfBirth ? new Date(sanitizedInput.dateOfBirth) : null,
          address: sanitizedInput.address || null,
          weight: sanitizedInput.weight || null,
          
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
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + refreshExpiryMs),
          deviceInfo,
          ipAddress,
          userAgent,
        },
      });

      return { user, tokens };
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
        gender: user.gender,
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
    // Get language from request
    const lang: SupportedLanguage = (req as any)?.language || 'en';

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
      throw new Error(t('auth.login.invalidCredentials', lang));
    }

    // Check password
    const passwordValid = await comparePassword(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new Error(t('auth.login.invalidCredentials', lang));
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error(t('auth.login.accountDeactivated', lang));
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
        gender: user.gender,
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
    const lang: SupportedLanguage = (req as any)?.language || 'en';

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
      throw new Error(t('auth.refresh.invalidToken', lang));
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new Error(t('auth.login.accountDeactivated', lang));
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
  async logout(refreshToken: string, req?: Request) {
    const lang: SupportedLanguage = (req as any)?.language || 'en';
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

    return { message: t('auth.logout.success', lang) };
  }

  /**
   * Logout from all devices - revoke all refresh tokens for a user
   */
  async logoutAll(userId: string, req?: Request) {
    const lang: SupportedLanguage = (req as any)?.language || 'en';
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

    return { message: t('auth.logout.allDevices', lang) };
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string, req?: Request) {
    const lang: SupportedLanguage = (req as any)?.language || 'en';
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error(t('auth.verify.invalidToken', lang));
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

    return { message: t('auth.verify.emailSuccess', lang) };
  }

  /**
   * Verify phone
   */
  async verifyPhone(phoneNumber: string, code: string, req?: Request) {
    const lang: SupportedLanguage = (req as any)?.language || 'en';
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      throw new Error(t('auth.verify.userNotFound', lang));
    }

    if (!user.phoneVerificationCode || !user.phoneVerificationExpiresAt) {
      throw new Error(t('auth.verify.noCode', lang));
    }

    if (user.phoneVerificationExpiresAt < new Date()) {
      throw new Error(t('auth.verify.codeExpired', lang));
    }

    const codeValid = await comparePassword(code, user.phoneVerificationCode);
    if (!codeValid) {
      throw new Error(t('auth.verify.invalidCode', lang));
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

    return { message: t('auth.verify.phoneSuccess', lang) };
  }
}

export const authService = new AuthService();

