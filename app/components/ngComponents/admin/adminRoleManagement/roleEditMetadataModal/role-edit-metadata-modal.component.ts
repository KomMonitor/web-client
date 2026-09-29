import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { uniqueNameValidator } from '../../adminShared/validators/admin-validators';
import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { FormControlAriaDirective } from '../../adminShared/formError/form-control-aria.directive';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AdminRoleManagementService } from '../admin-role-management.service';
import { NotificationService } from '../../../common/notification/notification.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-role-edit-metadata-modal',
  templateUrl: './role-edit-metadata-modal.component.html',
  styleUrls: ['./role-edit-metadata-modal.component.scss'],
  imports: [
    ReactiveFormsModule,
    FormErrorComponent,
    FormControlAriaDirective,
    LoadingOverlayComponent,
    TranslateModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleEditMetadataModalComponent implements OnInit {
  private activeModal = inject(NgbActiveModal);
  private accessControlService = inject(AccessControlService);
  private adminRoleManagementService = inject(AdminRoleManagementService);
  private notificationSrvc = inject(NotificationService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input() currentDataset!: AccessControlMetadata;

  // Signals: written from the save subscription (OnPush).
  loadingData = signal(false);

  /**
   * The three editable metadata fields, all required. The name must stay
   * unique across the organizational units, ignoring the unit being edited.
   */
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        uniqueNameValidator(
          () => (this.accessControlService.accessControl ?? []).map((ou) => ou.name),
          { ignore: () => this.currentDataset?.name ?? null, caseSensitive: true }
        ),
      ],
    }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contact: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  oldName: string = '';

  successMessagePart: string | undefined;
  errorMessagePart = signal<string | undefined>(undefined);
  keycloakErrorMessagePart = signal<string | undefined>(undefined);
  showErrorAlert = signal(false);
  showKeycloakErrorAlert = signal(false);

  ngOnInit(): void {
    this.oldName = this.currentDataset.name;
    this.form.patchValue({
      name: this.currentDataset.name ?? '',
      description: this.currentDataset.description ?? '',
      contact: this.currentDataset.contact ?? '',
    });
    this.resetAlerts();
  }

  resetAlerts(): void {
    this.successMessagePart = undefined;
    this.errorMessagePart.set(undefined);
    this.keycloakErrorMessagePart.set(undefined);
    this.showErrorAlert.set(false);
    this.showKeycloakErrorAlert.set(false);
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }

  /**
   * Submit button and form submit: saves a valid form; otherwise reveals every
   * field's error and moves the focus to the first invalid field.
   */
  onSubmit(): void {
    if (this.form.valid) {
      this.editMetadata();
      return;
    }

    this.form.markAllAsTouched();
    // OnPush: the touched state alone does not re-render the host's bindings
    this.cdr.markForCheck();
    this.host.nativeElement
      .querySelector<HTMLElement>('input.ng-invalid, textarea.ng-invalid')
      ?.focus();
  }

  editMetadata() {
    if (this.form.invalid) return;

    // The service takes the dataset object; write the edited values back onto
    // it, exactly as the two-way bindings used to.
    const value = this.form.getRawValue();
    this.currentDataset.name = value.name;
    this.currentDataset.description = value.description;
    this.currentDataset.contact = value.contact;

    this.resetAlerts();
    this.loadingData.set(true);

    this.adminRoleManagementService
      .editOrganizationalUnit(this.currentDataset, this.oldName)
      .subscribe((res) => {
        if (res.success) {
          this.successMessagePart = this.currentDataset.name;
          this.notificationSrvc.showSuccess(
            this.translate.instant('ADMIN_ROLES.EDIT_METADATA_MODAL.MSG.METADATA_SAVED', {
              name: this.successMessagePart,
            })
          );

          if (res.keycloakErrorMessagePart) {
            this.keycloakErrorMessagePart.set(res.keycloakErrorMessagePart);
            this.showKeycloakErrorAlert.set(true);
          } else {
            this.notificationSrvc.showSuccess(
              this.translate.instant('ADMIN_ROLES.EDIT_METADATA_MODAL.MSG.KEYCLOAK_ROLES_UPDATED', {
                name: this.successMessagePart,
              })
            );
          }

          this.loadingData.set(false);
          this.activeModal.close(true);
        } else {
          this.errorMessagePart.set(res.errorMessagePart);
          this.showErrorAlert.set(true);
          this.loadingData.set(false);
        }
      });
  }
}
