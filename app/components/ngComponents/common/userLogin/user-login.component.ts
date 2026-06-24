import { CommonModule } from "@angular/common";
import { BroadcastService } from "./../../../../services/broadcast-service/broadcast.service";
import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  Renderer2,
  ViewChild,
  DOCUMENT,
} from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "services/auth-service/auth.service";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { AccessControlService } from "services/access-control-service/access-control.service";
import {
  NgbCollapseModule,
  NgbPopover,
  NgbPopoverModule,
} from "@ng-bootstrap/ng-bootstrap";
import { SessionValidityComponent } from "./session-validity/session-validity.component";
import { BehaviorSubject, Subject, combineLatest, of, timer } from "rxjs";
import {
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil,
} from "rxjs/operators";
import { EnvConfigService } from "../../../../services/env-config-service/env-config.service";

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
  selector: "app-user-login",
  templateUrl: "./user-login.component.html",
  styleUrls: ["./user-login.component.scss"],
  imports: [
    CommonModule,
    NgbCollapseModule,
    NgbPopoverModule,
    SessionValidityComponent,
  ],
  standalone: true,
})
export class UserLoginComponent implements OnInit, OnDestroy {
  @ViewChild("userLoginPopover") popover!: NgbPopover;

  private isOverAnchor$ = new BehaviorSubject<boolean>(false);
  private isOverPopover$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  private popoverEnterUnlisten?: () => void;
  private popoverLeaveUnlisten?: () => void;

  authenticated = false;
  currentKeycloakUser: KeycloakUser = {};
  userRoleInformation: UserRoleInformation = {};
  userGroupInformation: string[][] = [];
  password: string = "";

  isUserLoginRolesCollapse = true;
  isUserLoginGroupesCollapse = true;

  // Check if we're in admin context by looking at the current URL
  get isAdminView(): boolean {
    return (
      this.router.url.includes("/administration") ||
      this.router.url.includes("/admin")
    );
  }

  // Read directly from the (startup-populated, stable) config rather than caching
  // it in a field that is set late from an async broadcast handler. The cached
  // field changed value between change-detection passes and caused NG0100 on the
  // [disablePopover] binding once app-wide ticks were triggered by signals.
  get enableKeycloakSecurity(): boolean {
    return this.envConfigService.enableKeycloakSecurity;
  }

  constructor(
    private authService: AuthService,
    private dataExchangeService: DataExchangeService,
    private accessControlService: AccessControlService,
    private broadcastService: BroadcastService,
    private router: Router,
    private renderer: Renderer2,
    protected envConfigService: EnvConfigService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.msg === "initialMetadataLoadingCompleted") {
          this.checkAuthentication();
          this.prepUserInformation();
        }
      });

    combineLatest([this.isOverAnchor$, this.isOverPopover$])
      .pipe(
        map(([anchor, pop]) => anchor || pop),
        distinctUntilChanged(),
        switchMap((isHovered) =>
          isHovered ? of(true) : timer(200).pipe(map(() => false)),
        ),
        takeUntil(this.destroy$),
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
    this.accessControlService.currentKeycloakLoginRoles = [];

    this.authenticated = this.authService.isAuthenticated();
    if (this.authenticated) {
      this.currentKeycloakUser = this.dataExchangeService.currentKeycloakUser;
    }
  }

  prepUserInformation(): void {
    this.userRoleInformation = {};
    this.userGroupInformation = [];
    if (this.accessControlService.currentKomMonitorLoginRoleNames?.length > 0) {
      this.accessControlService.currentKomMonitorLoginRoleNames.forEach(
        (roles: string) => {
          const key = roles.split(".")[0];
          const role = roles.split(".")[1];

          if (
            !Object.prototype.hasOwnProperty.call(this.userRoleInformation, key)
          ) {
            this.userRoleInformation[key] = [];
          }

          this.userRoleInformation[key].push(role);
        },
      );
    }

    if (this.accessControlService.currentKeycloakLoginGroups?.length > 0) {
      this.accessControlService.currentKeycloakLoginGroups.forEach(
        (group: string, index: number) => {
          const parts = group.split("/");
          this.userGroupInformation[index] = [];

          parts.forEach((part) => {
            if (part.length > 0) {
              this.userGroupInformation[index].push(part);
            }
          });
        },
      );
    }
  }

  tryLoginUser(): void {
    if (this.envConfigService.enableKeycloakSecurity) {
      this.authService.login();
    } else {
      this.tryLoginUser_withoutKeycloak();
    }
  }

  tryLoginUser_withoutKeycloak(): void {
    // TODO FIXME make generic user login once user/role concept is implemented
    // currently only simple ADMIN user login is possible
    console.log("Check user login");
    if (
      this.dataExchangeService.adminUserName ===
        this.dataExchangeService.currentKeycloakUser &&
      this.dataExchangeService.adminPassword === this.password
    ) {
      // success login --> currently switch to ADMIN page directly
      console.log("User Login success - redirect to Admin Page");
      this.dataExchangeService.adminIsLoggedIn = true;
      this.router.navigate(["/administration"]);
    }
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
    const popoverEl = this.document.querySelector(".user-login-popover");
    if (popoverEl) {
      this.popoverEnterUnlisten = this.renderer.listen(
        popoverEl,
        "mouseenter",
        () => this.isOverPopover$.next(true),
      );
      this.popoverLeaveUnlisten = this.renderer.listen(
        popoverEl,
        "mouseleave",
        () => this.isOverPopover$.next(false),
      );
    }
  }

  onPopoverHidden(): void {
    this.popoverEnterUnlisten?.();
    this.popoverLeaveUnlisten?.();
    this.isOverPopover$.next(false);
  }
}
