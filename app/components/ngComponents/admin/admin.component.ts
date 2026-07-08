import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { AccessControlService } from '../../../services/access-control-service/access-control.service';
import { NotificationComponent } from '../common/notification/notification.component';
import { SessionValidityComponent } from '../common/userLogin/session-validity/session-validity.component';
import { UserLoginComponent } from '../common/userLogin/user-login.component';

// Child route slugs whose parent group should auto-expand on (re)load.
const GEODATA_ROUTES = ['spatial-units', 'indicators', 'georesources'];
const SETTINGS_ROUTES = ['settings', 'widgets', 'filters'];

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    UserLoginComponent,
    NotificationComponent,
    SessionValidityComponent,
  ],
  standalone: true,
})
export class AdminComponent implements OnInit {
  private router = inject(Router);
  private metadataBootstrap = inject(MetadataBootstrapService);
  protected accessControlService = inject(AccessControlService);

  isGeodataMgmtExpanded = false;
  isSettingsExpanded = false;

  userRoleInformation = {};
  userGroupInformation: any[] = [];

  ngOnInit(): void {
    // The map application (default route) already bootstraps the metadata:
    // only (re)fetch on direct entry to /administration or when the last load
    // applied a global filter — the admin area must see the unfiltered
    // datasets. The user information is derived once the roles are loaded
    // (replaces the former fixed 1s timeout).
    this.metadataBootstrap.ensureMetadataLoaded().then(() => this.prepUserInformation());

    // Keep the collapsible groups open when a child route inside them is
    // active on reload / direct navigation.
    this.expandGroupForCurrentRoute();
  }

  private expandGroupForCurrentRoute(): void {
    const url = this.router.url;
    if (GEODATA_ROUTES.some((slug) => url.includes(`/administration/${slug}`))) {
      this.isGeodataMgmtExpanded = true;
    }
    if (SETTINGS_ROUTES.some((slug) => url.includes(`/administration/${slug}`))) {
      this.isSettingsExpanded = true;
    }
  }

  prepUserInformation() {
    if (this.accessControlService.currentKomMonitorLoginRoleNames.length > 0) {
      this.accessControlService.currentKomMonitorLoginRoleNames.forEach((roles) => {
        const key = roles.split('.')[0];
        const role = roles.split('.')[1];

        if (!Object.prototype.hasOwnProperty.call(this.userRoleInformation, key)) {
          this.userRoleInformation[key] = [];
        }

        this.userRoleInformation[key].push(role);
      });
    }

    if (this.accessControlService.currentKeycloakLoginGroups.length > 0) {
      this.accessControlService.currentKeycloakLoginGroups.forEach((group, index) => {
        const parts = group.split('/');
        this.userGroupInformation[index] = [];

        parts.forEach((part) => {
          if (part.length > 0) this.userGroupInformation[index].push(part);
        });
      });
    }
  }

  switchToMapApplication() {
    this.router.navigate(['']);
  }
}
