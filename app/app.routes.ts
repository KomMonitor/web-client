import { UserInterfaceComponent } from './components/ngComponents/userInterface/user-interface.component';
import { Routes } from '@angular/router';
import { authAdminGuard } from './guards/auth.guard';

// The admin area (~37k lines of TS+HTML) is lazy-loaded: every route uses
// loadComponent so its code is split out of the initial bundle and only
// fetched when a user actually navigates to /administration.
export const routes: Routes = [
  {
    path: 'administration',
    loadComponent: () =>
      import('components/ngComponents/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [authAdminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        loadComponent: () =>
          import('components/ngComponents/admin/adminDashboardManagement/admin-dashboard-management.component').then(
            (m) => m.AdminDashboardManagementComponent
          ),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('components/ngComponents/admin/adminRoleManagement/admin-role-management.component').then(
            (m) => m.AdminRoleManagementComponent
          ),
      },
      {
        path: 'permissions',
        loadComponent: () =>
          import('components/ngComponents/admin/adminRoleExplanation/admin-role-explanation.component').then(
            (m) => m.AdminRoleExplanationComponent
          ),
      },
      {
        path: 'topics',
        loadComponent: () =>
          import('components/ngComponents/admin/adminTopicsManagement/admin-topics-management.component').then(
            (m) => m.AdminTopicsManagementComponent
          ),
      },
      {
        path: 'spatial-units',
        loadComponent: () =>
          import('components/ngComponents/admin/adminSpatialUnitsManagement/admin-spatial-units-management.component').then(
            (m) => m.AdminSpatialUnitsManagementComponent
          ),
      },
      {
        path: 'indicators',
        loadComponent: () =>
          import('components/ngComponents/admin/adminIndicatorsManagement/admin-indicators-management.component').then(
            (m) => m.AdminIndicatorsManagementComponent
          ),
      },
      {
        path: 'georesources',
        loadComponent: () =>
          import('components/ngComponents/admin/adminGeoresourcesManagement/admin-georesources-management.component').then(
            (m) => m.AdminGeoresourcesManagementComponent
          ),
      },
      {
        path: 'scripts',
        loadComponent: () =>
          import('components/ngComponents/admin/adminScriptManagement/admin-script-management.component').then(
            (m) => m.AdminScriptManagementComponent
          ),
      },
      {
        path: 'indicator-calculation',
        loadComponent: () =>
          import('components/ngComponents/admin/adminScriptExecution/admin-script-execution.component').then(
            (m) => m.AdminScriptExecutionComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('components/ngComponents/admin/adminConfig/adminAppConfig/admin-app-config.component').then(
            (m) => m.AdminAppConfigComponent
          ),
      },
      {
        path: 'widgets',
        loadComponent: () =>
          import('components/ngComponents/admin/adminConfig/adminControlsConfig/admin-controls-config.component').then(
            (m) => m.AdminControlsConfigComponent
          ),
      },
      {
        path: 'filters',
        loadComponent: () =>
          import('components/ngComponents/admin/adminConfig/adminFilterConfig/admin-filter-config.component').then(
            (m) => m.AdminFilterConfigComponent
          ),
      },
    ],
  },
  { path: '**', component: UserInterfaceComponent },
];
