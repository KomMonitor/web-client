import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

declare const $: any;

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css']
})
export class LanguageSwitcherComponent implements OnInit, OnDestroy, AfterViewInit {
  
  currentLanguage: string = 'de';
  supportedLanguages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'de-at', name: 'Deutsch (Österreich)', flag: '🇦🇹' },
    { code: 'de-li', name: 'Deutsch (Liechtenstein)', flag: '🇱🇮' },
    { code: 'de-lu', name: 'Deutsch (Luxemburg)', flag: '🇱🇺' },
    { code: 'de-ch', name: 'Deutsch (Schweiz)', flag: '🇨🇭' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  private languageChangeSubscription: Subscription | undefined;

  constructor(public translateService: TranslateService) {}

  ngOnInit(): void {
    // Get current language from service
    this.currentLanguage = this.translateService.currentLang || 'de';
    
    // Set default language if none is set
    if (!this.translateService.currentLang) {
      this.translateService.setDefaultLang('de');
      this.translateService.use('de');
    }

    // Subscribe to language changes to update the component state
    this.languageChangeSubscription = this.translateService.onLangChange.subscribe((event) => {
      this.currentLanguage = event.lang;
      console.log('Language changed to:', event.lang);
    });

    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && ['de', 'de-at', 'de-li', 'de-lu', 'de-ch', 'en'].includes(savedLanguage) && savedLanguage !== this.currentLanguage) {
      this.changeLanguage(savedLanguage);
    }

    // Test translation service
    this.testTranslationService();
  }

  ngAfterViewInit(): void {
    // Initialize Bootstrap dropdown
    if (typeof $ !== 'undefined') {
      $('#languageDropdown').dropdown();
    }
  }

  ngOnDestroy(): void {
    if (this.languageChangeSubscription) {
      this.languageChangeSubscription.unsubscribe();
    }
  }

  changeLanguage(languageCode: string): void {
    try {
      console.log('Changing language to:', languageCode);
      
      this.currentLanguage = languageCode;
      this.translateService.use(languageCode);
      
      // Store language preference in localStorage
      localStorage.setItem('preferredLanguage', languageCode);
      
      // Close dropdown after selection
      if (typeof $ !== 'undefined') {
        $('#languageDropdown').dropdown('hide');
      }
      
      console.log('Language changed successfully to:', languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }

  getCurrentLanguageName(): string {
    const lang = this.supportedLanguages.find(l => l.code === this.currentLanguage);
    return lang ? lang.name : 'Deutsch';
  }

  getCurrentLanguageFlag(): string {
    const lang = this.supportedLanguages.find(l => l.code === this.currentLanguage);
    return lang ? lang.flag : '🇩🇪';
  }

  private testTranslationService(): void {
    // Test if translation service is working
    setTimeout(() => {
      const testKey = 'COMMON.LOGIN';
      const translation = this.translateService.instant(testKey);
      console.log(`Translation test for "${testKey}":`, translation);
      
      if (translation === testKey) {
        console.warn('Translation service might not be working properly - key returned as-is');
      } else {
        console.log('Translation service is working correctly');
      }
    }, 1000);
  }
} 