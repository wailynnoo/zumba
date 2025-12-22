// member-api/src/i18n/index.ts
// Translation service for multi-language support

import enTranslations from './locales/en.json';
import myTranslations from './locales/my.json';

export type SupportedLanguage = 'en' | 'my';

type TranslationKey = string;

const translations: Record<SupportedLanguage, any> = {
  en: enTranslations,
  my: myTranslations,
};

const defaultLanguage: SupportedLanguage = 'en';

/**
 * Get translation for a key
 * @param key - Translation key (e.g., "auth.register.success")
 * @param lang - Language code (default: "en")
 * @param params - Optional parameters to replace in translation
 * @returns Translated string or key if translation not found
 */
export function t(
  key: TranslationKey,
  lang: SupportedLanguage = defaultLanguage,
  params?: Record<string, string | number>
): string {
  // Use provided language or fallback to default
  const translation = translations[lang] || translations[defaultLanguage];
  
  // Navigate nested object using dot notation
  const keys = key.split('.');
  let value: any = translation;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to default language
      const fallbackTranslation = translations[defaultLanguage];
      let fallbackValue: any = fallbackTranslation;
      
      for (const fallbackKey of keys) {
        if (fallbackValue && typeof fallbackValue === 'object' && fallbackKey in fallbackValue) {
          fallbackValue = fallbackValue[fallbackKey];
        } else {
          return key; // Return key if translation not found
        }
      }
      value = fallbackValue;
      break;
    }
  }
  
  if (typeof value !== 'string') {
    return key; // Return key if translation is not a string
  }
  
  // Replace parameters if provided
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return value;
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return Object.keys(translations) as SupportedLanguage[];
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(lang: string): lang is SupportedLanguage {
  return lang in translations;
}

export { defaultLanguage };

