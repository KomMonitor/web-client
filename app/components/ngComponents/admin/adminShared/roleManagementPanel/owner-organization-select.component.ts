import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { collectCreatorRightOrganizations } from './role-management-panel.model';

/**
 * The "transfer ownership" block of the edit-user-roles modals: keyword
 * filter, target-organization select and the current-owner column with a
 * change warning. Admins may pick any organizational unit; other users only
 * the units they hold creator rights for.
 *
 * Replaces the per-modal copies in the spatial-unit and georesource
 * edit-user-roles and add modals. Two modes:
 * - 'transfer' (default, edit modals): optional choice, an empty `ownerId`
 *   keeps the current owner; shows the current-owner column with a warning.
 * - 'assign' (add modals): mandatory choice of the owning unit for a new
 *   dataset; no current-owner column.
 */
@Component({
  selector: 'app-owner-organization-select',
  templateUrl: './owner-organization-select.component.html',
  imports: [FormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerOrganizationSelectComponent {
  private accessControlService = inject(AccessControlService);

  /** 'transfer': optional ownership transfer (edit); 'assign': mandatory owner choice (add). */
  @Input() mode: 'transfer' | 'assign' = 'transfer';
  /** Current owner of the dataset (drives the display and the change warning). */
  @Input() currentOwnerId: string | null | undefined = null;
  /** Selected target owner; empty keeps the current owner. Supports two-way binding. */
  @Input() ownerId = '';
  @Output() ownerIdChange = new EventEmitter<string>();

  ownerOrgFilter = '';

  private cachedCreatorOrgs: AccessControlMetadata[] = [];
  private cachedCreatorOrgsSource: AccessControlMetadata[] | null = null;

  get isOwnershipChanging(): boolean {
    return !!(this.ownerId && this.ownerId !== this.currentOwnerId);
  }

  onChangeOwner(value: string): void {
    this.ownerId = value;
    this.ownerIdChange.emit(value);
  }

  getCurrentOwnerName(): string {
    if (!this.currentOwnerId) {
      return '';
    }
    return this.accessControlService.getAccessControlById(this.currentOwnerId)?.name || '';
  }

  getFilteredOrganizations(): AccessControlMetadata[] {
    const orgs = this.accessControlService.checkAdminPermission()
      ? (this.accessControlService.accessControl ?? [])
      : this.creatorRightOrganizations();
    if (!this.ownerOrgFilter) {
      return orgs;
    }
    return orgs.filter((org) => org.name.toLowerCase().includes(this.ownerOrgFilter.toLowerCase()));
  }

  /** Cached per accessControl array instance — the list may load after init. */
  private creatorRightOrganizations(): AccessControlMetadata[] {
    const accessControl = this.accessControlService.accessControl ?? [];
    if (accessControl !== this.cachedCreatorOrgsSource) {
      this.cachedCreatorOrgsSource = accessControl;
      this.cachedCreatorOrgs = collectCreatorRightOrganizations(
        this.accessControlService.currentKomMonitorLoginRoleNames ?? [],
        accessControl
      );
    }
    return this.cachedCreatorOrgs;
  }
}
