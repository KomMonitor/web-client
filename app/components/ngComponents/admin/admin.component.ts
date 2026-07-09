import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
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
    TranslateModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    UserLoginComponent,
    NotificationComponent,
    SessionValidityComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnInit {
  private router = inject(Router);
  private metadataBootstrap = inject(MetadataBootstrapService);

  isGeodataMgmtExpanded = signal(false);
  isSettingsExpanded = signal(false);

  ngOnInit(): void {
    // The map application (default route) already bootstraps the metadata:
    // only (re)fetch on direct entry to /administration or when the last load
    // applied a global filter — the admin area must see the unfiltered
    // datasets.
    this.metadataBootstrap.ensureMetadataLoaded();

    // Keep the collapsible groups open when a child route inside them is
    // active on reload / direct navigation.
    this.expandGroupForCurrentRoute();
  }

  private expandGroupForCurrentRoute(): void {
    const url = this.router.url;
    if (GEODATA_ROUTES.some((slug) => url.includes(`/administration/${slug}`))) {
      this.isGeodataMgmtExpanded.set(true);
    }
    if (SETTINGS_ROUTES.some((slug) => url.includes(`/administration/${slug}`))) {
      this.isSettingsExpanded.set(true);
    }
  }

  switchToMapApplication() {
    this.router.navigate(['']);
  }
}
