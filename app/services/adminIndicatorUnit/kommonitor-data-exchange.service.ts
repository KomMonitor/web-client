import { Injectable, Inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KommonitorIndicatorDataExchangeService {
  // Private subjects for reactive updates if needed in the future
  private indicatorsSubject = new BehaviorSubject<any[]>([]);
  public indicators$ = this.indicatorsSubject.asObservable();

  constructor(
    @Inject('kommonitorDataExchangeService') private angularJsDataExchangeService: any
  ) {}

  /**
   * Get available indicators - delegates to AngularJS service
   */
  get availableIndicators(): any[] {
    return this.angularJsDataExchangeService.availableIndicators || [];
  }

  /**
   * Get current Keycloak login roles - delegates to AngularJS service
   */
  get currentKeycloakLoginRoles(): string[] {
    return this.angularJsDataExchangeService.currentKeycloakLoginRoles || [];
  }

  /**
   * Get base URL to KomMonitor Data API - delegates to AngularJS service
   */
  get baseUrlToKomMonitorDataAPI(): string {
    return this.angularJsDataExchangeService.baseUrlToKomMonitorDataAPI || '';
  }

  /**
   * Fetches indicators metadata - delegates to AngularJS service
   */
  async fetchIndicatorsMetadata(keycloakRolesArray: string[]): Promise<any> {
    return this.angularJsDataExchangeService.fetchIndicatorsMetadata(keycloakRolesArray);
  }

  /**
   * Adds a single indicator metadata - delegates to AngularJS service
   */
  addSingleIndicatorMetadata(indicatorMetadata: any): void {
    this.angularJsDataExchangeService.addSingleIndicatorMetadata(indicatorMetadata);
    // Emit the updated data for any reactive components
    this.indicatorsSubject.next(this.availableIndicators);
  }

  /**
   * Replaces a single indicator metadata - delegates to AngularJS service
   */
  replaceSingleIndicatorMetadata(indicatorMetadata: any): void {
    this.angularJsDataExchangeService.replaceSingleIndicatorMetadata(indicatorMetadata);
    // Emit the updated data for any reactive components
    this.indicatorsSubject.next(this.availableIndicators);
  }

  /**
   * Deletes a single indicator metadata - delegates to AngularJS service
   */
  deleteSingleIndicatorMetadata(indicatorId: string): void {
    this.angularJsDataExchangeService.deleteSingleIndicatorMetadata(indicatorId);
    // Emit the updated data for any reactive components
    this.indicatorsSubject.next(this.availableIndicators);
  }

  /**
   * Gets indicator metadata by ID - delegates to AngularJS service
   */
  getIndicatorMetadataById(indicatorId: string): any {
    return this.angularJsDataExchangeService.getIndicatorMetadataById(indicatorId);
  }

  /**
   * Checks if the current user has create permissions - delegates to AngularJS service
   */
  checkCreatePermission(): boolean {
    return this.angularJsDataExchangeService.checkCreatePermission();
  }

  /**
   * Checks if the current user has editor permissions - delegates to AngularJS service
   */
  checkEditorPermission(): boolean {
    return this.angularJsDataExchangeService.checkEditorPermission();
  }

  /**
   * Checks if the current user has delete permissions - delegates to AngularJS service
   */
  checkDeletePermission(): boolean {
    return this.angularJsDataExchangeService.checkDeletePermission();
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
   * Syntax highlight JSON - delegates to AngularJS service
   */
  syntaxHighlightJSON(json: any): string {
    return this.angularJsDataExchangeService.syntaxHighlightJSON(json);
  }
} 