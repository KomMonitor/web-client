import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AdminRoleManagementService } from '../admin-role-management.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';

import { RoleAddModalComponent } from './role-add-modal.component';

/**
 * Covers the submit gate — a unit needs the three text fields, a unique name
 * and either the tenant flag or a parent — plus the mutual exclusion between
 * those two. The fixture is not rendered, following the other modal specs.
 */

const ACCESS_CONTROL = [
  { organizationalUnitId: 'ou-1', name: 'Stadtplanung' },
  { organizationalUnitId: 'ou-2', name: 'Umweltamt' },
];

describe('RoleAddModalComponent', () => {
  let component: RoleAddModalComponent;
  let fixture: ComponentFixture<RoleAddModalComponent>;

  const fillRequired = () =>
    component.form.setValue({
      name: 'Tiefbauamt',
      description: 'Beschreibung',
      contact: 'Kontakt',
      mandant: false,
    });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RoleAddModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
        {
          provide: AccessControlService,
          useValue: {
            accessControl: ACCESS_CONTROL,
            currentKeycloakLoginRoles: [],
            checkAdminPermission: () => true,
            getAccessControlById: (id: string) =>
              ACCESS_CONTROL.find((ou) => ou.organizationalUnitId === id) ?? null,
          },
        },
        { provide: AdminRoleManagementService, useValue: { addOrganizationalUnit: jest.fn() } },
        {
          provide: MetadataBootstrapService,
          useValue: { fetchAccessControlMetadata: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: NotificationService,
          useValue: { showSuccess: jest.fn(), showError: jest.fn() },
        },
        {
          provide: RoleManagementDataGridHelperService,
          useValue: { buildRoleManagementDefaultColDef: () => ({}) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(RoleAddModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stays closed while nothing is filled', () => {
    expect(component.canSubmit).toBe(false);
  });

  it('stays closed without a tenant flag or a parent', () => {
    fillRequired();

    expect(component.canSubmit).toBe(false);
  });

  it('opens for a tenant unit', () => {
    fillRequired();
    component.form.controls.mandant.setValue(true);

    expect(component.canSubmit).toBe(true);
  });

  it('opens for a unit below a parent', () => {
    fillRequired();
    component.onParentOrganizationalUnitChange(ACCESS_CONTROL[0] as never);

    expect(component.canSubmit).toBe(true);
  });

  it.each([['name'], ['description'], ['contact']])('stays closed without the %s', (field) => {
    fillRequired();
    component.form.controls.mandant.setValue(true);
    component.form.get(field)!.setValue('');

    expect(component.canSubmit).toBe(false);
  });

  it('rejects a name another organizational unit already uses', () => {
    fillRequired();
    component.form.controls.mandant.setValue(true);
    component.form.controls.name.setValue('Umweltamt');

    expect(component.nameInvalid).toBe(true);
    expect(component.canSubmit).toBe(false);
  });

  it('clears the parent when the unit becomes its own tenant', () => {
    component.onParentOrganizationalUnitChange(ACCESS_CONTROL[0] as never);
    expect(component.parentSelected).toBe(true);

    component.form.controls.mandant.setValue(true);
    component.onMandantChange();

    expect(component.parentSelected).toBe(false);
  });

  it('clears the tenant flag when a parent is picked', () => {
    component.form.controls.mandant.setValue(true);

    component.onParentOrganizationalUnitChange(ACCESS_CONTROL[1] as never);

    expect(component.form.controls.mandant.value).toBe(false);
    expect(component.getParentOrganizationalUnit()).toBe(ACCESS_CONTROL[1]);
  });

  it('assembles the unit for the payload', () => {
    fillRequired();
    component.onParentOrganizationalUnitChange(ACCESS_CONTROL[0] as never);

    expect(component.newOrganizationalUnit).toEqual({
      name: 'Tiefbauamt',
      description: 'Beschreibung',
      contact: 'Kontakt',
      mandant: false,
      parentId: 'ou-1',
    });
  });
});
