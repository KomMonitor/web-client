import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, map, tap, firstValueFrom } from 'rxjs';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { SpatialUnitOverviewType } from 'models/data-management-api';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import {
  LABELED_LOI_DASH_ARRAY_OBJECTS,
  SPATIAL_UNIT_METADATA_STRUCTURE,
  buildMappingConfigExport,
  buildSpatialUnitMetadataExport,
  buildSpatialUnitMetadataPatchBody,
  extractRemainingHeaders,
  transformFeaturesForGrid,
  validatePeriodOfValidity,
  validateSpatialUnitMetadata,
} from './spatial-unit-metadata.util';

/**
 * Legacy exported names kept for the many importers of this service; the
 * canonical definitions live in models/data-management-api (generated from the
 * OpenAPI spec) and components/ngComponents/models/permissions.models.
 */
export type SpatialUnitMetadata = SpatialUnitOverviewType;
export type { AccessControlMetadata };

/**
 * Thin facade over the canonical admin services (step 4 of the admin
 * refactoring — see documentation/ADMIN_REFACTORING_ANALYSIS.md), mirroring
 * the georesource facade in adminGeoresourceUnit.
 *
 * Despite its historical name this service was the admin area's de-facto
 * global auth/data service. The former implementation duplicated global
 * state: its own Keycloak polling (1s timer + retries + 30s refresh), its own
 * spatial-units/access-control fetches with a private 5-minute cache, and
 * seven BehaviorSubjects — all shadowing the canonical stores that
 * MetadataBootstrapService populates. All state now lives in
 * AccessControlService / SpatialUnitMetadataStoreService / CacheHelperService;
 * this facade only adapts the legacy API surface for its ~20 consumers.
 */
@Injectable({
  providedIn: 'root',
})
export class KommonitorSpatialUnitDataExchangeService {
  private http = inject(HttpClient);
  private accessControlService = inject(AccessControlService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private envConfigService = inject(EnvConfigService);
  private indicatorValueService = inject(IndicatorValueService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);

  // Loading/error state of the fetches triggered through this facade (the
  // spatial-units overview page binds these).
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  /** Spatial units stream, backed by the canonical store signal. */
  public spatialUnits$ = this.spatialUnitStore.availableSpatialUnits$;

  // ---------------------------------------------------------------------
  // Spatial-unit metadata (delegates to SpatialUnitMetadataStoreService)
  // ---------------------------------------------------------------------

  get availableSpatialUnits(): SpatialUnitMetadata[] {
    return this.spatialUnitStore.availableSpatialUnits;
  }

  get availableSpatialUnits_map(): Map<string, SpatialUnitMetadata> {
    return this.spatialUnitStore.availableSpatialUnits_map;
  }

  getSpatialUnitMetadataById(spatialUnitId: string): SpatialUnitMetadata | null {
    return this.spatialUnitStore.getSpatialUnitMetadataById(spatialUnitId) ?? null;
  }

  addSingleSpatialUnitMetadata(spatialUnitMetadata: SpatialUnitMetadata): void {
    this.spatialUnitStore.addSingleSpatialUnitMetadata(spatialUnitMetadata);
  }

  replaceSingleSpatialUnitMetadata(spatialUnitMetadata: SpatialUnitMetadata): void {
    this.spatialUnitStore.replaceSingleSpatialUnitMetadata(spatialUnitMetadata);
  }

  deleteSingleSpatialUnitMetadata(spatialUnitId: string): void {
    this.spatialUnitStore.deleteSingleSpatialUnitMetadata(spatialUnitId);
  }

  /**
   * Re-fetch the spatial units into the canonical store. Returns the fresh
   * list for legacy subscribers; the overview page also listens on
   * spatialUnits$.
   */
  fetchSpatialUnitsMetadata(keycloakRolesArray: string[]): Observable<SpatialUnitMetadata[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    return from(this.metadataBootstrap.fetchSpatialUnitsMetadata(keycloakRolesArray)).pipe(
      map(() => this.spatialUnitStore.availableSpatialUnits),
      tap({
        next: () => this.loadingSubject.next(false),
        error: (error) => {
          this.errorSubject.next(this.formatErrorMessage(error));
          this.loadingSubject.next(false);
        },
      })
    );
  }

  // ---------------------------------------------------------------------
  // Access control / roles (delegates to AccessControlService)
  // ---------------------------------------------------------------------

  get accessControl(): AccessControlMetadata[] {
    return this.accessControlService.accessControl;
  }

  get currentKeycloakLoginRoles(): string[] {
    return this.accessControlService.currentKeycloakLoginRoles;
  }

  get currentKomMonitorLoginRoleNames(): string[] {
    return this.accessControlService.currentKomMonitorLoginRoleNames;
  }

  getAccessControlById(id: string): AccessControlMetadata | undefined {
    return this.accessControlService.getAccessControlById(id) ?? undefined;
  }

  getAllowedRolesString(permissions: string[] | null | undefined): string {
    return this.accessControlService.getAllowedRolesString(permissions);
  }

  getRoleTitle(roleId: string): string {
    return this.accessControlService.getRoleTitle(roleId);
  }

  checkAdminPermission(): boolean {
    return this.accessControlService.checkAdminPermission();
  }

  checkCreatePermission(): boolean {
    return this.accessControlService.checkCreatePermission();
  }

  /**
   * Re-fetch the access-control list into the canonical service and emit it.
   * The useCache flag of the former private 5-minute cache is obsolete — the
   * central cache helper decides on caching.
   */
  fetchAccessControlMetadata(_useCache: boolean): Observable<AccessControlMetadata[]> {
    return from(
      this.metadataBootstrap.fetchAccessControlMetadata(this.currentKeycloakLoginRoles)
    ).pipe(map(() => this.accessControlService.accessControl));
  }

  // ---------------------------------------------------------------------
  // Indicators (delegates to MetadataBootstrapService)
  // ---------------------------------------------------------------------

  /**
   * Re-fetch the indicators into the canonical store. Returns a promise: the
   * former Observable return value was awaited by its only consumer, which
   * never subscribed — the fetch silently never ran.
   */
  fetchIndicatorsMetadata(keycloakRolesArray: string[]): Promise<void> {
    return this.metadataBootstrap.fetchIndicatorsMetadata(keycloakRolesArray);
  }

  // ---------------------------------------------------------------------
  // Config / URLs (delegates to EnvConfigService / CacheHelperService)
  // ---------------------------------------------------------------------

  get enableKeycloakSecurity(): boolean {
    return this.envConfigService.enableKeycloakSecurity || false;
  }

  get baseUrlToKomMonitorDataAPI(): string {
    return this.envConfigService.baseUrlToKomMonitorDataAPI;
  }

  getBaseUrlToKomMonitorDataAPI_spatialResource(): string {
    return this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource();
  }

  get updateIntervalOptions(): any[] {
    return this.envConfigService.updateIntervalOptions || [];
  }

  get availableLoiDashArrayObjects(): any[] {
    return LABELED_LOI_DASH_ARRAY_OBJECTS;
  }

  // ---------------------------------------------------------------------
  // Metadata form helpers (delegates to spatial-unit-metadata.util)
  // ---------------------------------------------------------------------

  get spatialUnitMetadataStructure() {
    return SPATIAL_UNIT_METADATA_STRUCTURE;
  }

  validateSpatialUnitMetadata = validateSpatialUnitMetadata;
  validatePeriodOfValidity = validatePeriodOfValidity;
  buildSpatialUnitMetadataPatchBody = buildSpatialUnitMetadataPatchBody;
  buildSpatialUnitMetadataExport = buildSpatialUnitMetadataExport;
  buildMappingConfigExport = buildMappingConfigExport;
  transformFeaturesForGrid = transformFeaturesForGrid;
  extractRemainingHeaders = extractRemainingHeaders;

  // ---------------------------------------------------------------------
  // Error formatting (delegates to IndicatorValueService)
  // ---------------------------------------------------------------------

  syntaxHighlightJSON(json: any): string {
    return this.indicatorValueService.syntaxHighlightJSON(json);
  }

  formatErrorMessage(error: any): string {
    return this.indicatorValueService.formatError(error);
  }

  // ---------------------------------------------------------------------
  // Spatial-unit deletion (the facade's only own HTTP calls)
  // ---------------------------------------------------------------------

  async deleteSpatialUnit(spatialUnitId: string): Promise<boolean> {
    try {
      const url = `${this.baseUrlToKomMonitorDataAPI}/spatial-units/${spatialUnitId}`;
      await firstValueFrom(this.http.delete(url));
      return true;
    } catch {
      return false;
    }
  }

  async bulkDeleteSpatialUnits(spatialUnitIds: string[]): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of spatialUnitIds) {
      try {
        const success = await this.deleteSpatialUnit(id);
        if (success) {
          successful.push(id);
          this.deleteSingleSpatialUnitMetadata(id);
        } else {
          failed.push({ id, error: 'Deletion failed' });
        }
      } catch (error) {
        failed.push({ id, error: this.formatErrorMessage(error) });
      }
    }

    return { successful, failed };
  }
}
