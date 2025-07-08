import { Injectable, Inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KommonitorDataExchangeService {
  // Private subjects for reactive updates if needed in the future
  private spatialUnitsSubject = new BehaviorSubject<any[]>([]);
  public spatialUnits$ = this.spatialUnitsSubject.asObservable();

  constructor(
    @Inject('kommonitorDataExchangeService') private angularJsDataExchangeService: any
  ) {}

  /**
   * Get available spatial units - delegates to AngularJS service
   */
  get availableSpatialUnits(): any[] {
    return this.angularJsDataExchangeService.availableSpatialUnits || [];
  }

  /**
   * Get current Keycloak login roles - delegates to AngularJS service
   */
  get currentKeycloakLoginRoles(): string[] {
    return this.angularJsDataExchangeService.currentKeycloakLoginRoles || [];
  }

  /**
   * Get spatial units map - delegates to AngularJS service
   */
  get availableSpatialUnits_map(): Map<string, any> {
    return this.angularJsDataExchangeService.availableSpatialUnits_map || new Map();
  }

  /**
   * Fetches spatial units metadata - delegates to AngularJS service
   */
  async fetchSpatialUnitsMetadata(keycloakRolesArray: string[]): Promise<any> {
    return this.angularJsDataExchangeService.fetchSpatialUnitsMetadata(keycloakRolesArray);
  }

  /**
   * Adds a single spatial unit metadata - delegates to AngularJS service
   */
  addSingleSpatialUnitMetadata(spatialUnitMetadata: any): void {
    this.angularJsDataExchangeService.addSingleSpatialUnitMetadata(spatialUnitMetadata);
    // Emit the updated data for any reactive components
    this.spatialUnitsSubject.next(this.availableSpatialUnits);
  }

  /**
   * Replaces a single spatial unit metadata - delegates to AngularJS service
   */
  replaceSingleSpatialUnitMetadata(spatialUnitMetadata: any): void {
    this.angularJsDataExchangeService.replaceSingleSpatialUnitMetadata(spatialUnitMetadata);
    // Emit the updated data for any reactive components
    this.spatialUnitsSubject.next(this.availableSpatialUnits);
  }

  /**
   * Deletes a single spatial unit metadata - delegates to AngularJS service
   */
  deleteSingleSpatialUnitMetadata(spatialUnitId: string): void {
    this.angularJsDataExchangeService.deleteSingleSpatialUnitMetadata(spatialUnitId);
    // Emit the updated data for any reactive components
    this.spatialUnitsSubject.next(this.availableSpatialUnits);
  }

  /**
   * Checks if the current user has create permissions - delegates to AngularJS service
   */
  checkCreatePermission(): boolean {
    return this.angularJsDataExchangeService.checkCreatePermission();
  }

  /**
   * Gets spatial unit metadata by ID - delegates to AngularJS service
   */
  getSpatialUnitMetadataById(spatialUnitId: string): any {
    return this.angularJsDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
  }

  /**
   * Sets the current Keycloak login roles - delegates to AngularJS service
   */
  setCurrentKeycloakLoginRoles(roles: string[]): void {
    this.angularJsDataExchangeService.currentKeycloakLoginRoles = roles;
  }

  /**
   * Display map application error - delegates to AngularJS service
   */
  displayMapApplicationError(error: any): void {
    this.angularJsDataExchangeService.displayMapApplicationError(error);
  }

  /**
   * Get all allowed roles string - delegates to AngularJS service
   */
  getAllowedRolesString(permissions: any): string {
    return this.angularJsDataExchangeService.getAllowedRolesString(permissions);
  }

  /**
   * Get role title - delegates to AngularJS service
   */
  getRoleTitle(roleId: string): string {
    return this.angularJsDataExchangeService.getRoleTitle(roleId);
  }

  /**
   * Fetch indicators metadata - delegates to AngularJS service
   */
  async fetchIndicatorsMetadata(keycloakRolesArray: string[]): Promise<any> {
    return this.angularJsDataExchangeService.fetchIndicatorsMetadata(keycloakRolesArray);
  }

  /**
   * Get base URL to KomMonitor Data API - delegates to AngularJS service
   */
  get baseUrlToKomMonitorDataAPI(): string {
    return this.angularJsDataExchangeService.baseUrlToKomMonitorDataAPI || '';
  }

  /**
   * Syntax highlight JSON - delegates to AngularJS service
   */
  syntaxHighlightJSON(json: any): string {
    return this.angularJsDataExchangeService.syntaxHighlightJSON(json);
  }
} 