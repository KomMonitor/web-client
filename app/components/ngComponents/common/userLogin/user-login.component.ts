import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  Renderer2,
  ViewChild,
  DOCUMENT,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'services/auth-service/auth.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { NgbCollapseModule, NgbPopover, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { SessionValidityComponent } from './session-validity/session-validity.component';
import { BehaviorSubject, Subject, combineLatest, of, timer } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { EnvConfigService } from '../../../../services/env-config-service/env-config.service';
import { TranslateModule } from '@ngx-translate/core';

interface UserRoleInformation {
  [key: string]: string[];
}

interface KeycloakUser {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.scss'],
  imports: [
    CommonModule,
    NgbCollapseModule,
    NgbPopoverModule,
    SessionValidityComponent,
    TranslateModule,
  ],
  standalone: true,
})
export class UserLoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private accessControlService = inject(AccessControlService);
  private router = inject(Router);
  private renderer = inject(Renderer2);
  protected envConfigService = inject(EnvConfigService);
  private document = inject<Document>(DOCUMENT);

  @ViewChild('userLoginPopover') popover!: NgbPopover;

  private isOverAnchor$ = new BehaviorSubject<boolean>(false);
  private isOverPopover$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  private popoverEnterUnlisten?: () => void;
  private popoverLeaveUnlisten?: () => void;

  currentKeycloakUser: KeycloakUser = {};
  userRoleInformation: UserRoleInformation = {};
  userGroupInformation: string[][] = [];

  isUserLoginRolesCollapse = true;
  isUserLoginGroupesCollapse = true;

  // Check if we're in admin context by looking at the current URL
  get isAdminView(): boolean {
    return this.router.url.includes('/administration') || this.router.url.includes('/admin');
  }

  // Read directly from the (startup-populated, stable) config rather than caching
  // it in a field that is set late from an async broadcast handler. The cached
  // field changed value between change-detection passes and caused NG0100 on the
  // [disablePopover] binding once app-wide ticks were triggered by signals.
  get enableKeycloakSecurity(): boolean {
    return this.envConfigService.enableKeycloakSecurity;
  }

  // Read live from AuthService: Keycloak is initialised by the app initializer
  // before anything renders, so the login state is known from the start. It
  // used to be cached in a field that was only set on metadata-loading
  // COMPLETE, which showed the logged-out popover while the metadata loaded,
  // and for good when this component was created after the load had finished.
  get authenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    // The token carries the basic profile, so the user is shown right away;
    // the profile loaded by the metadata fetch replaces it once available.
    this.currentKeycloakUser = this.userFromToken();

    // React to every COMPLETE, including the replayed current one: switching
    // from the map application to /administration does not refetch the
    // metadata, so the replayed value is the only COMPLETE this component ever
    // sees. A later reload (e.g. a re-applied filter) just refreshes the
    // profile and roles.
    this.metadataBootstrap.metadataLoading$
      .pipe(
        filter((state) => state === MetadataLoadingState.COMPLETE),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyLoadedUserProfile();
        this.prepUserInformation();
      });

    combineLatest([this.isOverAnchor$, this.isOverPopover$])
      .pipe(
        map(([anchor, pop]) => anchor || pop),
        distinctUntilChanged(),
        switchMap((isHovered) => (isHovered ? of(true) : timer(200).pipe(map(() => false)))),
        takeUntil(this.destroy$)
      )
      .subscribe((isHovered) => {
        if (!isHovered && this.popover?.isOpen()) {
          this.popover.close();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.popoverEnterUnlisten?.();
    this.popoverLeaveUnlisten?.();
  }

  applyLoadedUserProfile(): void {
    // Deliberately does NOT clear accessControlService.currentKeycloakLoginRoles.
    // The AngularJS original reset them in its checkAuthentication() because that
    // ran *before* fetchAllMetadata() repopulated them; this component instead
    // runs on metadata-loading COMPLETE, so the reset would wipe the roles the
    // fetch has just applied and leave every check*Permission() false for the
    // rest of the session. The service resets its own state via
    // applyLoginStateFromToken().
    // The profile stays unset when loading it failed; keep the token's then.
    if (this.authenticated && this.metadataBootstrap.currentKeycloakUser) {
      this.currentKeycloakUser = this.metadataBootstrap.currentKeycloakUser;
    }
  }

  private userFromToken(): KeycloakUser {
    const token = this.authService.getTokenParsed();
    return {
      username: token?.['preferred_username'],
      firstName: token?.['given_name'],
      lastName: token?.['family_name'],
      email: token?.['email'],
    };
  }

  prepUserInformation(): void {
    this.userRoleInformation = {};
    this.userGroupInformation = [];
    if (this.accessControlService.currentKomMonitorLoginRoleNames?.length > 0) {
      this.accessControlService.currentKomMonitorLoginRoleNames.forEach((roleName: string) => {
        // Organization roles read "<organization>.<permission>". Split at the
        // last dot: organization names may contain dots, permissions never do.
        // The global admin role has no organization and is listed on its own.
        const separator = roleName.lastIndexOf('.');
        const key = separator === -1 ? roleName : roleName.slice(0, separator);

        if (!Object.prototype.hasOwnProperty.call(this.userRoleInformation, key)) {
          this.userRoleInformation[key] = [];
        }

        if (separator !== -1) {
          this.userRoleInformation[key].push(roleName.slice(separator + 1));
        }
      });
    }

    if (this.accessControlService.currentKeycloakLoginGroups?.length > 0) {
      this.accessControlService.currentKeycloakLoginGroups.forEach(
        (group: string, index: number) => {
          const parts = group.split('/');
          this.userGroupInformation[index] = [];

          parts.forEach((part) => {
            if (part.length > 0) {
              this.userGroupInformation[index].push(part);
            }
          });
        }
      );
    }
  }

  tryLoginUser(): void {
    // The login UI is only reachable with Keycloak security enabled (the popover
    // is disabled otherwise), so delegate straight to the Keycloak login flow.
    this.authService.login();
  }

  tryLogoutUser(): void {
    this.authService.logout();
  }

  extendKeycloakSession(): void {
    // Auth.keycloak.updateToken(5).then(function () {
    //   console.log("keycloak token refreshed.");
    // }).catch(function () {
    //   console.error('Failed to refresh token. Will redirect to Login screen');
    //   Auth.keycloak.login();
    // });
    this.authService.login();
  }

  onAnchorEnter(): void {
    this.isOverAnchor$.next(true);
    if (!this.popover?.isOpen()) {
      this.popover.open();
    }
  }

  onAnchorLeave(): void {
    this.isOverAnchor$.next(false);
  }

  onPopoverShown(): void {
    this.popoverEnterUnlisten?.();
    this.popoverLeaveUnlisten?.();
    const popoverEl = this.document.querySelector('.user-login-popover');
    if (popoverEl) {
      this.popoverEnterUnlisten = this.renderer.listen(popoverEl, 'mouseenter', () =>
        this.isOverPopover$.next(true)
      );
      this.popoverLeaveUnlisten = this.renderer.listen(popoverEl, 'mouseleave', () =>
        this.isOverPopover$.next(false)
      );
    }
  }

  onPopoverHidden(): void {
    this.popoverEnterUnlisten?.();
    this.popoverLeaveUnlisten?.();
    this.isOverPopover$.next(false);
  }
}
