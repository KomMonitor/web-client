import { inject, Injectable } from '@angular/core';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * Holds the geometry-simplification request config used when building Data
 * Management API URLs for spatial resources: the query parameter name and its
 * value. Extracted in the Prio 7 god-service split
 * (see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 */
@Injectable({
  providedIn: 'root',
})
export class GeometrySimplificationService {
  private envConfigService = inject(EnvConfigService);

  simplifyGeometriesParameterName: any = this.envConfigService.simplifyGeometriesParameterName;
  simplifyGeometries: any = this.envConfigService.simplifyGeometries;
}
