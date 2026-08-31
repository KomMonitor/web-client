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
import { distinctUntilChanged, map, skip, switchMap, takeUntil } from 'rxjs/operators';
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

  authenticated = false;
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

  ngOnInit(): void {
    // React to metadata loading completion. skip(1) drops the BehaviorSubject's
    // replayed current value so this keeps the original one-shot semantics of
    // the former broadcast event.
    this.metadataBootstrap.metadataLoading$
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((state) => {
        if (state === MetadataLoadingState.COMPLETE) {
          this.checkAuthentication();
          this.prepUserInformation();
        }
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

  checkAuthentication(): void {
    // Deliberately does NOT clear accessControlService.currentKeycloakLoginRoles.
    // The AngularJS original reset them here because checkAuthentication() ran
    // *before* fetchAllMetadata() repopulated them; this component instead runs
    // on metadata-loading COMPLETE, so the reset would wipe the roles the fetch
    // has just applied and leave every check*Permission() false for the rest of
    // the session. The service resets its own state via applyLoginStateFromToken().
    this.authenticated = this.authService.isAuthenticated();
    if (this.authenticated) {
      this.currentKeycloakUser = this.metadataBootstrap.currentKeycloakUser;
    }
  }

  prepUserInformation(): void {
    this.userRoleInformation = {};
    this.userGroupInformation = [];
    if (this.accessControlService.currentKomMonitorLoginRoleNames?.length > 0) {
      this.accessControlService.currentKomMonitorLoginRoleNames.forEach((roles: string) => {
        const key = roles.split('.')[0];
        const role = roles.split('.')[1];

        if (!Object.prototype.hasOwnProperty.call(this.userRoleInformation, key)) {
          this.userRoleInformation[key] = [];
        }

        this.userRoleInformation[key].push(role);
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
