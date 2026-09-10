import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from 'services/auth-service/auth.service';
import { KeycloakHelperService } from 'services/keycloak-helper-service/keycloak-helper.service';
import { DEFAULT_LANGUAGE_CODE, resolvePreferredLanguage } from 'util/i18n.constants';

@Injectable({
  providedIn: 'root',
})
export class StartupService {
  private authService = inject(AuthService);
  private keycloakHelperService = inject(KeycloakHelperService);
  private translate = inject(TranslateService);

  async initApp(): Promise<void> {
    console.log('start loading required config files');
    await this.loadAllConfigs();
    await this.loadTranslations();
    await this.authService.initKeycloak();

    if (this.authService.isAuthenticated()) {
      // Intentionally non-blocking: role loading must not hold up app start.
      // Handle the rejection here so init()'s throw does not surface as an
      // unhandled promise rejection.
      this.keycloakHelperService.init().catch((error) => {
        console.error('KeycloakHelperService initialization failed; continuing startup.', error);
      });
    }
  }

  /**
   * Resolve the active language and await its bundle before the app renders.
   *
   * This has to happen here rather than in the language switcher: that component
   * only exists in the user-interface shell, so a direct entry to
   * /administration would never trigger a load. Code that resolves strings
   * synchronously via `translate.instant()` — the AG Grid column headers in the
   * admin area, for one — would then render raw keys.
   */
  private async loadTranslations(): Promise<void> {
    const language = resolvePreferredLanguage();
    this.translate.setDefaultLang(DEFAULT_LANGUAGE_CODE);

    try {
      await firstValueFrom(this.translate.use(language));
    } catch (error) {
      // Best-effort, like the other config steps: a missing bundle must not
      // block app start. Strings then fall back to their keys.
      console.error(`Could not load the "${language}" translation bundle.`, error);
    }
  }

  private async loadAllConfigs(): Promise<void> {
    let configStorageServerConfig;
    try {
      const response = await fetch('./config/config-storage-server.json');
      if (!response.ok) {
        throw new Error(`Unexpected HTTP status ${response.status}`);
      }
      configStorageServerConfig = await response.json();
    } catch (error) {
      console.error(
        'Failed to load ./config/config-storage-server.json — the client cannot start without it.',
        error
      );
      this.showStartupErrorPage();
      throw error;
    }
    window.__env = window.__env || {};
    window.__env.configStorageServerConfig = configStorageServerConfig;

    console.log('dynamically load env.js');
    await Promise.allSettled([
      this.loadAppConfigScript(configStorageServerConfig.targetUrlToConfigStorageServer_appConfig),
      this.fetchJsonConfig(
        configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig,
        'keycloakConfig'
      ),
      this.fetchJsonConfig(
        configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig,
        'controlsConfig'
      ),
      this.fetchJsonConfig(
        configStorageServerConfig.targetUrlToConfigStorageServer_filterConfig,
        'filterConfig'
      ),
    ]);

    console.log('all configs have been loaded');
    this.initEnvVariables();
  }

  private async fetchJsonConfig(url: string, envKey: string): Promise<void> {
    try {
      const response = await fetch(url);
      window.__env[envKey] = await response.json();
      console.log(`${envKey} config file fetched`);
    } catch {
      // No local fallback exists for these configs; consumers must handle the
      // missing key (KeycloakHelperService e.g. falls back to keycloak_backup.json).
      console.warn(`Could not fetch ${envKey} from server. The app continues without it.`);
    }
  }

  private async loadAppConfigScript(scriptUrl: string): Promise<void> {
    if (await this.appendScript(scriptUrl)) {
      console.log('env.js loaded');
      await this.fetchAppConfigSource(scriptUrl);
      return;
    }

    console.warn(
      'Error while loading app config from client config storage server. Falling back to local ./config/env_backup.js.'
    );
    if (await this.appendScript('./config/env_backup.js')) {
      console.log('env_backup.js loaded');
      await this.fetchAppConfigSource('./config/env_backup.js');
    } else {
      console.error(
        'Failed to load the local fallback app config (./config/env_backup.js). The app will start without an app config.'
      );
    }
  }

  /**
   * Keep the app config's source text around in `window.__env.appConfig`.
   *
   * The config is loaded by executing it as a script (above), which populates
   * `window.__env` but discards the source. The admin app-config editor edits
   * exactly that source, so it needs a copy — the deleted AngularJS app.js used
   * to fetch the same URL a second time for this. The browser serves it from
   * cache here, since the script tag just requested it.
   */
  private async fetchAppConfigSource(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Unexpected HTTP status ${response.status}`);
      }
      window.__env.appConfig = await response.text();
    } catch (error) {
      // Only the admin app-config editor consumes this; the app itself runs off
      // the values the script already set.
      console.warn(`Could not read the app config source text from ${url}.`, error);
    }
  }

  private appendScript(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  // Angular has not rendered anything yet while the app initializer is
  // pending, so plain DOM manipulation is the only way to inform the user.
  private showStartupErrorPage(): void {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;padding:1rem;">
        <div style="max-width:36rem;text-align:center;">
          <h1 style="font-size:1.4rem;margin-bottom:0.75rem;">KomMonitor konnte nicht gestartet werden</h1>
          <p style="color:#555;margin-bottom:1.25rem;">
            Die Basiskonfiguration (<code>config/config-storage-server.json</code>) konnte nicht geladen werden.
            Bitte laden Sie die Seite erneut. Besteht das Problem weiterhin, wenden Sie sich an die Administration.
          </p>
          <button id="startup-error-reload" type="button"
            style="padding:0.5rem 1.25rem;border:1px solid #ccc;border-radius:4px;background:#f5f5f5;cursor:pointer;">
            Seite neu laden
          </button>
        </div>
      </div>`;
    document
      .getElementById('startup-error-reload')
      ?.addEventListener('click', () => window.location.reload());
  }

  private initEnvVariables(): void {
    if (!window.__env?.enableDebug) {
      window.console.log = function () {
        /* debug logging disabled: replace console.log with a no-op */
      };
    }
  }
}
