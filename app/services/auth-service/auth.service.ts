import { Injectable } from "@angular/core";
import Keycloak from "keycloak-js";
import { BehaviorSubject, Observable } from "rxjs";
import { NotificationService } from "../../components/ngComponents/common/notification/notification.service";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  // TODO: private machen
  // Auth: {
  //   keycloak: Keycloak.KeycloakInstance;
  // } | undefined;
  Auth;

  private readonly _tokenExpirationMs$ = new BehaviorSubject<number>(
    30 * 60 * 1000,
  );
  readonly tokenExpirationMs$: Observable<number> =
    this._tokenExpirationMs$.asObservable();

  constructor(private notificationSrvc: NotificationService) {}

  init(auth) {

    this.Auth = auth;
    /*   let auth = {
      keycloak: {}
    };

    if (window.__env.enableKeycloakSecurity) {
      var keycloakAdapter = new Keycloak(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig);

      // https://www.keycloak.org/docs/latest/securing_apps/#session-status-iframe
      // https://www.keycloak.org/docs/latest/securing_apps/#_modern_browsers

      keycloakAdapter.init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
        silentCheckSsoFallback: false
      }).then( (authenticated) => {
        console.log(authenticated ? 'User is authenticated!' : 'User is not authenticated!');
        auth.keycloak = keycloakAdapter;
        
        this.newAuth = auth;
        console.log(this.newAuth);
        try {
          console.debug('Trying to bootstrap application.');
        }
        catch (e) {
          console.error('Application bootstrapping failed.');
          console.error(e);
        }
      }).catch(function () {
        console.log('Failed to initialize authentication adapter. Will try to bootstrap application without keycloak security');
        alert('Failed to initialize keycloak authentication adapter. Will try to bootstrap application without keycloak securi+ty');
      });
    } */

    this.startCheckSessionExpiration();
  }

  private startCheckSessionExpiration() {
    const intervalId = setInterval(() => {
      // milliseconds until current browser session invalidates
      // use refresh token as this is used when calling "updateToken" keycloak method. Only if that is invalid the whole session is invalid
      const expSeconds =
        this.Auth.keycloak.refreshTokenParsed.exp +
        this.Auth.keycloak.timeSkew -
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
          "Ihre aktuelle Login-Session ist abgelaufen. Sie müssen sich neu einloggen. Nutzen Sie dazu das User-Menü oben rechts.",
          {
            autohide: false,
          },
        );
      }
      this._tokenExpirationMs$.next(ms);
    }, 1000 * 60);
  }
}
