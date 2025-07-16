import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css']
})
export class LanguageSwitcherComponent implements OnInit {
  
  currentLanguage: string = 'de';
  supportedLanguages = [
    { code: 'de', name: 'Deutsch' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ];

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    // Get current language from service
    this.currentLanguage = this.translateService.currentLang || 'de';
    
    // Set default language if none is set
    if (!this.translateService.currentLang) {
      this.translateService.setDefaultLang('de');
      this.translateService.use('de');
    }
  }

  changeLanguage(languageCode: string): void {
    this.currentLanguage = languageCode;
    this.translateService.use(languageCode);
    
    // Store language preference in localStorage
    localStorage.setItem('preferredLanguage', languageCode);
  }

  getCurrentLanguageName(): string {
    const lang = this.supportedLanguages.find(l => l.code === this.currentLanguage);
    return lang ? lang.name : 'Deutsch';
  }

  getCurrentLanguageFlag(): string {
    const lang = this.supportedLanguages.find(l => l.code === this.currentLanguage);
    return lang ? lang.name : 'Deutsch';
  }
} 