import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { SpatialUnitOverviewType } from 'models/data-management-api';

/**
 * Spatial-unit metadata store. Extracted in the Prio 7 god-service split
 * (see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * Holds the available spatial-unit collection + id-lookup map.
 */
@Injectable({
  providedIn: 'root',
})
export class SpatialUnitMetadataStoreService {
  // Signal-backed so reactive consumers (computed/templates) re-derive on change,
  // while existing imperative reads/assignments keep working via the getter/setter shim.
  private _availableSpatialUnits = signal<SpatialUnitOverviewType[]>([]);
  get availableSpatialUnits(): SpatialUnitOverviewType[] {
    return this._availableSpatialUnits();
  }
  set availableSpatialUnits(value: SpatialUnitOverviewType[]) {
    this._availableSpatialUnits.set(value);
  }
  availableSpatialUnits_map = new Map<string, SpatialUnitOverviewType>();

  /** Stream over the signal for rxjs consumers (e.g. the admin overview page). */
  readonly availableSpatialUnits$ = toObservable(this._availableSpatialUnits);

  setSpatialUnits(spatialUnitsArray: SpatialUnitOverviewType[]) {
    this.availableSpatialUnits_map = new Map(spatialUnitsArray.map((u) => [u.spatialUnitId, u]));
    this.availableSpatialUnits = Array.from(this.availableSpatialUnits_map.values());
  }

  getSpatialUnitMetadataById(spatialUnitId: string): SpatialUnitOverviewType | undefined {
    return this.availableSpatialUnits_map.get(spatialUnitId);
  }

  addSingleSpatialUnitMetadata(spatialUnitMetadata: SpatialUnitOverviewType) {
    const withDefaults = {
      ...spatialUnitMetadata,
      userPermissions: spatialUnitMetadata.userPermissions || [],
    };
    this.availableSpatialUnits_map.set(withDefaults.spatialUnitId, withDefaults);
    this.availableSpatialUnits = [withDefaults, ...this.availableSpatialUnits];
  }

  replaceSingleSpatialUnitMetadata(spatialUnitMetadata: SpatialUnitOverviewType) {
    const withDefaults = {
      ...spatialUnitMetadata,
      userPermissions: spatialUnitMetadata.userPermissions || [],
    };
    const index = this.availableSpatialUnits.findIndex(
      (u) => u.spatialUnitId === withDefaults.spatialUnitId
    );
    if (index !== -1) {
      this.availableSpatialUnits = this.availableSpatialUnits.map((it, i) =>
        i === index ? withDefaults : it
      );
    }
    this.availableSpatialUnits_map.set(withDefaults.spatialUnitId, withDefaults);
  }

  deleteSingleSpatialUnitMetadata(spatialUnitId: string) {
    this.availableSpatialUnits = this.availableSpatialUnits.filter(
      (u) => u.spatialUnitId !== spatialUnitId
    );
    this.availableSpatialUnits_map.delete(spatialUnitId);
  }
}
