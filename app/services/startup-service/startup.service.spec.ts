import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { StartupService } from './startup.service';
import { LANGUAGE_STORAGE_KEY } from 'util/i18n.constants';

describe('StartupService', () => {
  let service: StartupService;
  let translate: TranslateService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StartupService);
    translate = TestBed.inject(TranslateService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    document.body.innerHTML = '';
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('shows an error notice and rejects when the bootstrap config fetch fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    global.fetch = jest.fn().mockRejectedValue(new TypeError('network error'));

    await expect(service.initApp()).rejects.toThrow('network error');
    expect(document.body.textContent).toContain('KomMonitor konnte nicht gestartet werden');
  });

  it('falls back to the local env_backup.js when the remote app config script fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const scriptsBefore = document.head.querySelectorAll('script').length;

    const loadPromise: Promise<void> = (service as any).loadAppConfigScript(
      'http://config-server/env.js'
    );
    const remoteScript = document.head.querySelectorAll('script')[scriptsBefore];
    expect(remoteScript.getAttribute('src')).toBe('http://config-server/env.js');
    remoteScript.dispatchEvent(new Event('error'));
    await Promise.resolve();

    const fallbackScript = document.head.querySelectorAll('script')[scriptsBefore + 1];
    expect(fallbackScript.getAttribute('src')).toBe('./config/env_backup.js');
    fallbackScript.dispatchEvent(new Event('load'));
    await expect(loadPromise).resolves.toBeUndefined();
  });

  it('shows an error notice and rejects when the bootstrap config returns a non-ok status', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(service.initApp()).rejects.toThrow('Unexpected HTTP status 404');
    expect(document.body.textContent).toContain('KomMonitor konnte nicht gestartet werden');
  });

  describe('loadTranslations', () => {
    // Guards the reason this step exists: translate.instant() must never return
    // a raw key, so the bundle has to be awaited before the app renders.
    const loadTranslations = (): Promise<void> => (service as any).loadTranslations();

    it('activates the default language and awaits its bundle', async () => {
      const use = jest.spyOn(translate, 'use');
      const setDefaultLang = jest.spyOn(translate, 'setDefaultLang');

      await loadTranslations();

      expect(setDefaultLang).toHaveBeenCalledWith('de');
      expect(use).toHaveBeenCalledWith('de');
      expect(translate.currentLang).toBe('de');
    });

    it('activates a stored language preference', async () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

      await loadTranslations();

      expect(translate.currentLang).toBe('en');
      // 'de' stays the fallback for the empty regional-variant bundles
      expect(translate.defaultLang).toBe('de');
    });

    it('ignores an unsupported stored preference', async () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'klingon');

      await loadTranslations();

      expect(translate.currentLang).toBe('de');
    });

    it('does not reject when the bundle fails to load', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      jest.spyOn(translate, 'use').mockImplementation(() => {
        throw new Error('bundle missing');
      });

      await expect(loadTranslations()).resolves.toBeUndefined();
    });
  });
});
