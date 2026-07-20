import { Injectable, inject } from '@angular/core';
import Keycloak, { KeycloakLoginOptions, KeycloakTokenParsed } from 'keycloak-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationService } from '../../components/ngComponents/common/notification/notification.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

const ADMIN_ROLE_SUFFIXES = ['-creator', '-publisher', '-editor'] as const;
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private notificationSrvc = inject(NotificationService);
  private envConfigService = inject(EnvConfigService);

  private auth: Keycloak | undefined;

  private readonly _tokenExpirationMs$ = new BehaviorSubject<number>(30 * 60 * 1000);
  readonly tokenExpirationMs$: Observable<number> = this._tokenExpirationMs$.asObservable();

  async initKeycloak(): Promise<void> {
    if (this.envConfigService.enableKeycloakSecurity) {
      const keycloakAdapter = new Keycloak(
        this.envConfigService.configStorageServerConfig
          .targetUrlToConfigStorageServer_keycloakConfig
      );

      // https://www.keycloak.org/docs/latest/securing_apps/#session-status-iframe
      // https://www.keycloak.org/docs/latest/securing_apps/#_modern_browsers
      return await keycloakAdapter
        .init({
          onLoad: 'check-sso',
          checkLoginIframe: false,
          silentCheckSsoFallback: false,
        })
        .then((authenticated) => {
          console.log(authenticated ? 'User is authenticated!' : 'User is not authenticated!');
          this.auth = keycloakAdapter;
          this.startCheckSessionExpiration();
        })
        .catch(() => {
          console.log(
            'Failed to initialize authentication adapter. Will try to bootstrap application without keycloak security'
          );
          this.notificationSrvc.showError(
            'Die Keycloak-Authentifizierung konnte nicht initialisiert werden. Die Anwendung wird ohne Keycloak-Sicherheit gestartet.',
            { autohide: false }
          );
        });
    }
  }

  hasAdminRights(): boolean {
    if (!this.auth) {
      return false;
    }
    const tokenParsed = this.getTokenParsed();
    return !!(
      tokenParsed &&
      tokenParsed.realm_access &&
      tokenParsed.realm_access.roles &&
      tokenParsed.realm_access.roles.some((role) =>
        ADMIN_ROLE_SUFFIXES.some((suffix) => role.endsWith(suffix))
      )
    );
  }

  public isAuthenticated(): boolean {
    return this.auth?.authenticated ?? false;
  }

  public getToken(): string | undefined {
    return this.auth?.token;
  }

  public getTokenParsed(): KeycloakTokenParsed | undefined {
    return this.auth?.tokenParsed;
  }

  public login(options?: KeycloakLoginOptions) {
    this.auth?.login(options);
  }

  public logout() {
    this.auth?.logout();
  }

  public loadUserProfile() {
    return this.auth?.loadUserProfile();
  }

  private startCheckSessionExpiration() {
    const intervalId = setInterval(() => {
      if (!this.auth) {
        return;
      }
      // milliseconds until current browser session invalidates
      // use refresh token as this is used when calling "updateToken" keycloak method. Only if that is invalid the whole session is invalid
      const expSeconds =
        (this.auth.refreshTokenParsed?.exp ?? 0) +
        (this.auth.timeSkew ?? 0) -
        new Date().getTime() / 1000;
      let ms = Math.round(expSeconds * 1000);
      if (!ms) {
        ms = 30 * 60 * 1000;
      }

      // if session is expired then show warning to User!
      if (ms < 0) {
        ms = 0;
        clearInterval(intervalId);
        this.notificationSrvc.showError(
          'Ihre aktuelle Login-Session ist abgelaufen. Sie müssen sich neu einloggen. Nutzen Sie dazu das User-Menü oben rechts.',
          {
            autohide: false,
          }
        );
      }
      this._tokenExpirationMs$.next(ms);
    }, 1000 * 60);
  }
}
