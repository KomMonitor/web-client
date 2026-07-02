import { AdminComponent } from 'components/ngComponents/admin/admin.component';
import { AdminAppConfigComponent } from 'components/ngComponents/admin/adminConfig/adminAppConfig/admin-app-config.component';
import { AdminControlsConfigComponent } from 'components/ngComponents/admin/adminConfig/adminControlsConfig/admin-controls-config.component';
import { AdminFilterConfigComponent } from 'components/ngComponents/admin/adminConfig/adminFilterConfig/admin-filter-config.component';
import { AdminDashboardManagementComponent } from 'components/ngComponents/admin/adminDashboardManagement/admin-dashboard-management.component';
import { AdminGeoresourcesManagementComponent } from 'components/ngComponents/admin/adminGeoresourcesManagement/admin-georesources-management.component';
import { AdminIndicatorsManagementComponent } from 'components/ngComponents/admin/adminIndicatorsManagement/admin-indicators-management.component';
import { AdminRoleExplanationComponent } from 'components/ngComponents/admin/adminRoleExplanation/admin-role-explanation.component';
import { AdminRoleManagementComponent } from 'components/ngComponents/admin/adminRoleManagement/admin-role-management.component';
import { AdminScriptExecutionComponent } from 'components/ngComponents/admin/adminScriptExecution/admin-script-execution.component';
import { AdminScriptManagementComponent } from 'components/ngComponents/admin/adminScriptManagement/admin-script-management.component';
import { AdminSpatialUnitsManagementComponent } from 'components/ngComponents/admin/adminSpatialUnitsManagement/admin-spatial-units-management.component';
import { AdminTopicsManagementComponent } from 'components/ngComponents/admin/adminTopicsManagement/admin-topics-management.component';
import { UserInterfaceComponent } from './components/ngComponents/userInterface/user-interface.component';
import { Routes } from '@angular/router';
import { authAdminGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'administration',
    component: AdminComponent,
    canActivate: [authAdminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', component: AdminDashboardManagementComponent },
      { path: 'groups', component: AdminRoleManagementComponent },
      { path: 'permissions', component: AdminRoleExplanationComponent },
      { path: 'topics', component: AdminTopicsManagementComponent },
      { path: 'spatial-units', component: AdminSpatialUnitsManagementComponent },
      { path: 'indicators', component: AdminIndicatorsManagementComponent },
      { path: 'georesources', component: AdminGeoresourcesManagementComponent },
      { path: 'scripts', component: AdminScriptManagementComponent },
      { path: 'indicator-calculation', component: AdminScriptExecutionComponent },
      { path: 'settings', component: AdminAppConfigComponent },
      { path: 'widgets', component: AdminControlsConfigComponent },
      { path: 'filters', component: AdminFilterConfigComponent },
    ],
  },
  { path: '**', component: UserInterfaceComponent },
];
