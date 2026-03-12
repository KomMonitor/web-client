import { CommonModule, DOCUMENT } from "@angular/common";
import { BroadcastService } from "./../../../../services/broadcast-service/broadcast.service";
import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "services/auth-service/auth.service";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import {
  NgbCollapseModule,
  NgbPopover,
  NgbPopoverModule,
} from "@ng-bootstrap/ng-bootstrap";
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  of,
  timer,
} from "rxjs";
import {
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil,
} from "rxjs/operators";

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
  imports: [CommonModule, NgbCollapseModule, NgbPopoverModule],
  standalone: true,
})
export class UserLoginComponent implements OnInit, OnDestroy {
  @ViewChild("userLoginPopover") popover!: NgbPopover;

  private static readonly ADMIN_ROLE_SUFFIXES = ["-creator", "-publisher", "-editor"] as const;

  private isOverAnchor$ = new BehaviorSubject<boolean>(false);
  private isOverPopover$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  private popoverEnterUnlisten?: () => void;
  private popoverLeaveUnlisten?: () => void;

  authenticated = false;
  enableKeycloakSecurity = false;
  currentKeycloakUser: KeycloakUser = {};
  userRoleInformation: UserRoleInformation = {};
  userGroupInformation: string[][] = [];
  keycloakTokenExpirationInfo: string = "";
  password: string = "";

  isUserLoginRolesCollapse = true;
  isUserLoginGroupesCollapse = true;

  get loginInfoText(): string {
    return this.dataExchangeService.pipedData.loginInfoText;
  }

  // Check if we're in admin context by looking at the current URL
  get isAdminView(): boolean {
    return (
      this.router.url.includes("/administration") ||
      this.router.url.includes("/admin")
    );
  }

  constructor(
    private authService: AuthService,
    private dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService,
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.broadcastService.currentBroadcastMsg.pipe(
      takeUntil(this.destroy$),
    ).subscribe((res) => {
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
    this.dataExchangeService.currentKeycloakLoginRoles = [];
    this.enableKeycloakSecurity =
      this.dataExchangeService.enableKeycloakSecurity;

    if (this.authService.Auth?.keycloak?.authenticated) {
      this.authenticated = this.authService.Auth.keycloak.authenticated;
      this.currentKeycloakUser = this.dataExchangeService.currentKeycloakUser;
      this.keycloakTokenExpirationInfo =
        this.dataExchangeService.keycloakTokenExpirationInfo;

      if (
        this.authService.Auth.keycloak.tokenParsed &&
        this.authService.Auth.keycloak.tokenParsed.realm_access &&
        this.authService.Auth.keycloak.tokenParsed.realm_access.roles &&
        this.authService.Auth.keycloak.tokenParsed.realm_access.roles.some(
          (role) => UserLoginComponent.ADMIN_ROLE_SUFFIXES.some((suffix) => role.endsWith(suffix))
        )
      ) {
        this.authService.Auth.keycloak.showAdminView = true;
      }
    }
  }

  prepUserInformation(): void {
    this.userRoleInformation = {};
    this.userGroupInformation = [];
    if (this.dataExchangeService.currentKomMonitorLoginRoleNames?.length > 0) {
      this.dataExchangeService.currentKomMonitorLoginRoleNames.forEach(
        (roles: string) => {
          const key = roles.split(".")[0];
          const role = roles.split(".")[1];

          if (!Object.prototype.hasOwnProperty.call(this.userRoleInformation, key)) {
            this.userRoleInformation[key] = [];
          }

          this.userRoleInformation[key].push(role);
        },
      );
    }

    if (this.dataExchangeService.currentKeycloakLoginGroups?.length > 0) {
      this.dataExchangeService.currentKeycloakLoginGroups.forEach(
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
    if (this.dataExchangeService.enableKeycloakSecurity) {
      this.authService.Auth.keycloak.login();
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
    this.dataExchangeService.tryLogoutUser();
  }

  extendKeycloakSession(): void {
    this.dataExchangeService.extendKeycloakSession();
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
      this.popoverEnterUnlisten = this.renderer.listen(popoverEl, "mouseenter", () => this.isOverPopover$.next(true));
      this.popoverLeaveUnlisten = this.renderer.listen(popoverEl, "mouseleave", () => this.isOverPopover$.next(false));
    }
  }

  onPopoverHidden(): void {
    this.popoverEnterUnlisten?.();
    this.popoverLeaveUnlisten?.();
    this.isOverPopover$.next(false);
  }
}
