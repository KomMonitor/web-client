import { Injectable, signal } from '@angular/core';
import { SpatialUnitOverviewType } from 'models/data-management-api';

/**
 * Spatial-unit metadata store extracted from DataExchangeService
 * (Prio 7 / B6a — see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * First of the domain metadata stores. Holds the available spatial-unit collection
 * + id-lookup map; the DataExchangeService facade re-exposes availableSpatialUnits via
 * a getter so its ~23 consumers stay unchanged.
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

  setSpatialUnits(spatialUnitsArray: SpatialUnitOverviewType[]) {
    this.availableSpatialUnits_map = new Map(spatialUnitsArray.map((u) => [u.spatialUnitId, u]));
    this.availableSpatialUnits = Array.from(this.availableSpatialUnits_map.values());
  }

  getSpatialUnitMetadataById(spatialUnitId: string): SpatialUnitOverviewType | undefined {
    return this.availableSpatialUnits_map.get(spatialUnitId);
  }
}
