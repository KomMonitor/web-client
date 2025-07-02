import { Component, OnInit, Inject } from '@angular/core';
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
  showAdminLogin = false;
  password: string = '';

  constructor(
    private authService: AuthService,
    private dataExchangeService: DataExchangeService,
    @Inject('kommonitorDataExchangeService') private kommonitorDataExchangeService: any
  ) { }

  ngOnInit(): void {
    this.checkAuthentication();
    this.prepUserInformation();
  }

  checkAuthentication(): void {
    this.kommonitorDataExchangeService.currentKeycloakLoginRoles = [];
    this.enableKeycloakSecurity = this.kommonitorDataExchangeService.enableKeycloakSecurity;

    if (this.authService.Auth?.keycloak?.authenticated) {
      this.authenticated = this.authService.Auth.keycloak.authenticated;
      this.currentKeycloakUser = this.kommonitorDataExchangeService.currentKeycloakUser;
      this.keycloakTokenExpirationInfo = this.kommonitorDataExchangeService.keycloakTokenExpirationInfo;

      if (this.authService.Auth.keycloak.tokenParsed
        && this.authService.Auth.keycloak.tokenParsed.realm_access
        && this.authService.Auth.keycloak.tokenParsed.realm_access.roles
        && this.authService.Auth.keycloak.tokenParsed.realm_access.roles.some(role => role.endsWith("-creator") || role.endsWith("-publisher") || role.endsWith("-editor"))) {
        this.authService.Auth.keycloak.showAdminView = true;
        this.showAdminLogin = true;
      }
    }
  }

  prepUserInformation(): void {
    if (this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames?.length > 0) {
      this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.forEach((roles: string) => {
        let key = roles.split('.')[0];
        let role = roles.split('.')[1];

        if (!this.userRoleInformation.hasOwnProperty(key)) {
          this.userRoleInformation[key] = [];
        }

        this.userRoleInformation[key].push(role);
      });
    }

    if (this.kommonitorDataExchangeService.currentKeycloakLoginGroups?.length > 0) {
      this.kommonitorDataExchangeService.currentKeycloakLoginGroups.forEach((group: string, index: number) => {
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
    if (this.kommonitorDataExchangeService.enableKeycloakSecurity) {
      this.authService.Auth.keycloak.login();
    } else {
      this.tryLoginUser_withoutKeycloak();
    }
  }

  tryLoginUser_withoutKeycloak(): void {
    // TODO FIXME make generic user login once user/role concept is implemented
    // currently only simple ADMIN user login is possible
    console.log("Check user login");
    if (this.kommonitorDataExchangeService.adminUserName === this.kommonitorDataExchangeService.currentKeycloakUser &&
      this.kommonitorDataExchangeService.adminPassword === this.password) {
      // success login --> currently switch to ADMIN page directly
      console.log("User Login success - redirect to Admin Page");
      this.kommonitorDataExchangeService.adminIsLoggedIn = true;
      location.href = '/administration';
    }
  }

  tryLogoutUser(): void {
    this.kommonitorDataExchangeService.tryLogoutUser();
  }

  extendKeycloakSession(): void {
    this.kommonitorDataExchangeService.extendKeycloakSession();
  }

  openAdminUI(): void {
    document.location = '/administration';
  }

  onMouseLeave(): void {
    this.showUserLogin = false;
  }
} 
