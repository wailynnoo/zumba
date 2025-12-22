// member-api/src/i18n/middleware.ts
// Language detection middleware

import { Request, Response, NextFunction } from 'express';
import { isLanguageSupported, defaultLanguage, SupportedLanguage } from './index';
import { AuthRequest } from '../middleware/auth.middleware';

// Extend Request to include language
declare global {
  namespace Express {
    interface Request {
      language?: SupportedLanguage;
    }
  }
}

/**
 * Parse Accept-Language header
 * Returns preferred language code
 */
function parseAcceptLanguage(acceptLanguage: string | undefined): string {
  if (!acceptLanguage) return defaultLanguage;
  
  // Parse: "en-US,en;q=0.9,my;q=0.8"
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = 'q=1'] = lang.trim().split(';');
      const quality = parseFloat(q.replace('q=', ''));
      return { code: code.split('-')[0].toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);
  
  return languages[0]?.code || defaultLanguage;
}

/**
 * Detect language from request
 * Priority:
 * 1. Query parameter (?lang=en)
 * 2. User's preferredLang (if authenticated and set on request)
 * 3. Accept-Language header
 * 4. Default (en)
 */
export function detectLanguage(req: Request | AuthRequest): SupportedLanguage {
  // 1. Check query parameter
  const queryLang = req.query.lang as string;
  if (queryLang && isLanguageSupported(queryLang)) {
    return queryLang;
  }
  
  // 2. Check user's preferred language (if authenticated)
  // This is set by auth middleware after loading user
  if ('user' in req && req.user) {
    const userLang = (req as any).userPreferredLang;
    if (userLang && isLanguageSupported(userLang)) {
      return userLang;
    }
  }
  
  // 3. Check Accept-Language header
  const headerLang = parseAcceptLanguage(req.headers['accept-language']);
  if (isLanguageSupported(headerLang)) {
    return headerLang;
  }
  
  // 4. Default
  return defaultLanguage;
}

/**
 * Middleware to detect and set language on request
 */
export function languageMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  req.language = detectLanguage(req);
  next();
}

