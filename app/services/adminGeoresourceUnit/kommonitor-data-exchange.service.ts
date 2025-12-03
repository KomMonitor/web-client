import { Injectable, Inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Injectable({
  providedIn: 'root'
})
export class KommonitorGeoresourceDataExchangeService {
  // Private subjects for reactive updates if needed in the future
  private georesourcesSubject = new BehaviorSubject<any[]>([]);
  public georesources$ = this.georesourcesSubject.asObservable();

  constructor(
    private angularJsDataExchangeService: DataExchangeService
  ) {}

  /**
   * Get available georesources - delegates to AngularJS service
   */
  get availableGeoresources(): any[] {
    return this.angularJsDataExchangeService.availableGeoresources || [];
  }

  /**
   * Get current Keycloak login roles - delegates to AngularJS service
   */
  get currentKeycloakLoginRoles(): string[] {
    return this.angularJsDataExchangeService.currentKeycloakLoginRoles || [];
  }

  /**
   * Check create permission - delegates to AngularJS service
   */
  checkCreatePermission(): boolean {
    return this.angularJsDataExchangeService.checkCreatePermission();
  }

  /**
   * Check editor permission - delegates to AngularJS service
   */
  checkEditorPermission(): boolean {
    return this.angularJsDataExchangeService.checkEditorPermission();
  }

  /**
   * Check delete permission - delegates to AngularJS service
   */
  checkDeletePermission(): boolean {
    return this.angularJsDataExchangeService.checkDeletePermission();
  }

  /**
   * Fetch georesources metadata - delegates to AngularJS service
   */
  async fetchGeoresourcesMetadata(keycloakRolesArray: string[], filter?: any): Promise<void> {
    return this.angularJsDataExchangeService.fetchGeoresourcesMetadata(keycloakRolesArray, filter);
  }

  /**
   * Add single georesource metadata - delegates to AngularJS service
   */
  addSingleGeoresourceMetadata(georesourceMetadata: any): void {
    this.angularJsDataExchangeService.addSingleGeoresourceMetadata(georesourceMetadata);
  }

  /**
   * Replace single georesource metadata - delegates to AngularJS service
   */
  replaceSingleGeoresourceMetadata(georesourceMetadata: any): void {
    this.angularJsDataExchangeService.replaceSingleGeoresourceMetadata(georesourceMetadata);
  }

  /**
   * Delete single georesource metadata - delegates to AngularJS service
   */
  deleteSingleGeoresourceMetadata(georesourceId: string): void {
    this.angularJsDataExchangeService.deleteSingleGeoresourceMetadata(georesourceId);
  }

  /**
   * Get georesource metadata by ID - delegates to AngularJS service
   */
  getGeoresourceMetadataById(georesourceId: string): any {
    return this.angularJsDataExchangeService.getGeoresourceMetadataById(georesourceId);
  }

  /**
   * Get base URL to KomMonitor Data API for spatial resources - delegates to AngularJS service
   */
  getBaseUrlToKomMonitorDataAPI_spatialResource(): string {
    return this.angularJsDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() || '';
  }

  /**
   * Get role title - delegates to AngularJS service
   */
  getRoleTitle(roleId: string): string {
    return this.angularJsDataExchangeService.getRoleTitle(roleId);
  }

  /**
   * Get topic hierarchy display string - delegates to AngularJS service
   */
  getTopicHierarchyDisplayString(topicReference: any): string {
    return this.angularJsDataExchangeService.getTopicHierarchyDisplayString(topicReference);
  }

  /**
   * Get all allowed roles string - delegates to AngularJS service
   */
  getAllowedRolesString(permissions: any): string {
    return this.angularJsDataExchangeService.getAllowedRolesString(permissions);
  }

  /**
   * Get LOI dash SVG from string value - delegates to AngularJS service
   */
  getLoiDashSvgFromStringValue(dashArrayString: string): any {
    return this.angularJsDataExchangeService.getLoiDashSvgFromStringValue(dashArrayString);
  }
} 