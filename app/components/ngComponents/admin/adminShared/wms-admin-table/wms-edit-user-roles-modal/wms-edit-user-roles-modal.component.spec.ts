import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, of, throwError } from 'rxjs';
import { OgcService } from 'services/ogcServices/ogc.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';

import { WmsEditUserRolesModalComponent } from './wms-edit-user-roles-modal.component';

describe('WmsEditUserRolesModalComponent', () => {
  let component: WmsEditUserRolesModalComponent;
  let fixture: ComponentFixture<WmsEditUserRolesModalComponent>;
  let ogcService: { updatePermissions: jest.Mock; updateOwnership: jest.Mock };
  let notificationService: { showSuccess: jest.Mock };
  let activeModal: NgbActiveModal;
  let confirmSpy: jest.SpyInstance;

  const dataset = {
    id: 'wms-1',
    title: 'My WMS',
    ownerId: 'org-current',
    isPublic: true,
    permissions: ['role-a'],
  } as unknown as WmsDataset;

  const submitButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.modal-footer .btn-success');

  beforeEach(() => {
    ogcService = {
      updatePermissions: jest.fn(() => of({})),
      updateOwnership: jest.fn(() => of({})),
    };
    notificationService = { showSuccess: jest.fn() };
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    TestBed.configureTestingModule({
      imports: [WmsEditUserRolesModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
        { provide: OgcService, useValue: ogcService },
        { provide: NotificationService, useValue: notificationService },
        { provide: EnvConfigService, useValue: { enableKeycloakSecurity: true } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    // Render the dialog shell only: the child grid/picker pull in the metadata
    // stores, which are irrelevant to the submit logic under test.
    TestBed.overrideComponent(WmsEditUserRolesModalComponent, {
      set: { imports: [TranslateModule, FormsModule], schemas: [NO_ERRORS_SCHEMA] },
    });
    fixture = TestBed.createComponent(WmsEditUserRolesModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
    jest.spyOn(activeModal, 'close');
    component.currentGeoresourceDataset = { ...dataset };
    component.reInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the submit button enabled without an owner selection', () => {
    component.onChangeOwner('');
    fixture.detectChanges();
    expect(submitButton().disabled).toBe(false);
  });

  it('keeps the current owner and does not transfer ownership when the owner is empty', () => {
    component.onChangeOwner('');
    component.editData();
    expect(ogcService.updatePermissions).toHaveBeenCalledWith('wms-1', {
      isPublic: true,
      permissions: [],
    });
    expect(ogcService.updateOwnership).not.toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('shows a toast and closes after saving', () => {
    component.editData();

    expect(notificationService.showSuccess).toHaveBeenCalledTimes(1);
    expect(activeModal.close).toHaveBeenCalledWith(true);
  });

  it('does not transfer ownership when the owner is unchanged', () => {
    component.editData();
    expect(ogcService.updateOwnership).not.toHaveBeenCalled();
  });

  it('asks before transferring a changed owner, then sends it', () => {
    component.onChangeOwner('org-new');
    component.editData();
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(ogcService.updateOwnership).toHaveBeenCalledWith('wms-1', { ownerId: 'org-new' });
  });

  it('saves nothing when the transfer is not confirmed', () => {
    confirmSpy.mockReturnValue(false);
    component.onChangeOwner('org-new');

    component.editData();

    expect(ogcService.updatePermissions).not.toHaveBeenCalled();
    expect(ogcService.updateOwnership).not.toHaveBeenCalled();
    expect(activeModal.close).not.toHaveBeenCalled();
  });

  it('stays open and shows the error when saving fails', () => {
    ogcService.updatePermissions.mockReturnValue(throwError(() => new Error('boom')));

    component.editData();

    expect(component.errorMessage()).toBe(true);
    expect(activeModal.close).not.toHaveBeenCalled();
  });

  it('sends no second request while saving and disables the button', () => {
    const pending = new Subject<unknown>();
    ogcService.updatePermissions.mockReturnValue(pending);

    component.editData();
    component.editData();
    fixture.detectChanges();

    expect(ogcService.updatePermissions).toHaveBeenCalledTimes(1);
    expect(component.isSubmitting()).toBe(true);
    expect(submitButton().disabled).toBe(true);

    pending.next({});
    pending.complete();
    fixture.detectChanges();
    expect(component.isSubmitting()).toBe(false);
    expect(submitButton().disabled).toBe(false);
  });

  it('restores the dataset values on reset instead of clearing them', () => {
    component.isPublic = false;
    component.onChangeOwner('org-new');
    component.resetWmsEditForm();
    expect(component.isPublic).toBe(true);
    expect(component.ownerOrganization).toBe('org-current');
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });
});
