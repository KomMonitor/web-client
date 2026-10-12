import { Component, EventEmitter, Input, NO_ERRORS_SCHEMA, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { of } from 'rxjs';

import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AdminRoleManagementService } from '../admin-role-management.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { AdvancedAccessControlRow, setPermissionChecked } from '../advanced-role-permissions';

import { RoleEditGroupRightsModalComponent } from './role-edit-group-rights-modal.component';

/**
 * Covers step 2's "Zeige nur zugewiesene Rechte" switch: it starts out hiding
 * the groups without rights, but must be able to show all of them again — the
 * migration had dropped the switch and left the filter stuck on, so no further
 * group could be given rights once one had them. Only the last two tests
 * render the template, with ag-grid stubbed out.
 */

@Component({ selector: 'ag-grid-angular', standalone: true, template: '' })
class AgGridStubComponent {
  @Input() columnDefs: unknown;
  @Input() rowData: unknown;
  @Input() defaultColDef: unknown;
  @Input() gridOptions: unknown;
  @Input() pagination: unknown;
  @Output() gridReady = new EventEmitter<unknown>();
}

const ACCESS_CONTROL = [
  { organizationalUnitId: 'ou-1', name: 'Stadtplanung', permissions: [] },
  { organizationalUnitId: 'ou-2', name: 'Umweltamt', permissions: [] },
  { organizationalUnitId: 'ou-3', name: 'Tiefbauamt', permissions: [] },
];

describe('RoleEditGroupRightsModalComponent', () => {
  let component: RoleEditGroupRightsModalComponent;
  let fixture: ComponentFixture<RoleEditGroupRightsModalComponent>;
  let roleService: {
    getAuthorityRoles: jest.Mock;
    getDelegatedRoles: jest.Mock;
    updateDelegatedRoles: jest.Mock;
  };

  const visibleIds = () => component.delegatedRowData.map((row) => row.organizationalUnitId).sort();

  const rowOf = (id: string) =>
    component.delegatedRowData.find(
      (row) => row.organizationalUnitId === id
    ) as AdvancedAccessControlRow;

  const toggle = (activeOnly: boolean) => {
    component.activeDelegatedRolesOnly = activeOnly;
    component.onActiveDelegatedRolesOnlyChange();
  };

  const init = (roleDelegates: Array<{ organizationalUnitId: string; adminRoles: string[] }>) => {
    roleService.getDelegatedRoles.mockReturnValue(of({ roleDelegates }));
    component.ngOnInit();
  };

  beforeEach(() => {
    roleService = {
      getAuthorityRoles: jest.fn().mockReturnValue(of({ authorityRoles: [] })),
      getDelegatedRoles: jest.fn(),
      updateDelegatedRoles: jest.fn().mockReturnValue(of({ success: true })),
    };

    TestBed.configureTestingModule({
      imports: [RoleEditGroupRightsModalComponent, TranslateModule.forRoot()],
      providers: [
        NgbActiveModal,
        {
          provide: AccessControlService,
          useValue: {
            accessControl: ACCESS_CONTROL,
            getAccessControlById: (id: string) =>
              ACCESS_CONTROL.find((ou) => ou.organizationalUnitId === id) ?? null,
          },
        },
        { provide: AdminRoleManagementService, useValue: roleService },
        {
          provide: NotificationService,
          useValue: { showSuccess: jest.fn(), showError: jest.fn() },
        },
        {
          provide: RoleManagementDataGridHelperService,
          useValue: {
            buildRoleManagementGridOptionsPublic: () => ({}),
            buildRoleManagementDefaultColDef: () => ({}),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    TestBed.overrideComponent(RoleEditGroupRightsModalComponent, {
      remove: { imports: [AgGridAngular] },
      add: { imports: [AgGridStubComponent] },
    });

    fixture = TestBed.createComponent(RoleEditGroupRightsModalComponent);
    component = fixture.componentInstance;
    component.currentDataset = {
      organizationalUnitId: 'ou-1',
      name: 'Stadtplanung',
      permissions: [],
    };
  });

  it('starts out showing only the groups that hold rights', () => {
    init([{ organizationalUnitId: 'ou-2', adminRoles: ['unit-users-creator'] }]);

    expect(component.activeDelegatedRolesOnly).toBe(true);
    expect(visibleIds()).toEqual(['ou-2']);
  });

  it('shows every group again once the switch is turned off', () => {
    init([{ organizationalUnitId: 'ou-2', adminRoles: ['unit-users-creator'] }]);

    toggle(false);

    expect(visibleIds()).toEqual(['ou-1', 'ou-2', 'ou-3']);
  });

  it('shows every group when no group holds rights yet', () => {
    init([]);

    expect(component.activeDelegatedRolesOnly).toBe(false);
    expect(visibleIds()).toEqual(['ou-1', 'ou-2', 'ou-3']);
  });

  it('keeps a newly assigned group visible and saves it when the switch goes back on', () => {
    init([{ organizationalUnitId: 'ou-2', adminRoles: ['unit-users-creator'] }]);

    toggle(false);
    setPermissionChecked(rowOf('ou-3'), 'unit-themes-creator', true);
    toggle(true);

    expect(visibleIds()).toEqual(['ou-2', 'ou-3']);

    component.updateDelegatedRoles();

    const [unitId, putBody] = roleService.updateDelegatedRoles.mock.calls[0];
    expect(unitId).toBe('ou-1');
    expect(putBody).toHaveLength(2);
    expect(putBody).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          organizationalUnitId: 'ou-2',
          adminRoles: ['unit-users-creator'],
        }),
        expect.objectContaining({
          organizationalUnitId: 'ou-3',
          adminRoles: ['unit-themes-creator'],
        }),
      ])
    );
  });

  it('restores the switch default on reset', () => {
    init([{ organizationalUnitId: 'ou-2', adminRoles: ['unit-users-creator'] }]);
    toggle(false);

    component.reset();

    expect(component.activeDelegatedRolesOnly).toBe(true);
    expect(visibleIds()).toEqual(['ou-2']);
  });

  describe('rendered', () => {
    const switchInput = (): HTMLInputElement | null =>
      fixture.nativeElement.querySelector('#activeDelegatedRolesOnly');

    const openStep2 = async (
      roleDelegates: Array<{ organizationalUnitId: string; adminRoles: string[] }>
    ) => {
      roleService.getDelegatedRoles.mockReturnValue(of({ roleDelegates }));
      fixture.detectChanges();
      component['stepper'].currentStep = 2;
      fixture.detectChanges();
      // ngModel writes the checkbox state asynchronously.
      await fixture.whenStable();
      fixture.detectChanges();
    };

    it('offers the switch once a group holds rights, and turning it off lists all groups', async () => {
      await openStep2([{ organizationalUnitId: 'ou-2', adminRoles: ['unit-users-creator'] }]);

      expect(switchInput()?.checked).toBe(true);

      switchInput()!.click();
      fixture.detectChanges();

      expect(component.activeDelegatedRolesOnly).toBe(false);
      expect(visibleIds()).toEqual(['ou-1', 'ou-2', 'ou-3']);
    });

    it('hides the switch while no group holds rights', async () => {
      await openStep2([]);

      expect(switchInput()).toBeNull();
    });
  });
});
