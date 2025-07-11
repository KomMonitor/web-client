import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'kommonitor-language';
  private readonly DEFAULT_LANGUAGE = 'de';

  // Available languages
  public readonly availableLanguages: Language[] = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  // Current language state
  private currentLanguageSubject = new BehaviorSubject<string>(this.getInitialLanguage());
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor() {
    // Initialize language from localStorage or default
    const savedLanguage = this.getStoredLanguage();
    if (savedLanguage && this.isValidLanguage(savedLanguage)) {
      this.currentLanguageSubject.next(savedLanguage);
    }
  }

  /**
   * Get the current language code
   */
  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  /**
   * Get the current language object
   */
  getCurrentLanguageObject(): Language {
    const currentCode = this.getCurrentLanguage();
    return this.availableLanguages.find(lang => lang.code === currentCode) || this.availableLanguages[0];
  }

  /**
   * Set the current language
   */
  setLanguage(languageCode: string): void {
    if (!this.isValidLanguage(languageCode)) {
      console.warn(`Invalid language code: ${languageCode}`);
      return;
    }

    // Store in localStorage
    localStorage.setItem(this.STORAGE_KEY, languageCode);
    
    // Update current language
    this.currentLanguageSubject.next(languageCode);

    // For Angular i18n, we need to reload the application with the new locale
    this.reloadWithLocale(languageCode);
  }

  /**
   * Get initial language from various sources
   */
  private getInitialLanguage(): string {
    // 1. Check localStorage
    const stored = this.getStoredLanguage();
    if (stored && this.isValidLanguage(stored)) {
      return stored;
    }

    // 2. Check URL path
    const urlLanguage = this.getLanguageFromUrl();
    if (urlLanguage && this.isValidLanguage(urlLanguage)) {
      return urlLanguage;
    }

    // 3. Check browser language
    const browserLanguage = this.getBrowserLanguage();
    if (browserLanguage && this.isValidLanguage(browserLanguage)) {
      return browserLanguage;
    }

    // 4. Default language
    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Get language from localStorage
   */
  private getStoredLanguage(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Could not access localStorage:', error);
      return null;
    }
  }

  /**
   * Get language from URL path
   */
  private getLanguageFromUrl(): string | null {
    const path = window.location.pathname;
    const match = path.match(/^\/([a-z]{2})\//);
    return match ? match[1] : null;
  }

  /**
   * Get browser's preferred language
   */
  private getBrowserLanguage(): string | null {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    return browserLang ? browserLang.split('-')[0] : null;
  }

  /**
   * Check if language code is valid
   */
  private isValidLanguage(code: string): boolean {
    return this.availableLanguages.some(lang => lang.code === code);
  }

  /**
   * Reload the application with the specified locale
   */
  private reloadWithLocale(locale: string): void {
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const currentHash = window.location.hash;

    // Remove existing locale from path
    const cleanPath = currentPath.replace(/^\/[a-z]{2}\//, '/');
    
    // Build new URL with locale
    const newUrl = `${baseUrl}/${locale}${cleanPath}${currentSearch}${currentHash}`;
    
    // Reload to new URL
    window.location.href = newUrl;
  }

  /**
   * Get language name by code
   */
  getLanguageName(code: string): string {
    const language = this.availableLanguages.find(lang => lang.code === code);
    return language ? language.name : code;
  }

  /**
   * Get language flag by code
   */
  getLanguageFlag(code: string): string {
    const language = this.availableLanguages.find(lang => lang.code === code);
    return language ? language.flag : '🌐';
  }
} 