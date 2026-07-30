import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { forkJoin } from 'rxjs';
import { AdminRoleManagementService } from '../admin-role-management.service';
import { NotificationService } from '../../../common/notification/notification.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-role-delete-modal',
  templateUrl: './role-delete-modal.component.html',
  imports: [LoadingOverlayComponent, TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDeleteModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private roleMgmgSrvc = inject(AdminRoleManagementService);

  @Input() datasetsToDelete: AccessControlMetadata[] = [];

  // Signal-backed: written from the async deletion callbacks, which would not
  // trigger a re-render of this OnPush component otherwise.
  deletingInProgress = signal(false);
  failedDatasetsAndErrors = signal<[AccessControlMetadata, string][]>([]);

  readonly PROTECTED_NAMES = ['public', 'kommonitor'];

  ngOnInit(): void {
    // Filter out protected entries and warn user
    const original = this.datasetsToDelete.length;
    this.datasetsToDelete = this.datasetsToDelete.filter(
      (ou) => !this.PROTECTED_NAMES.includes(ou.name)
    );
    if (this.datasetsToDelete.length < original) {
      this.failedDatasetsAndErrors.update((entries) => [
        ...entries,
        [
          {
            organizationalUnitId: '',
            name: 'public / kommonitor',
            permissions: [],
          },
          'System-Organisationseinheiten können nicht gelöscht werden! Die betroffene Einheit wurde aus der Liste entfernt.',
        ],
      ]);
    }
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }

  hasChildrenConflict(): boolean {
    return this.datasetsToDelete.some((ou) => ou.children && ou.children.length > 0);
  }

  deleteOrganizationalUnits(): void {
    if (this.datasetsToDelete.length === 0) return;

    this.deletingInProgress.set(true);
    this.failedDatasetsAndErrors.set([]);

    const deletionsObs = this.datasetsToDelete.map((dataset) =>
      this.roleMgmgSrvc.deleteOrganizationalUnit(dataset)
    );

    forkJoin(deletionsObs).subscribe((results) => {
      const failed: [AccessControlMetadata, string][] = [];
      results.forEach((res) => {
        if (res.success) {
          this.notificationService.showSuccess(
            this.translate.instant('ADMIN_ROLES.DELETE_MODAL.MSG.DELETED', {
              name: res.dataset.name,
            })
          );
        } else {
          failed.push([res.dataset, res.error || JSON.stringify(res)]);
        }
      });

      this.failedDatasetsAndErrors.set(failed);
      this.deletingInProgress.set(false);

      if (failed.length === 0) {
        this.activeModal.close(true);
      }
    });
  }
}
