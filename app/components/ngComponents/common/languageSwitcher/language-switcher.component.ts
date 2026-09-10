import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import {
  DEFAULT_LANGUAGE_CODE,
  LANGUAGE_STORAGE_KEY,
  SupportedLanguageCode,
} from 'util/i18n.constants';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss'],
})
export class LanguageSwitcherComponent implements OnInit, OnDestroy {
  currentLanguage: string = DEFAULT_LANGUAGE_CODE;

  /**
   * The languages offered in the dropdown. Typed against
   * `SupportedLanguageCode` so this display list and the codes the startup
   * accepts from localStorage cannot drift apart unnoticed.
   */
  supportedLanguages: Array<{ code: SupportedLanguageCode; name: string; flag: string }> = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'de-at', name: 'Deutsch (Österreich)', flag: '🇦🇹' },
    { code: 'de-li', name: 'Deutsch (Liechtenstein)', flag: '🇱🇮' },
    { code: 'de-lu', name: 'Deutsch (Luxemburg)', flag: '🇱🇺' },
    { code: 'de-ch', name: 'Deutsch (Schweiz)', flag: '🇨🇭' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  private languageChangeSubscription: Subscription | undefined;

  translateService = inject(TranslateService);

  ngOnInit(): void {
    // StartupService resolved the stored preference and awaited its bundle
    // before the app rendered; this component only reflects and changes it.
    this.currentLanguage = this.translateService.currentLang || DEFAULT_LANGUAGE_CODE;

    this.languageChangeSubscription = this.translateService.onLangChange.subscribe((event) => {
      this.currentLanguage = event.lang;
    });
  }

  ngOnDestroy(): void {
    if (this.languageChangeSubscription) {
      this.languageChangeSubscription.unsubscribe();
    }
  }

  changeLanguage(languageCode: string): void {
    try {
      this.currentLanguage = languageCode;
      this.translateService.use(languageCode);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      // The dropdown opens and closes through Bootstrap's own data API
      // (`data-bs-toggle="dropdown"` on the trigger), which also closes the
      // menu on a click inside it — no explicit hide needed here.
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }

  getCurrentLanguageName(): string {
    const lang = this.supportedLanguages.find((l) => l.code === this.currentLanguage);
    return lang ? lang.name : 'Deutsch';
  }

  getCurrentLanguageFlag(): string {
    const lang = this.supportedLanguages.find((l) => l.code === this.currentLanguage);
    return lang ? lang.flag : '🇩🇪';
  }
}
