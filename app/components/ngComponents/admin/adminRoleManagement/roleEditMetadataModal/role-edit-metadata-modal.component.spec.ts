import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AdminRoleManagementService } from '../admin-role-management.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';

import { RoleEditMetadataModalComponent } from './role-edit-metadata-modal.component';

/**
 * Covers the name-uniqueness rule and the write-back onto `currentDataset`,
 * which the service consumes. The fixture is not rendered, following the other
 * modal specs in this repo.
 */

const ACCESS_CONTROL = [
  { organizationalUnitId: 'ou-1', name: 'Stadtplanung' },
  { organizationalUnitId: 'ou-2', name: 'Umweltamt' },
];

describe('RoleEditMetadataModalComponent', () => {
  let component: RoleEditMetadataModalComponent;
  let fixture: ComponentFixture<RoleEditMetadataModalComponent>;
  let editOrganizationalUnit: jest.Mock;

  beforeEach(() => {
    editOrganizationalUnit = jest.fn().mockReturnValue(of({ success: true }));

    TestBed.configureTestingModule({
      imports: [RoleEditMetadataModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
        { provide: AccessControlService, useValue: { accessControl: ACCESS_CONTROL } },
        { provide: AdminRoleManagementService, useValue: { editOrganizationalUnit } },
        {
          provide: NotificationService,
          useValue: { showSuccess: jest.fn(), showError: jest.fn() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(RoleEditMetadataModalComponent);
    component = fixture.componentInstance;
    component.currentDataset = {
      organizationalUnitId: 'ou-1',
      name: 'Stadtplanung',
      description: 'Beschreibung',
      contact: 'Kontakt',
    } as never;
    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('seeds the form from the dataset', () => {
    expect(component.form.getRawValue()).toEqual({
      name: 'Stadtplanung',
      description: 'Beschreibung',
      contact: 'Kontakt',
    });
  });

  it('accepts the unit keeping its own name', () => {
    expect(component.nameInvalid).toBe(false);
    expect(component.form.valid).toBe(true);
  });

  it('rejects the name of another organizational unit', () => {
    component.form.controls.name.setValue('Umweltamt');

    expect(component.nameInvalid).toBe(true);
  });

  it('accepts a name nobody else uses', () => {
    component.form.controls.name.setValue('Tiefbauamt');

    expect(component.nameInvalid).toBe(false);
  });

  it('requires a name', () => {
    component.form.controls.name.setValue('');

    expect(component.form.controls.name.hasError('required')).toBe(true);
  });

  it('writes the edited values back onto the dataset before saving', () => {
    component.form.setValue({
      name: 'Tiefbauamt',
      description: 'Neue Beschreibung',
      contact: 'Neuer Kontakt',
    });

    component.editMetadata();

    expect(component.currentDataset.name).toBe('Tiefbauamt');
    expect(component.currentDataset.description).toBe('Neue Beschreibung');
    expect(component.currentDataset.contact).toBe('Neuer Kontakt');
    expect(editOrganizationalUnit).toHaveBeenCalledWith(component.currentDataset, 'Stadtplanung');
  });

  it('does not save while the form is invalid', () => {
    component.form.controls.name.setValue('Umweltamt');

    component.editMetadata();

    expect(editOrganizationalUnit).not.toHaveBeenCalled();
  });
});
