// member-api/src/controllers/auth.controller.ts
// Authentication controller for Member API

import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { t, SupportedLanguage } from "../i18n";
import { z } from "zod";

// Validation schemas
const registerSchema = z.object({
  // Required: At least one of email or phone
  email: z.string().email("Invalid email format").optional(),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  
  // Required
  password: z.string().min(8, "Password must be at least 8 characters"),
  
  // Profile Information
  displayName: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  avatarUrl: z.union([
    z.string().url("Invalid URL format"),
    z.literal("")
  ]).optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      return actualAge >= 13 && actualAge <= 120; // Age between 13 and 120
    }, "Age must be between 13 and 120 years")
    .optional(),
  address: z.string().max(500, "Address must be less than 500 characters").optional(),
  weight: z.number()
    .positive("Weight must be positive")
    .min(20, "Weight must be at least 20 kg")
    .max(500, "Weight must be less than 500 kg")
    .optional(),
}).refine((data) => data.email || data.phoneNumber, {
  message: "Either email or phone number is required",
  path: ["email"], // Show error on email field
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  password: z.string(),
}).refine((data) => data.email || data.phoneNumber, {
  message: "Either email or phone number is required",
});

const verifyEmailSchema = z.object({
  token: z.string(),
});

const verifyPhoneSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().length(6),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const lang: SupportedLanguage = (req as any).language || 'en';
      const validated = registerSchema.parse(req.body);
      const result = await authService.register(validated, req);

      res.status(201).json({
        success: true,
        message: t('auth.register.success', lang),
        data: result,
      });
    } catch (error: any) {
      const lang: SupportedLanguage = (req as any).language || 'en';
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: t('errors.validationError', lang),
          errors: error.issues,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || t('errors.validationError', lang),
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const lang: SupportedLanguage = (req as any).language || 'en';
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated, req);

      res.status(200).json({
        success: true,
        message: t('auth.login.success', lang),
        data: result,
      });
    } catch (error: any) {
      const lang: SupportedLanguage = (req as any).language || 'en';
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: t('errors.validationError', lang),
          errors: error.issues,
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: error.message || t('auth.login.invalidCredentials', lang),
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const lang: SupportedLanguage = (req as any).language || 'en';
      const validated = refreshTokenSchema.parse(req.body);
      const tokens = await authService.refreshToken(validated.refreshToken, req);

      res.status(200).json({
        success: true,
        message: t('auth.refresh.success', lang),
        data: tokens,
      });
    } catch (error: any) {
      const lang: SupportedLanguage = (req as any).language || 'en';
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: t('errors.validationError', lang),
          errors: error.issues,
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: error.message || t('auth.refresh.invalidToken', lang),
      });
    }
  }

  /**
   * Logout - revoke refresh token
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const validated = refreshTokenSchema.parse(req.body);
      const result = await authService.logout(validated.refreshToken, req);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const lang: SupportedLanguage = (req as any).language || 'en';
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: t('errors.validationError', lang),
          errors: error.issues,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || t('errors.serverError', lang),
      });
    }
  }

  /**
   * Verify email
   * POST /api/auth/verify/email
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const validated = verifyEmailSchema.parse(req.body);
      const result = await authService.verifyEmail(validated.token, req);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const lang: SupportedLanguage = (req as any).language || 'en';
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: t('errors.validationError', lang),
          errors: error.issues,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || t('auth.verify.invalidToken', lang),
      });
    }
  }

  /**
   * Verify phone
   * POST /api/auth/verify/phone
   */
  async verifyPhone(req: Request, res: Response): Promise<void> {
    try {
      const validated = verifyPhoneSchema.parse(req.body);
      const result = await authService.verifyPhone(
        validated.phoneNumber,
        validated.code,
        req
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const lang: SupportedLanguage = (req as any).language || 'en';
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: t('errors.validationError', lang),
          errors: error.issues,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || t('auth.verify.invalidCode', lang),
      });
    }
  }

  /**
   * Logout from all devices - revoke all refresh tokens
   * POST /api/auth/logout-all
   * Requires authentication
   */
  async logoutAll(req: any, res: Response): Promise<void> {
    try {
      const lang: SupportedLanguage = (req as any).language || 'en';
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: t('errors.unauthorized', lang),
        });
        return;
      }

      const result = await authService.logoutAll(req.user.userId, req);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const lang: SupportedLanguage = (req as any).language || 'en';
      res.status(400).json({
        success: false,
        message: error.message || t('errors.serverError', lang),
      });
    }
  }
}

export const authController = new AuthController();

