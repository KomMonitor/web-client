import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { AdminDashboardManagementComponent } from "../adminDashboardManagement/admin-dashboard-management.component";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";
import { AdminRoleExplanationComponent } from "../adminRoleExplanation/admin-role-explanation.component";
import { AdminTopicsManagementComponent } from "../adminTopicsManagement/admin-topics-management.component";
import { AdminSpatialUnitsManagementComponent } from "../adminSpatialUnitsManagement/admin-spatial-units-management.component";
import { AdminIndicatorsManagementComponent } from "../adminIndicatorsManagement/admin-indicators-management.component";
import { AdminGeoresourcesManagementComponent } from "../adminGeoresourcesManagement/admin-georesources-management.component";
import { AdminAppConfigComponent } from "../adminConfig/adminAppConfig/admin-app-config.component";
import { AdminControlsConfigComponent } from "../adminConfig/adminControlsConfig/admin-controls-config.component";
import { AdminFilterConfigComponent } from "../adminConfig/adminFilterConfig/admin-filter-config.component";
import { UserLoginComponent } from "components/ngComponents/userInterface/userLogin/user-login.component";

@Component({
  selector: "admin-sidebar",
  templateUrl: "./adminSidebar.component.html",
  styleUrls: ["./adminSidebar.component.scss"],
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
    CommonModule,
    NgbNavModule,
    UserLoginComponent
],
  standalone: true,
})
export class AdminSidebarComponent {
  active = "overview";

  isGeodataMgmtExpanded = false;
  isSettingsExpanded = false;

  constructor(
    private router: Router,
    // protected dataExchangeService: DataExchangeService
  ) {}

  switchToMapApplication() {
    this.router.navigate([""]);
  }
}
