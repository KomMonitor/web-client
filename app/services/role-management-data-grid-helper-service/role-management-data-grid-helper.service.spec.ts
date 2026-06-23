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

  it('getSelectedRoleIds_roleManagementGrid collects checked permission ids from table options (no live grid)', () => {
    const roleManagementTableOptions = {
      rowData: [
        {
          name: 'org-A',
          permissions: [
            { permissionId: 'p1', permissionLevel: 'viewer', isChecked: true },
            { permissionId: 'p2', permissionLevel: 'editor', isChecked: false },
          ],
        },
        {
          name: 'org-B',
          permissions: [{ permissionId: 'p3', permissionLevel: 'creator', isChecked: true }],
        },
      ],
    };

    const ids = service.getSelectedRoleIds_roleManagementGrid(roleManagementTableOptions);

    expect(ids).toContain('p1');
    expect(ids).toContain('p3');
    expect(ids).not.toContain('p2');
    expect(ids.length).toBe(2);
  });

  it('getSelectedRoleIds_roleManagementGrid returns an empty array for empty/invalid input', () => {
    expect(service.getSelectedRoleIds_roleManagementGrid({ rowData: [] })).toEqual([]);
    expect(service.getSelectedRoleIds_roleManagementGrid({})).toEqual([]);
  });
});
