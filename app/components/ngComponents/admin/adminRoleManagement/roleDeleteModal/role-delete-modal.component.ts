import { Component, OnDestroy, OnInit, Inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'role-delete-modal-new',
  templateUrl: './role-delete-modal.component.html',
  styleUrls: ['./role-delete-modal.component.css']
})
export class RoleDeleteModalComponent implements OnInit, OnDestroy {

  elementsToDelete: any[] = [];
  loadingData: boolean = false;

  successfullyDeletedDatasets: any[] = [];
  failedDatasetsAndErrors: [any, string][] = [];

  affectedSpatialUnits: any[] = [];
  affectedGeoresources: any[] = [];
  affectedIndicators: any[] = [];

  organizationalChildrenEffected: boolean = false;

  showSuccessAlert: boolean = false;
  showErrorAlert: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    @Inject('kommonitorDataExchangeService') public kommonitorDataExchangeService: any,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (this.elementsToDelete && this.elementsToDelete.length > 0) {
      this.onDeleteOrganizationalUnit(this.elementsToDelete);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  onDeleteOrganizationalUnit(datasets: any[]): void {
    try { console.debug('[RoleDeleteModal] Init delete with datasets', (datasets || []).map(d => d?.organizationalUnitId)); } catch {}
    this.resetRolesDeleteForm();
    // Filter out system orgs like legacy behavior
    const originalSize = datasets.length;
    const filtered = (datasets || []).filter((org: any) => org.name !== 'public' && org.name !== 'kommonitor');
    this.elementsToDelete = filtered;
    try { console.debug('[RoleDeleteModal] elementsToDelete', this.elementsToDelete.map(d => d?.organizationalUnitId)); } catch {}
    if (filtered.length < originalSize) {
      this.failedDatasetsAndErrors.push([{ name: 'public / kommonitor' }, 'System Organisationseinheiten können nicht gelöscht werden! Die betroffene Einheit wurde aus der Liste entfernt.']);
      this.showErrorAlert = true;
    }

    this.affectedSpatialUnits = this.gatherAffectedSpatialUnits();
    this.affectedGeoresources = this.gatherAffectedGeoresources();
    this.affectedIndicators = this.gatherAffectedIndicators();

    this.organizationalChildrenEffected = this.hasOrganizationalChildren();
    try { console.debug('[RoleDeleteModal] affected counts', { su: this.affectedSpatialUnits.length, gr: this.affectedGeoresources.length, ind: this.affectedIndicators.length }); } catch {}
  }

  private hasOrganizationalChildren(): boolean {
    try {
      const map = new Map<string, any>();
      (this.kommonitorDataExchangeService.accessControl || []).forEach((unit: any) => map.set(unit.organizationalUnitId, unit));
      return (this.elementsToDelete || []).some((unit: any) => {
        const curr = map.get(unit.organizationalUnitId);
        return !!(curr && curr.children && curr.children.length > 0);
      });
    } catch {
      return false;
    }
  }

  resetRolesDeleteForm(): void {
    this.loadingData = false;
    this.successfullyDeletedDatasets = [];
    this.failedDatasetsAndErrors = [];
    this.affectedSpatialUnits = [];
    this.affectedGeoresources = [];
    this.affectedIndicators = [];
    this.hideSuccessAlert();
    this.hideErrorAlert();
  }

  gatherAffectedSpatialUnits(): any[] {
    const affected: any[] = [];
    const spatialUnits = this.kommonitorDataExchangeService.availableSpatialUnits || [];
    for (const spatialUnit of spatialUnits) {
      const allowedRoles = spatialUnit.allowedRoles || [];
      for (const dataset of this.elementsToDelete) {
        if (allowedRoles.includes(dataset.organizationalUnitId)) {
          affected.push(spatialUnit);
          break;
        }
      }
    }
    return affected;
  }

  gatherAffectedGeoresources(): any[] {
    const affected: any[] = [];
    const georesources = this.kommonitorDataExchangeService.availableGeoresources || [];
    for (const geo of georesources) {
      const allowedRoles = geo.allowedRoles || [];
      for (const dataset of this.elementsToDelete) {
        if (allowedRoles.includes(dataset.organizationalUnitId)) {
          affected.push(geo);
          break;
        }
      }
    }
    return affected;
  }

  gatherAffectedIndicators(): any[] {
    const affected: any[] = [];
    const indicators = this.kommonitorDataExchangeService.availableIndicators || [];
    for (const indicator of indicators) {
      const allowedRolesMetadata = indicator.allowedRoles || [];
      let isAffected = false;
      for (const dataset of this.elementsToDelete) {
        if (allowedRolesMetadata.includes(dataset.organizationalUnitId)) {
          isAffected = true;
          break;
        }
        const applicableSpatialUnits = indicator.applicableSpatialUnits || [];
        for (const applicableSpatialUnit of applicableSpatialUnits) {
          if ((applicableSpatialUnit.allowedRoles || []).includes(dataset.organizationalUnitId)) {
            isAffected = true;
            break;
          }
        }
        if (isAffected) { break; }
      }
      if (isAffected) {
        affected.push(indicator);
      }
    }
    return affected;
  }

  isDeleteDisabled(): boolean {
    return this.elementsToDelete.length === 0 || this.affectedSpatialUnits.length > 0 || this.affectedGeoresources.length > 0 || this.affectedIndicators.length > 0 || this.organizationalChildrenEffected;
  }

  deleteOrganizationalUnits(): void {
    this.loadingData = true;
    const deleteCalls = this.elementsToDelete.map(ds => this.getDeleteDatasetObservable(ds));
    if (deleteCalls.length === 0) {
      this.loadingData = false;
      return;
    }
    forkJoin(deleteCalls).subscribe({
      next: () => this.handleDeleteResults(),
      error: () => this.handleDeleteResults()
    });
  }

  private getDeleteDatasetObservable(dataset: any) {
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/organizationalUnits/${dataset.organizationalUnitId}`;
    return this.http.delete(url).pipe(
      tap(() => {
        this.successfullyDeletedDatasets.push(dataset);
        // remove from local array if present
        const roles = this.kommonitorDataExchangeService.availableRoles || [];
        const idx = roles.findIndex((r: any) => r.organizationalUnitId === dataset.organizationalUnitId);
        if (idx > -1) {
          roles.splice(idx, 1);
        }
      }),
      catchError((error) => {
        const message = error && error.error ? this.kommonitorDataExchangeService.syntaxHighlightJSON(error.error) : this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        this.failedDatasetsAndErrors.push([dataset, message]);
        return of(null);
      })
    );
  }

  private handleDeleteResults(): void {
    if (this.failedDatasetsAndErrors.length > 0) {
      this.showErrorAlert = true;
    }
    if (this.successfullyDeletedDatasets.length > 0) {
      this.showSuccessAlert = true;
      // Parent should refresh table after modal closes
    }
    setTimeout(() => {
      this.loadingData = false;
    }, 300);
  }

  hideSuccessAlert(): void { this.showSuccessAlert = false; }
  hideErrorAlert(): void { this.showErrorAlert = false; }

  cancel(): void { this.activeModal.dismiss('cancel'); }

  trackByIndex(index: number): number { return index; }
}


