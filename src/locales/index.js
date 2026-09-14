/**
 * Preloaded translations for synchronous i18n initialization
 * Supports hybrid i18n system: Chrome official + custom translations
 * This file imports all translation JSON files and exports them
 * to avoid async loading delays during component rendering
 */

// Import translation files directly (with JSON import assertions)
import enUS from '../assets/locales/en-us.json' with { type: 'json' };
import zhCN from '../assets/locales/zh-cn.json' with { type: 'json' };

// Export translations object for immediate access
export const translations = {
  'en-us': enUS,
  'zh-cn': zhCN
};

// Export supported languages
export const supportedLanguages = Object.keys(translations);

// Export language display names
export const languageDisplayNames = {
  'en-us': 'English',
  'zh-cn': '简体中文'
};

// Chrome locale mapping (for Chrome API mode)
export const chromeLocaleMapping = {
  'en-us': 'en',
  'zh-cn': 'zh_CN'
};

// Reverse mapping (Chrome locale -> flat locale)
export const reverseChromeMapping = {
  'en': 'en-us',
  'zh_CN': 'zh-cn',
  'en-US': 'en-us',
  'zh-CN': 'zh-cn',
  'zh': 'zh-cn'
};

/**
 * Detect if Chrome i18n API is currently supported
 */
export const isChromeI18nSupported = () => {
  try {
    return typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage;
  } catch (error) {
    return false;
  }
};

/**
 * Get flat format language code corresponding to Chrome UI language
 */
export const getChromeUILanguageFlat = () => {
  if (!isChromeI18nSupported()) return null;
  
  try {
    const chromeLocale = chrome.i18n.getUILanguage();
    return reverseChromeMapping[chromeLocale] ||
      (/^zh(?:[-_]|$)/i.test(chromeLocale) ? 'zh-cn' : 'en-us');
  } catch (error) {
    return null;
  }
}; 