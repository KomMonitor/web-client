import { Injectable } from '@angular/core';

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
  availableSpatialUnits: any[] = [];
  availableSpatialUnits_map = new Map();

  setSpatialUnits(spatialUnitsArray) {
    this.availableSpatialUnits_map = new Map(spatialUnitsArray.map((u) => [u.spatialUnitId, u]));
    this.availableSpatialUnits = Array.from(this.availableSpatialUnits_map.values());
  }

  getSpatialUnitMetadataById(spatialUnitId) {
    return this.availableSpatialUnits_map.get(spatialUnitId);
  }
}
