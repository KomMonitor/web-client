import { Component, OnDestroy, OnInit, Inject, Input } from '@angular/core';
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

  @Input() initialDatasets: any[] = [];

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
    if (this.initialDatasets && this.initialDatasets.length > 0) {
      this.onDeleteOrganizationalUnit(this.initialDatasets);
    } else if (this.elementsToDelete && this.elementsToDelete.length > 0) {
      this.onDeleteOrganizationalUnit(this.elementsToDelete);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  onDeleteOrganizationalUnit(datasets: any[]): void {
    try { console.debug('[RoleDeleteModal] Init delete with datasets', (datasets || []).map(d => d?.organizationalUnitId)); } catch {}
    this.resetRolesDeleteForm();
    // include children like legacy AngularJS behavior
    const withChildren = this.fetchOrganizationalChildren(datasets || []);
    // Filter out system orgs like legacy behavior
    const originalSize = withChildren.length;
    const filtered = (withChildren || []).filter((org: any) => org.name !== 'public' && org.name !== 'kommonitor');
    this.elementsToDelete = filtered;
    try { console.debug('[RoleDeleteModal] elementsToDelete', this.elementsToDelete.map(d => d?.organizationalUnitId)); } catch {}
    if (filtered.length < originalSize) {
      this.failedDatasetsAndErrors.push([{ name: 'public / kommonitor' }, 'System Organisationseinheiten können nicht gelöscht werden! Die betroffene Einheit wurde aus der Liste entfernt.']);
      this.showErrorAlert = true;
    }

    this.affectedSpatialUnits = this.gatherAffectedSpatialUnits();
    this.affectedGeoresources = this.gatherAffectedGeoresources();
    this.affectedIndicators = this.gatherAffectedIndicators();

    // keep flag consistent in case no children were added but parent has any
    this.organizationalChildrenEffected = this.organizationalChildrenEffected || this.hasOrganizationalChildren();
    try { console.debug('[RoleDeleteModal] affected counts', { su: this.affectedSpatialUnits.length, gr: this.affectedGeoresources.length, ind: this.affectedIndicators.length }); } catch {}
  }

  private fetchOrganizationalChildren(datasets: any[]): any[] {
    try {
      this.organizationalChildrenEffected = false;
      const accessControl: any[] = this.kommonitorDataExchangeService.accessControl || [];
      const result: any[] = [...(datasets || [])];
      const selectedIds = new Set<string>(result.map(e => e?.organizationalUnitId).filter(Boolean));
      // iterate over a snapshot of current result to avoid infinite loop while pushing
      const parentsSnapshot = [...result];
      for (const parent of parentsSnapshot) {
        const children: string[] = (parent && parent.children) ? parent.children : [];
        for (const childId of children) {
          const child = accessControl.find((e: any) => e && e.organizationalUnitId === childId);
          if (child && !selectedIds.has(child.organizationalUnitId)) {
            const childWithFlag = { ...child, subGroup: true };
            result.push(childWithFlag);
            selectedIds.add(child.organizationalUnitId);
            this.organizationalChildrenEffected = true;
          }
        }
      }
      return result;
    } catch {
      return datasets || [];
    }
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
    try {
      const spatialUnits = this.kommonitorDataExchangeService.availableSpatialUnits || [];
      for (const spatialUnit of spatialUnits) {
        const permissions: string[] = spatialUnit?.permissions || [];
        for (const dataset of this.elementsToDelete) {
          const datasetPermissions = (dataset?.permissions || []).map((p: any) => p.permissionId);
          const overlaps = permissions && datasetPermissions && permissions.some((p: string) => datasetPermissions.includes(p));
          if (overlaps) {
            const connectedItems: any[] = [];
            (permissions || []).forEach((permissionId: string) => {
              const match = (dataset?.permissions || []).find((p: any) => p.permissionId === permissionId);
              if (match) {
                connectedItems.push({
                  name: dataset?.name,
                  permission: match.permissionLevel,
                  subGroup: !!dataset?.subGroup
                });
              }
            });
            const enriched = { ...spatialUnit, connectedItems };
            affected.push(enriched);
            break;
          }
        }
      }
    } catch {}
    return affected;
  }

  gatherAffectedGeoresources(): any[] {
    const affected: any[] = [];
    try {
      const georesources = this.kommonitorDataExchangeService.availableGeoresources || [];
      for (const georesource of georesources) {
        const permissions: string[] = georesource?.permissions || [];
        for (const dataset of this.elementsToDelete) {
          const datasetPermissions = (dataset?.permissions || []).map((p: any) => p.permissionId);
          const overlaps = permissions && datasetPermissions && permissions.some((p: string) => datasetPermissions.includes(p));
          if (overlaps) {
            const connectedItems: any[] = [];
            (permissions || []).forEach((permissionId: string) => {
              const match = (dataset?.permissions || []).find((p: any) => p.permissionId === permissionId);
              if (match) {
                connectedItems.push({
                  name: dataset?.name,
                  permission: match.permissionLevel,
                  subGroup: !!dataset?.subGroup
                });
              }
            });
            const enriched = { ...georesource, connectedItems };
            affected.push(enriched);
            break;
          }
        }
      }
    } catch {}
    return affected;
  }

  gatherAffectedIndicators(): any[] {
    const affected: any[] = [];
    try {
      const indicators = this.kommonitorDataExchangeService.availableIndicators || [];
      for (const indicator of indicators) {
        const permissions_metadata: string[] = indicator?.permissions || [];
        let found = false;
        let temp_indicator: any = { ...indicator };
        for (const dataset of this.elementsToDelete) {
          const datasetPermissions = (dataset?.permissions || []).map((p: any) => p.permissionId);
          const applicableSpatialUnits = indicator?.applicableSpatialUnits || [];

          // Base indicator-level connections
          let connectedItems: any[] = temp_indicator.connectedItems || [];
          const overlapsBase = permissions_metadata && datasetPermissions && permissions_metadata.some((p: string) => datasetPermissions.includes(p));
          if (overlapsBase) {
            (permissions_metadata || []).forEach((permissionId: string) => {
              const match = (dataset?.permissions || []).find((p: any) => p.permissionId === permissionId);
              if (match) {
                connectedItems.push({
                  name: dataset?.name,
                  permission: match.permissionLevel,
                  subGroup: !!dataset?.subGroup
                });
              }
            });
            temp_indicator.connectedItems = connectedItems;
            found = true;
          }

          // Spatial unit specific connections
          const connectedSpatialUnits: any[] = [];
          for (const applicableSpatialUnit of applicableSpatialUnits) {
            const permissions_SU: string[] = applicableSpatialUnit?.permissions || [];
            const overlapsSU = permissions_SU && datasetPermissions && permissions_SU.some((p: string) => datasetPermissions.includes(p));
            if (overlapsSU) {
              const spatialItem = { name: applicableSpatialUnit?.spatialUnitName, ids: [] as any[] };
              (permissions_SU || []).forEach((permissionId: string) => {
                const match = (dataset?.permissions || []).find((p: any) => p.permissionId === permissionId);
                if (match) {
                  // Ensure base connectedItems have an entry too if not found earlier
                  if (!found) {
                    connectedItems.push({
                      name: dataset?.name,
                      permission: match.permissionLevel,
                      subGroup: !!dataset?.subGroup
                    });
                  }
                  spatialItem.ids.push({
                    name: dataset?.name,
                    permission: match.permissionLevel,
                    subGroup: !!dataset?.subGroup
                  });
                }
              });
              if (spatialItem.ids.length > 0) {
                temp_indicator.connectedItems = connectedItems; // ensure present
                connectedSpatialUnits.push(spatialItem);
                found = true;
              }
            }
          }
          if (connectedSpatialUnits.length > 0) {
            temp_indicator.connectedSpatialUnits = connectedSpatialUnits;
          }

          if (found) {
            affected.push(temp_indicator);
            break; // move to next indicator
          }
        }
      }
    } catch {}
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


