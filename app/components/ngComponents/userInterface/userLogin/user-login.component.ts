import { Component, OnInit, Inject, Input } from '@angular/core';
import { AuthService } from 'services/auth-service/auth.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

interface UserRoleInformation {
  [key: string]: string[];
}

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent implements OnInit {
  showUserLogin = false;
  authenticated = false;
  enableKeycloakSecurity = false;
  currentKeycloakUser: any = {};
  userRoleInformation: UserRoleInformation = {};
  userGroupInformation: string[][] = [];
  keycloakTokenExpirationInfo: string = '';
  password: string = '';

  get loginInfoText(): string {
    return this.dataExchangeService.pipedData.loginInfoText;
  }
  
  // Check if we're in admin context by looking at the current URL
  get isAdminView(): boolean {
    return window.location.pathname.includes('/administration') || 
           window.location.pathname.includes('/admin');
  }

  constructor(
    private authService: AuthService,
    private dataExchangeService: DataExchangeService
  ) { }

  ngOnInit(): void {
    this.checkAuthentication();
    this.prepUserInformation();
  }

  checkAuthentication(): void {
    this.dataExchangeService.currentKeycloakLoginRoles = [];
    this.enableKeycloakSecurity = this.dataExchangeService.enableKeycloakSecurity;

    if (this.authService.Auth?.keycloak?.authenticated) {
      this.authenticated = this.authService.Auth.keycloak.authenticated;
      this.currentKeycloakUser = this.dataExchangeService.currentKeycloakUser;
      this.keycloakTokenExpirationInfo = this.dataExchangeService.keycloakTokenExpirationInfo;

      if (this.authService.Auth.keycloak.tokenParsed
        && this.authService.Auth.keycloak.tokenParsed.realm_access
        && this.authService.Auth.keycloak.tokenParsed.realm_access.roles
        && this.authService.Auth.keycloak.tokenParsed.realm_access.roles.some(role => role.endsWith("-creator") || role.endsWith("-publisher") || role.endsWith("-editor"))) {
        this.authService.Auth.keycloak.showAdminView = true;
      }
    }
  }

  prepUserInformation(): void {
    if (this.dataExchangeService.currentKomMonitorLoginRoleNames?.length > 0) {
      this.dataExchangeService.currentKomMonitorLoginRoleNames.forEach((roles: string) => {
        let key = roles.split('.')[0];
        let role = roles.split('.')[1];

        if (!this.userRoleInformation.hasOwnProperty(key)) {
          this.userRoleInformation[key] = [];
        }

        this.userRoleInformation[key].push(role);
      });
    }

    if (this.dataExchangeService.currentKeycloakLoginGroups?.length > 0) {
      this.dataExchangeService.currentKeycloakLoginGroups.forEach((group: string, index: number) => {
        let parts = group.split('/');
        this.userGroupInformation[index] = [];

        parts.forEach(part => {
          if (part.length > 0) {
            this.userGroupInformation[index].push(part);
          }
        });
      });
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
    if (this.dataExchangeService.adminUserName === this.dataExchangeService.currentKeycloakUser &&
      this.dataExchangeService.adminPassword === this.password) {
      // success login --> currently switch to ADMIN page directly
      console.log("User Login success - redirect to Admin Page");
      this.dataExchangeService.adminIsLoggedIn = true;
      location.href = '/administration';
    }
  }

  tryLogoutUser(): void {
    this.dataExchangeService.tryLogoutUser();
  }

  extendKeycloakSession(): void {
    this.dataExchangeService.extendKeycloakSession();
  }

  onMouseLeave(): void {
    this.showUserLogin = false;
  }
} 
