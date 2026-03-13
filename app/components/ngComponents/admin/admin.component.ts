import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { AdminAppConfigComponent } from "./adminConfig/adminAppConfig/admin-app-config.component";
import { AdminControlsConfigComponent } from "./adminConfig/adminControlsConfig/admin-controls-config.component";
import { AdminDashboardManagementComponent } from "./adminDashboardManagement/admin-dashboard-management.component";
import { AdminFilterConfigComponent } from "./adminConfig/adminFilterConfig/admin-filter-config.component";
import { AdminGeoresourcesManagementComponent } from "./adminGeoresourcesManagement/admin-georesources-management.component";
import { AdminIndicatorsManagementComponent } from "./adminIndicatorsManagement/admin-indicators-management.component";
import { AdminRoleExplanationComponent } from "./adminRoleExplanation/admin-role-explanation.component";
import { AdminSpatialUnitsManagementComponent } from "./adminSpatialUnitsManagement/admin-spatial-units-management.component";
import { AdminTopicsManagementComponent } from "./adminTopicsManagement/admin-topics-management.component";
import { CommonModule } from "@angular/common";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";
import { NotificationComponent } from "../common/notification/notification.component";
import { AdminScriptExecutionComponent } from "./adminScriptExecution/admin-script-execution.component";
import { AdminScriptManagementComponent } from "./adminScriptManagement/admin-script-management.component";
import { AdminRoleManagementComponent } from "./adminRoleManagement/admin-role-management.component";
import { UserLoginComponent } from "../common/userLogin/user-login.component";

export enum AdminNavItem {
  Overview = "overview",
  GroupMgmt = "groupMgmt",
  GroupRights = "groupRights",
  TopicMgmt = "topicMgmt",
  RoomLevels = "roomLevels",
  Indicators = "indicators",
  Georesources = "georessources",
  ScriptMgmt = "scriptMgmt",
  IndicatorCalculation = "indicatorCalculation",
  CommonSettings = "commonSettings",
  WidgetConfig = "widgetConfig",
  FilterConfig = "filterConfig",
}

@Component({
  selector: "app-admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.css"],
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
    CommonModule,
    NgbNavModule,
    UserLoginComponent,
    NotificationComponent,
    AdminRoleManagementComponent,
  ],
  standalone: true,
})
export class AdminComponent implements OnInit {
  readonly AdminNavItem = AdminNavItem;
  active: AdminNavItem = AdminNavItem.Overview;

  isGeodataMgmtExpanded = false;
  isSettingsExpanded = false;

  userRoleInformation = {};
  userGroupInformation: any[] = [];

  constructor(
    private router: Router,
    protected dataExchangeService: DataExchangeService,
  ) {}

  ngOnInit(): void {
    // if(! this.dataExchangeService.enableKeycloakSecurity){
    // 	  this.checkAuthorizationOnStartup_withoutKeycloak();
    // }
    this.dataExchangeService.fetchAllMetadata();

    setTimeout(() => {
      this.prepUserInformation();
    }, 1000);
  }

  prepUserInformation() {
    if (this.dataExchangeService.currentKomMonitorLoginRoleNames.length > 0) {
      this.dataExchangeService.currentKomMonitorLoginRoleNames.forEach(
        (roles) => {
          let key = roles.split(".")[0];
          let role = roles.split(".")[1];

          if (!this.userRoleInformation.hasOwnProperty(key)) {
            this.userRoleInformation[key] = [];
          }

          this.userRoleInformation[key].push(role);
        },
      );
    }

    if (this.dataExchangeService.currentKeycloakLoginGroups.length > 0) {
      this.dataExchangeService.currentKeycloakLoginGroups.forEach(
        (group, index) => {
          let parts = group.split("/");
          this.userGroupInformation[index] = [];

          parts.forEach((part) => {
            if (part.length > 0) this.userGroupInformation[index].push(part);
          });
        },
      );
    }
  }

  switchToMapApplication() {
    this.router.navigate([""]);
  }
}
