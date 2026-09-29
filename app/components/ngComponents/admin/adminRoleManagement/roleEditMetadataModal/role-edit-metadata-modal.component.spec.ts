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
 * Covers the name-uniqueness rule, the write-back onto `currentDataset`, which
 * the service consumes, and the always-active submit button. Only the submit
 * tests render the fixture; they need the DOM for the error messages and focus.
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
    expect(component.form.controls.name.hasError('uniqueName')).toBe(false);
    expect(component.form.valid).toBe(true);
  });

  it('rejects the name of another organizational unit', () => {
    component.form.controls.name.setValue('Umweltamt');

    expect(component.form.controls.name.hasError('uniqueName')).toBe(true);
  });

  it('accepts a name nobody else uses', () => {
    component.form.controls.name.setValue('Tiefbauamt');

    expect(component.form.controls.name.hasError('uniqueName')).toBe(false);
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

  it('requires a description and a contact', () => {
    component.form.patchValue({ description: '', contact: '' });

    expect(component.form.controls.description.hasError('required')).toBe(true);
    expect(component.form.controls.contact.hasError('required')).toBe(true);
  });

  describe('submit button', () => {
    const submitButton = (): HTMLButtonElement =>
      fixture.nativeElement.querySelector('.modal-footer .btn-success');
    const errorMessages = (): HTMLElement[] =>
      Array.from(fixture.nativeElement.querySelectorAll('app-form-error .with-errors'));

    beforeEach(() => {
      // Attached to the document so that focus() actually moves the focus.
      document.body.appendChild(fixture.nativeElement);
      // First render; it runs ngOnInit again, so edit the form only afterwards.
      fixture.detectChanges();
    });

    afterEach(() => {
      fixture.nativeElement.remove();
    });

    it('stays enabled and does not save an incomplete form', () => {
      component.form.patchValue({ description: '', contact: '' });
      fixture.detectChanges();

      expect(submitButton().disabled).toBe(false);
      submitButton().click();
      fixture.detectChanges();

      expect(editOrganizationalUnit).not.toHaveBeenCalled();
      expect(errorMessages()).toHaveLength(2);
      expect(document.activeElement).toBe(
        fixture.nativeElement.querySelector('textarea[name="description"]')
      );
    });

    it('focuses the name when it is taken by another unit', () => {
      component.form.controls.name.setValue('Umweltamt');
      fixture.detectChanges();

      submitButton().click();
      fixture.detectChanges();

      expect(editOrganizationalUnit).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(
        fixture.nativeElement.querySelector('input[type="text"]')
      );
    });

    it('links each label to its field and each error to the field it describes', () => {
      for (const id of [
        'role-metadata-name',
        'role-metadata-description',
        'role-metadata-contact',
      ]) {
        expect(fixture.nativeElement.querySelector(`label[for="${id}"]`)).not.toBeNull();
        expect(fixture.nativeElement.querySelector(`#${id}`)).not.toBeNull();
      }

      component.form.patchValue({ description: '' });
      submitButton().click();
      fixture.detectChanges();

      const description: HTMLElement = fixture.nativeElement.querySelector(
        '#role-metadata-description'
      );
      expect(description.getAttribute('aria-invalid')).toBe('true');
      expect(description.getAttribute('aria-describedby')).toBe('role-metadata-description-error');
      expect(
        fixture.nativeElement.querySelector('#role-metadata-description-error')
      ).not.toBeNull();
    });

    it('saves a complete form', () => {
      submitButton().click();

      expect(editOrganizationalUnit).toHaveBeenCalledWith(component.currentDataset, 'Stadtplanung');
    });
  });
});
