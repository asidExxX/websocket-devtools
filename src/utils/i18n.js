/**
 * Smart hybrid i18n system - WebSocket DevTools
 * Supports Chrome official i18n API + custom manual language switching
 * Prioritizes Chrome API (better performance), uses custom system when manually switched
 */

// Import preloaded translations for synchronous initialization
import { translations as preloadedTranslations, supportedLanguages as preloadedSupportedLanguages, languageDisplayNames } from '../locales/index.js';
import I18nConverter from './i18n-converter.js';

class I18n {
  constructor() {
    this.currentLanguage = 'en-us'; // Set default immediately  
    this.translations = new Map();
    this.fallbackLanguage = 'en-us';
    this.supportedLanguages = preloadedSupportedLanguages;
    this.listeners = new Set();
    this.isInitialized = false;
    
    // Smart adapter pattern setup
    this.useChromeAPI = false; // Default false, switch to custom mode when user manually switches
    this.chromeSupported = this.detectChromeI18nSupport();
    this.keyMapping = null; // Chrome key to flat key mapping
    
    // Synchronously load preloaded translations  
    Object.entries(preloadedTranslations).forEach(([lang, data]) => {
      this.translations.set(lang, this.flattenTranslations(data));
    });
    
    // Async initialization
    this.initUserPreference();
    this.loadKeyMapping();
  }

  /**
   * Flatten nested translations object into dot notation
   */
  flattenTranslations(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(acc, this.flattenTranslations(obj[key], newKey));
      } else {
        acc[newKey] = obj[key];
      }
      return acc;
    }, {});
  }

  /**
   * Detect Chrome i18n API support
   */
  detectChromeI18nSupport() {
    try {
      return typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage;
    } catch (error) {
      return false;
    }
  }

  /**
   * Async load key mapping table
   */
  async loadKeyMapping() {
    try {
      if (this.chromeSupported) {
        // Try to load mapping table
        const response = await fetch(chrome.runtime.getURL('utils/i18n-key-mapping.json'));
        if (response.ok) {
          this.keyMapping = await response.json();
          // console.log('Key mapping loaded successfully'); // Debug log
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      // If chromeSupported is false, we don't need the mapping file, so no warning needed
    } catch (error) {
      // Only warn if Chrome is supported but loading failed
      // This is usually not critical as the system works without the mapping
      if (this.chromeSupported) {
        // Suppress the warning in development or when it's a known issue
        // console.warn('Key mapping file not accessible, using fallback (this is usually normal):', error.message);
        
        // Set keyMapping to null to indicate fallback mode
        this.keyMapping = null;
      }
    }
  }

  /**
   * Smart get translation - core adapter logic
   */
  smartGetMessage(key, params = {}) {
    // If Chrome API is enabled and supported, prioritize Chrome API
    if (this.useChromeAPI && this.chromeSupported) {
      try {
        const chromeKey = I18nConverter.flatKeyToChromeKey(key);
        const message = chrome.i18n.getMessage(chromeKey, Object.values(params));
        if (message) {
          return this.replaceParams(message, params);
        }
      } catch (error) {
        // Chrome API failed, fallback to custom system
      }
    }

    // Use custom system
    return this.getCustomMessage(key, params);
  }

  /**
   * Custom translation system
   */
  getCustomMessage(key, params = {}) {
    const translation = this.translations.get(this.currentLanguage)?.[key] ||
                        this.translations.get(this.fallbackLanguage)?.[key];
    if (translation === undefined) {
      return key; // Return key as fallback
    }
    return this.replaceParams(translation, params);
  }

  /**
   * Initialize user preference asynchronously (called from constructor)
   */
  async initUserPreference(preferBrowserLanguage = false) {
    try {
      // Check if there's a manually set language preference
      const savedLanguage = await this.getSavedLanguage();
      const supportedSavedLanguage = this.supportedLanguages.includes(savedLanguage)
        ? savedLanguage
        : /^zh(?:[-_]|$)/i.test(savedLanguage || '') ? 'zh-cn' : null;
      
      if (supportedSavedLanguage) {
        // Has manual setting, use custom system
        this.useChromeAPI = false;
        this.currentLanguage = supportedSavedLanguage;
      } else if (this.chromeSupported) {
        // No manual setting and Chrome API supported, prioritize Chrome API
        this.useChromeAPI = true;
        this.currentLanguage = this.mapChromeLocaleToFlat(chrome.i18n.getUILanguage());
      } else {
        // Detect browser language
        const preferredLanguage = await this.detectLanguage(preferBrowserLanguage);
        if (preferredLanguage !== this.currentLanguage) {
          await this.setLanguage(preferredLanguage);
        }
      }
      
      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = true;
    }
  }

  /**
   * Map Chrome locale to flat format
   */
  mapChromeLocaleToFlat(chromeLocale) {
    return /^zh(?:[-_]|$)/i.test(chromeLocale || '') ? 'zh-cn' : 'en-us';
  }

  /**
   * Legacy init method for backward compatibility
   */
  async init() {
    // This method is now a no-op since we initialize synchronously
    // Kept for backward compatibility
    return Promise.resolve();
  }

  /**
   * Detect the user's preferred language
   * Priority for panel: 1. Saved preference 2. Browser language 3. Fallback
   * Priority for popup: 1. Browser language 2. Saved preference 3. Fallback
   */
  async detectLanguage(preferBrowserLanguage = false) {
    try {
      if (preferBrowserLanguage) {
        // For popup: prioritize browser language
        const browserLang = this.getBrowserLanguage();
        if (browserLang && this.supportedLanguages.includes(browserLang)) {
          return browserLang;
        }

        // Check saved preference as fallback
        const saved = await this.getSavedLanguage();
        if (saved && this.supportedLanguages.includes(saved)) {
          return saved;
        }
      } else {
        // For panel: prioritize saved preference
        const saved = await this.getSavedLanguage();
        if (saved && this.supportedLanguages.includes(saved)) {
          return saved;
        }

        // Check browser language as fallback
        const browserLang = this.getBrowserLanguage();
        if (browserLang && this.supportedLanguages.includes(browserLang)) {
          return browserLang;
        }
      }

      // Return fallback
      return this.fallbackLanguage;
    } catch (error) {
      return this.fallbackLanguage;
    }
  }

  /**
   * Get browser language preference
   */
  getBrowserLanguage() {
    try {
      const lang = navigator.language || navigator.userLanguage;
      if (!lang) return null;

      // Normalize language code (e.g., 'en-US' -> 'en-us', 'zh-CN' -> 'zh-cn')
      const normalized = lang.toLowerCase();
      
      // Check for exact match
      if (this.supportedLanguages.includes(normalized)) {
        return normalized;
      }

      // Check for language family match (e.g., 'en-gb' -> 'en-us')
      const family = normalized.split('-')[0];
      const familyMatch = this.supportedLanguages.find(lang => 
        lang.startsWith(family + '-')
      );
      
      return familyMatch || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get saved language preference from storage
   */
  async getSavedLanguage() {
    try {
      // Use chrome.storage.local for persistent storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['ws_inspector_language']);
        return result.ws_inspector_language || null;
      }

      // Fallback to localStorage for testing
      return localStorage.getItem('ws_inspector_language');
    } catch (error) {
      return null;
    }
  }

  /**
   * Save language preference to storage
   */
  async saveLanguage(language) {
    try {
      // Use chrome.storage.local for persistent storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ ws_inspector_language: language });
      } else {
        // Fallback to localStorage for testing
        localStorage.setItem('ws_inspector_language', language);
      }
    } catch (error) {
    }
  }

  /**
   * Load translation data for a language (now returns preloaded data)
   */
  async loadTranslations(language) {
    if (this.translations.has(language)) {
      return this.translations.get(language);
    }

    // If language is not preloaded, fall back to the default language
    if (language !== this.fallbackLanguage) {
      return this.translations.get(this.fallbackLanguage) || {};
    }

    return {};
  }

  /**
   * Set the current language and load its translations - supports manual switching
   */
  async setLanguage(language) {
    if (!this.supportedLanguages.includes(language)) {
      language = this.fallbackLanguage;
    }

    // When manually switching language, force use of custom system
    const wasUsingChromeAPI = this.useChromeAPI;
    this.useChromeAPI = false;

    // Load translations for the language
    await this.loadTranslations(language);
    
    // Update current language
    const oldLanguage = this.currentLanguage;
    this.currentLanguage = language;

    // Save preference - mark as manually set
    await this.saveLanguage(language);

    // Log mode switch
    if (wasUsingChromeAPI) {
      console.log(`🔄 Language switch: from Chrome API mode to custom mode (${language})`);
    }

    // Notify listeners
    if (oldLanguage !== language) {
      this.notifyLanguageChange(language, oldLanguage);
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage || this.fallbackLanguage;
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }

  /**
   * Translate a key to the current language - smart adapter entry point
   */
  t(key, params = {}) {
    return this.smartGetMessage(key, params);
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
  }

  /**
   * Replace parameters in translation string
   */
  replaceParams(translation, params) {
    if (typeof translation !== 'string' || Object.keys(params).length === 0) {
      return translation;
    }

    return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Add listener for language changes
   */
  addLanguageChangeListener(listener) {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of language change
   */
  notifyLanguageChange(newLanguage, oldLanguage) {
    this.listeners.forEach(listener => {
      try {
        listener(newLanguage, oldLanguage);
      } catch (error) {
      }
    });
  }

  /**
   * Get language display name
   */
  getLanguageDisplayName(language) {
    return languageDisplayNames[language] || language;
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language) {
    return this.supportedLanguages.includes(language);
  }

  /**
   * Get translation data for debugging
   */
  getTranslationData(language = null) {
    const lang = language || this.getCurrentLanguage();
    return this.translations.get(lang) || {};
  }

  /**
   * Reload translations for current language
   */
  async reloadTranslations() {
    const language = this.getCurrentLanguage();
    this.translations.delete(language);
    await this.loadTranslations(language);
    this.notifyLanguageChange(language, language);
  }

  /**
   * Force browser language detection and set it as current language
   * Used for popup to always follow browser language
   */
  async forceBrowserLanguage() {
    try {
      const browserLang = this.getBrowserLanguage();
      
      if (browserLang && this.supportedLanguages.includes(browserLang)) {
        if (browserLang !== this.currentLanguage) {
          const oldLanguage = this.currentLanguage;
          this.currentLanguage = browserLang;
          this.notifyLanguageChange(browserLang, oldLanguage);
        }
        return browserLang;
      }
      
      // If browser language not supported, keep current language
      return this.currentLanguage;
    } catch (error) {
      return this.currentLanguage;
    }
  }

  /**
   * Initialize for panel with saved preference priority
   * This will use saved preference if available, otherwise browser language
   */
  async initForPanel() {
    return this.initUserPreference(false);
  }

  /**
   * Initialize for popup with browser language priority
   * This will use browser language if available, otherwise saved preference
   */
  async initForPopup() {
    return this.initUserPreference(true);
  }
}

// Create and export singleton instance
const i18n = new I18n();

// Export commonly used functions for convenience
export const t = (key, params) => i18n.t(key, params);
export const setLanguage = (language) => i18n.setLanguage(language);
export const getCurrentLanguage = () => i18n.getCurrentLanguage();
export const getSupportedLanguages = () => i18n.getSupportedLanguages();
export const getLanguageDisplayName = (language) => i18n.getLanguageDisplayName(language);
export const addLanguageChangeListener = (listener) => i18n.addLanguageChangeListener(listener);
export const forceBrowserLanguage = () => i18n.forceBrowserLanguage();
export const initForPanel = () => i18n.initForPanel();
export const initForPopup = () => i18n.initForPopup();

// Export the main instance
export default i18n; 