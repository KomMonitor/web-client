import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { LanguageService, Language } from 'services/language-service/language.service';

@Component({
  selector: 'app-language-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-dropdown.component.html',
  styleUrls: ['./language-dropdown.component.css']
})
export class LanguageDropdownComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  availableLanguages: Language[] = [];
  currentLanguage: Language | null = null;
  isDropdownOpen = false;

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    this.availableLanguages = this.languageService.availableLanguages;
    
    // Subscribe to language changes
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(languageCode => {
        this.currentLanguage = this.languageService.getCurrentLanguageObject();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Close dropdown
   */
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  /**
   * Select a language
   */
  selectLanguage(language: Language): void {
    if (language.code !== this.currentLanguage?.code) {
      this.languageService.setLanguage(language.code);
    }
    this.closeDropdown();
  }

  /**
   * Handle click outside dropdown
   */
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.language-dropdown');
    
    if (dropdown && !dropdown.contains(target)) {
      this.closeDropdown();
    }
  }
} 