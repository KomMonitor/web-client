import { Injectable } from '@angular/core';

/**
 * Holds the geometry-simplification request config used when building Data
 * Management API URLs for spatial resources: the query parameter name and its
 * value. Extracted from DataExchangeService (Prio 7 god-service split, B-Rest
 * cluster "geometry simplification").
 */
@Injectable({
  providedIn: 'root',
})
export class GeometrySimplificationService {
  simplifyGeometriesParameterName: any;
  simplifyGeometries: any;
}
