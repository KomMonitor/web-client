import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RoleManagementDataGridHelperService } from './role-management-data-grid-helper.service';

describe('RoleManagementDataGridHelperService', () => {
  let service: RoleManagementDataGridHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RoleManagementDataGridHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('buildRoleManagementGridOptionsPublic passes through the given components', () => {
    const components = { CheckboxRenderer_viewer: class {} };
    const options = service.buildRoleManagementGridOptionsPublic(components);

    expect(options.components).toBe(components);
    expect(options.rowSelection).toBe('multiple');
    expect(options.pagination).toBe(true);
  });

  it('buildRoleManagementGridOptionsPublic defaults components to an empty object', () => {
    const options = service.buildRoleManagementGridOptionsPublic();
    expect(options.components).toEqual({});
  });

  it('getRoleManagementComponents exposes the three checkbox renderers', () => {
    const components = service.getRoleManagementComponents();
    expect(components.CheckboxRenderer_viewer).toBeDefined();
    expect(components.CheckboxRenderer_editor).toBeDefined();
    expect(components.CheckboxRenderer_creator).toBeDefined();
  });

  // Selected-id collection moved to the shared role-management panel; see
  // adminShared/roleManagementPanel/role-management-panel.model.spec.ts.

  it('buildRoleManagementGrid pre-checks the selected permission ids in the row data', () => {
    const accessControl = [
      { name: 'public', organizationalUnitId: '0', permissions: [] },
      { name: 'kommonitor', organizationalUnitId: '1', permissions: [] },
      {
        name: 'org-A',
        organizationalUnitId: '2',
        permissions: [
          { permissionId: 'p1', permissionLevel: 'viewer' },
          { permissionId: 'p2', permissionLevel: 'editor' },
        ],
      },
    ];

    const options = service.buildRoleManagementGrid('grid', null, accessControl, ['p1'], true);

    const orgA = options.rowData.find((row: any) => row.name === 'org-A');
    expect(orgA.viewer).toBe(true);
    expect(orgA.editor).toBe(false);
    expect(orgA.permissions.find((p: any) => p.permissionId === 'p1').isChecked).toBe(true);
    // reduced mode: no creator ("Löschen") column
    expect(options.columnDefs.some((col: any) => col.field === 'creator')).toBe(false);
  });
});
