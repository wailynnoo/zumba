// member-api/src/services/user.service.ts
// User profile service for Member API

import prisma from "../config/database";
import { t, SupportedLanguage } from "../i18n";
import { Request } from "express";

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  address?: string;
  weight?: number; // Weight in kg
  gender?: string;
}

export class UserService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        displayName: true,
        avatarUrl: true,
        dateOfBirth: true,
        address: true,
        weight: true,
        gender: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error(t('user.profileNotFound', 'en'));
    }

    // Calculate age if dateOfBirth exists
    let age: number | undefined;
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
      ...user,
      age,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput, req?: Request) {
    const lang: SupportedLanguage = (req as any)?.language || 'en';

    // Sanitize inputs
    const sanitizedInput: any = {};
    
    if (input.displayName !== undefined) {
      sanitizedInput.displayName = input.displayName?.trim() || null;
      if (sanitizedInput.displayName && sanitizedInput.displayName.length > 100) {
        throw new Error(t('user.displayNameTooLong', lang));
      }
    }

    if (input.avatarUrl !== undefined) {
      sanitizedInput.avatarUrl = input.avatarUrl?.trim() || null;
      // Basic URL validation
      if (sanitizedInput.avatarUrl && !this.isValidUrl(sanitizedInput.avatarUrl)) {
        throw new Error(t('user.invalidAvatarUrl', lang));
      }
    }

    if (input.dateOfBirth !== undefined) {
      if (input.dateOfBirth) {
        const birthDate = new Date(input.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

        if (calculatedAge < 13 || calculatedAge > 120) {
          throw new Error(t('user.invalidAge', lang));
        }
        sanitizedInput.dateOfBirth = birthDate.toISOString();
      } else {
        sanitizedInput.dateOfBirth = null;
      }
    }

    if (input.address !== undefined) {
      sanitizedInput.address = input.address?.trim() || null;
      if (sanitizedInput.address && sanitizedInput.address.length > 500) {
        throw new Error(t('user.addressTooLong', lang));
      }
    }

    if (input.weight !== undefined) {
      if (input.weight === null || input.weight === undefined) {
        sanitizedInput.weight = null;
      } else {
        if (input.weight < 20 || input.weight > 500) {
          throw new Error(t('user.invalidWeight', lang));
        }
        sanitizedInput.weight = input.weight;
      }
    }

    if (input.gender !== undefined) {
      const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
      if (input.gender && !validGenders.includes(input.gender)) {
        throw new Error(t('user.invalidGender', lang));
      }
      sanitizedInput.gender = input.gender || null;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
        deletedAt: null,
      },
      data: sanitizedInput,
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        displayName: true,
        avatarUrl: true,
        dateOfBirth: true,
        address: true,
        weight: true,
        gender: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate age
    let age: number | undefined;
    if (updatedUser.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(updatedUser.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    return {
      ...updatedUser,
      age,
    };
  }

  /**
   * Basic URL validation
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      // Also accept local file paths (for mobile apps)
      return url.startsWith('file://') || url.startsWith('content://');
    }
  }
}

