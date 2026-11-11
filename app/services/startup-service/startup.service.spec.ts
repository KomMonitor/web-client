import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AuthService } from 'services/auth-service/auth.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { KeycloakHelperService } from 'services/keycloak-helper-service/keycloak-helper.service';

import { StartupService, withCacheBuster } from './startup.service';
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
    expect(remoteScript.getAttribute('src')).toMatch(/^http:\/\/config-server\/env\.js\?_=\d+$/);
    remoteScript.dispatchEvent(new Event('error'));
    await Promise.resolve();

    const fallbackScript = document.head.querySelectorAll('script')[scriptsBefore + 1];
    expect(fallbackScript.getAttribute('src')).toMatch(/^\.\/config\/env_backup\.js\?_=\d+$/);
    fallbackScript.dispatchEvent(new Event('load'));
    await expect(loadPromise).resolves.toBeUndefined();
  });

  // Regression: executing env.js as a script populates window.__env but drops the
  // source text. The admin app-config editor edits that source, and without it
  // the page rendered four empty panes.
  it('keeps the app config source text in window.__env.appConfig', async () => {
    window.__env = {};
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('window.__env.apiUrl = "https://example.org";'),
    } as unknown as Response);
    const scriptsBefore = document.head.querySelectorAll('script').length;

    const loadPromise: Promise<void> = (service as any).loadAppConfigScript(
      'http://config-server/env.js'
    );
    const script = document.head.querySelectorAll('script')[scriptsBefore];
    script.dispatchEvent(new Event('load'));
    await loadPromise;

    // Same URL as the script tag, so the browser answers from the copy it just loaded.
    expect(global.fetch).toHaveBeenCalledWith(script.getAttribute('src'));
    expect(window.__env.appConfig).toBe('window.__env.apiUrl = "https://example.org";');
  });

  it('shows an error notice and rejects when the bootstrap config returns a non-ok status', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(service.initApp()).rejects.toThrow('Unexpected HTTP status 404');
    expect(document.body.textContent).toContain('KomMonitor konnte nicht gestartet werden');
  });

  // The startup configs change at runtime (admin config editor), not with a
  // build, so a cached copy must never be used without asking the server.
  it('revalidates the bootstrap config and the JSON configs with the server', async () => {
    window.__env = {};
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as unknown as Response);

    await (service as any).fetchJsonConfig('http://config-server/filter', 'filterConfig');
    expect(global.fetch).toHaveBeenCalledWith('http://config-server/filter', { cache: 'no-cache' });

    jest.spyOn(service as any, 'loadAppConfigScript').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'initEnvVariables').mockImplementation(() => undefined);
    await (service as any).loadAllConfigs();
    expect(global.fetch).toHaveBeenCalledWith('./config/config-storage-server.json', {
      cache: 'no-cache',
    });
  });

  describe('withCacheBuster', () => {
    it('appends the parameter with ? or & as the URL requires', () => {
      expect(withCacheBuster('http://x/env.js', 42)).toBe('http://x/env.js?_=42');
      expect(withCacheBuster('http://x/config?name=app', 42)).toBe('http://x/config?name=app&_=42');
    });
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

// Regression: the login's roles used to be applied only by the metadata
// bootstrap, after it had loaded the user profile. On direct entry to
// /administration/groups the groups came from the cache first, so every row
// action was rendered disabled and the grid never re-checked.
describe('StartupService login state', () => {
  const ADMIN_ROLE = 'kommonitor-creator';
  let authenticated: boolean;
  let keycloakHelper: { init: jest.Mock };

  function setUp(): { service: StartupService; accessControl: AccessControlService } {
    keycloakHelper = { init: jest.fn(() => new Promise<void>(() => undefined)) };
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: AuthService,
          useValue: {
            initKeycloak: jest.fn().mockResolvedValue(undefined),
            isAuthenticated: () => authenticated,
            getTokenParsed: () => ({ realm_access: { roles: [ADMIN_ROLE, 'offline_access'] } }),
          },
        },
        { provide: KeycloakHelperService, useValue: keycloakHelper },
        { provide: EnvConfigService, useValue: { keycloakKomMonitorAdminRoleName: ADMIN_ROLE } },
      ],
    });
    const service = TestBed.inject(StartupService);
    // Configs and translations are covered above; here they only need to pass.
    jest.spyOn(service as any, 'loadAllConfigs').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'loadTranslations').mockResolvedValue(undefined);
    return { service, accessControl: TestBed.inject(AccessControlService) };
  }

  it('knows the roles once the app initializer is done, without waiting for role loading', async () => {
    authenticated = true;
    const { service, accessControl } = setUp();

    await service.initApp();

    // KeycloakHelperService.init() never settles here: the roles must not depend on it.
    expect(keycloakHelper.init).toHaveBeenCalled();
    expect(accessControl.currentKeycloakLoginRoles).toEqual([ADMIN_ROLE, 'offline_access']);
    expect(accessControl.checkAdminPermission()).toBe(true);
    expect(accessControl.isRealmAdmin).toBe(true);
  });

  it('leaves the login state empty for an anonymous visitor', async () => {
    authenticated = false;
    const { service, accessControl } = setUp();

    await service.initApp();

    expect(accessControl.currentKeycloakLoginRoles).toEqual([]);
    expect(accessControl.checkAdminPermission()).toBe(false);
    expect(keycloakHelper.init).not.toHaveBeenCalled();
  });
});
