import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAppConfigComponent } from './adminConfig/adminAppConfig/admin-app-config.component';
import { AdminControlsConfigComponent } from './adminConfig/adminControlsConfig/admin-controls-config.component';
import { AdminFilterConfigComponent } from './adminConfig/adminFilterConfig/admin-filter-config.component';
import { AdminDashboardManagementComponent } from './adminDashboardManagement/admin-dashboard-management.component';
import { AdminGeoresourcesManagementComponent } from './adminGeoresourcesManagement/admin-georesources-management.component';
import { AdminIndicatorsManagementComponent } from './adminIndicatorsManagement/admin-indicators-management.component';
import { AdminRoleExplanationComponent } from './adminRoleExplanation/admin-role-explanation.component';
import { AdminSpatialUnitsManagementComponent } from './adminSpatialUnitsManagement/admin-spatial-units-management.component';
import { AdminTopicsManagementComponent } from './adminTopicsManagement/admin-topics-management.component';

import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { DataExchangeService } from '../../../services/data-exchange-service/data-exchange.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { AccessControlService } from '../../../services/access-control-service/access-control.service';
import { NotificationComponent } from '../common/notification/notification.component';
import { SessionValidityComponent } from '../common/userLogin/session-validity/session-validity.component';
import { UserLoginComponent } from '../common/userLogin/user-login.component';
import { AdminRoleManagementComponent } from './adminRoleManagement/admin-role-management.component';
import { AdminScriptExecutionComponent } from './adminScriptExecution/admin-script-execution.component';
import { AdminScriptManagementComponent } from './adminScriptManagement/admin-script-management.component';

export enum AdminNavItem {
  Overview = 'overview',
  GroupMgmt = 'groupMgmt',
  GroupRights = 'groupRights',
  TopicMgmt = 'topicMgmt',
  RoomLevels = 'roomLevels',
  Indicators = 'indicators',
  Georesources = 'georessources',
  ScriptMgmt = 'scriptMgmt',
  IndicatorCalculation = 'indicatorCalculation',
  CommonSettings = 'commonSettings',
  WidgetConfig = 'widgetConfig',
  FilterConfig = 'filterConfig',
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  imports: [
    AdminAppConfigComponent,
    AdminControlsConfigComponent,
    AdminDashboardManagementComponent,
    AdminFilterConfigComponent,
    AdminGeoresourcesManagementComponent,
    AdminIndicatorsManagementComponent,
    AdminRoleExplanationComponent,
    AdminSpatialUnitsManagementComponent,
    AdminTopicsManagementComponent,
    AdminScriptExecutionComponent,
    AdminScriptManagementComponent,
    NgbNavModule,
    UserLoginComponent,
    NotificationComponent,
    AdminRoleManagementComponent,
    SessionValidityComponent,
  ],
  standalone: true,
})
export class AdminComponent implements OnInit {
  private router = inject(Router);
  protected dataExchangeService = inject(DataExchangeService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  protected accessControlService = inject(AccessControlService);

  readonly AdminNavItem = AdminNavItem;
  active: AdminNavItem = AdminNavItem.Overview;

  isGeodataMgmtExpanded = false;
  isSettingsExpanded = false;

  userRoleInformation = {};
  userGroupInformation: any[] = [];

  ngOnInit(): void {
    // if(! this.dataExchangeService.enableKeycloakSecurity){
    // 	  this.checkAuthorizationOnStartup_withoutKeycloak();
    // }
    this.metadataBootstrap.fetchAllMetadata();

    setTimeout(() => {
      this.prepUserInformation();
    }, 1000);
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
