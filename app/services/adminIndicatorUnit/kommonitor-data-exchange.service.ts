import { Injectable, Inject } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { KommonitorIndicatorCacheHelperService } from './kommonitor-cache-helper.service';
import { AuthService } from 'services/auth-service/auth.service';

// Interfaces for type safety
export interface IndicatorMetadata {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  metadata: {
    description: string;
    databasis: string;
    datasource: string;
    contact: string;
    updateInterval: string;
    lastUpdate: string;
    literature: string;
    note: string;
    sridEPSG: number;
  };
  processDescription: string;
  applicableSpatialUnits: any[];
  applicableDates: string[];
  abbreviation: string;
  isHeadlineIndicator: boolean;
  indicatorType: any;
  characteristicValue: string;
  creationType: string;
  tags: string;
  topicReference: any;
  permissions: string[];
  isPublic: boolean;
  ownerId: string;
  precision: number;
  userPermissions: string[];
}

export interface SpatialUnitMetadata {
  spatialUnitId: string;
  spatialUnitName: string;
  spatialUnitLevel: string;
  userPermissions: string[];
}

export interface GeoresourceMetadata {
  georesourceId: string;
  georesourceName: string;
  datasetName?: string; // Optional for backward compatibility
  userPermissions: string[];
}

export interface TopicMetadata {
  topicId: string;
  topicName: string;
  subTopics: TopicMetadata[];
}

@Injectable({
  providedIn: 'root'
})
export class KommonitorIndicatorDataExchangeService {
  // Private subjects for reactive updates
  private indicatorsSubject = new BehaviorSubject<IndicatorMetadata[]>([]);
  private spatialUnitsSubject = new BehaviorSubject<SpatialUnitMetadata[]>([]);
  private georesourcesSubject = new BehaviorSubject<GeoresourceMetadata[]>([]);
  private topicsSubject = new BehaviorSubject<TopicMetadata[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public indicators$ = this.indicatorsSubject.asObservable();
  public spatialUnits$ = this.spatialUnitsSubject.asObservable();
  public georesources$ = this.georesourcesSubject.asObservable();
  public topics$ = this.topicsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  // Cache for data with expiration
  private indicatorsCache: {
    data: IndicatorMetadata[];
    timestamp: number;
    expiresAt: number;
  } | null = null;

  // Cache duration in milliseconds (5 minutes)
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  // Environment configuration
  private readonly env: any;
  private readonly baseUrl: string;

  // Current user state
  private _currentKeycloakLoginRoles: string[] = [];
  private currentKeycloakUser: any = null;

  // Maps for quick access
  private availableIndicators_map = new Map<string, IndicatorMetadata>();
  private availableSpatialUnits_map = new Map<string, SpatialUnitMetadata>();
  private availableGeoresources_map = new Map<string, GeoresourceMetadata>();

  // Cache for topic hierarchy
  private topicHierarchyCache: any[] | null = null;
  private topicHierarchyCacheTimestamp: number = 0;
  private readonly TOPIC_HIERARCHY_CACHE_DURATION = 5000; // 5 seconds

  constructor(
    private http: HttpClient,
    private cacheHelperService: KommonitorIndicatorCacheHelperService,
    private authService: AuthService
  ) {
    // Get environment configuration
    this.env = (window as any).__env;
    this.baseUrl = this.getBaseApiUrl();
    
    console.log("Data Exchange - Environment config:", this.env);
    console.log("Data Exchange - Base URL:", this.baseUrl);
  }

  /**
   * Get available indicators
   */
  get availableIndicators(): IndicatorMetadata[] {
    return this.indicatorsSubject.value;
  }

  /**
   * Get available spatial units
   */
  get availableSpatialUnits(): SpatialUnitMetadata[] {
    return this.spatialUnitsSubject.value;
  }

  /**
   * Get available georesources
   */
  get availableGeoresources(): GeoresourceMetadata[] {
    return this.georesourcesSubject.value;
  }

  /**
   * Get available topics
   */
  get availableTopics(): TopicMetadata[] {
    return this.topicsSubject.value;
  }

  /**
   * Get topic indicator hierarchy for order view
   */
  get topicIndicatorHierarchy_forOrderView(): any[] {
    const now = Date.now();
    
    // Check if cache is still valid
    if (this.topicHierarchyCache && 
        (now - this.topicHierarchyCacheTimestamp) < this.TOPIC_HIERARCHY_CACHE_DURATION) {
      return this.topicHierarchyCache;
    }
    
    // Rebuild cache
    this.topicHierarchyCache = this.buildTopicIndicatorHierarchy();
    this.topicHierarchyCacheTimestamp = now;
    
    return this.topicHierarchyCache;
  }

  /**
   * Get access control
   */
  get accessControl(): any[] {
    return [];
  }

  /**
   * Get update interval options
   */
  get updateIntervalOptions(): any[] {
    return [
      { value: 'ARBITRARY', label: 'beliebig' },
      { value: 'YEARLY', label: 'jährlich' },
      { value: 'HALF_YEARLY', label: 'halbjährig' },
      { value: 'MONTHLY', label: 'monatlich' },
      { value: 'QUARTERLY', label: 'vierteljährlich' }
    ];
  }

  /**
   * Get indicator type options
   */
  get indicatorTypeOptions(): any[] {
    return [
      { value: 'headline', label: 'Leitindikator' },
      { value: 'base', label: 'Basisindikator' },
      { value: 'computed', label: 'Berechneter Indikator' }
    ];
  }

  /**
   * Get indicator unit options
   */
  get indicatorUnitOptions(): any[] {
    return [
      { value: 'percent', label: 'Prozent' },
      { value: 'number', label: 'Anzahl' },
      { value: 'ratio', label: 'Verhältnis' },
      { value: 'custom', label: 'Benutzerdefiniert' }
    ];
  }

  /**
   * Get indicator creation type options
   */
  get indicatorCreationTypeOptions(): any[] {
    return [
      { value: 'manual', label: 'Manuell' },
      { value: 'automatic', label: 'Automatisch' },
      { value: 'import', label: 'Import' }
    ];
  }

  /**
   * Get enable Keycloak security flag
   */
  get enableKeycloakSecurity(): boolean {
    return this.env?.enableKeycloakSecurity || false;
  }

  /**
   * Get current Keycloak login roles
   */
  get currentKeycloakLoginRoles(): string[] {
    return this._currentKeycloakLoginRoles;
  }

  /**
   * Get current KomMonitor login role IDs
   */
  getCurrentKomMonitorLoginRoleIds(): string[] {
    return this.currentKeycloakLoginRoles;
  }

  /**
   * Get base URL to KomMonitor Data API
   */
  get baseUrlToKomMonitorDataAPI(): string {
    return this.baseUrl;
  }

  /**
   * Get base URL to KomMonitor Data API for spatial resources
   */
  getBaseUrlToKomMonitorDataAPI_spatialResource(): string {
    return this.getBaseApiUrl();
  }

  /**
   * Get access control by ID
   */
  getAccessControlById(ownerId: string): any {
    return this.accessControl.find((item: any) => item.organizationalUnitId === ownerId);
  }

  /**
   * Fetches topics metadata
   */
  async fetchTopicsMetadata(keycloakRolesArray: string[]): Promise<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Set the current roles for permission checking
    this.setCurrentKeycloakLoginRoles(keycloakRolesArray);
    console.log("fetchTopicsMetadata", keycloakRolesArray);
    try {
      // Use the cache helper service to fetch topics
      const topics = await this.cacheHelperService.fetchTopicsMetadata(keycloakRolesArray);

      console.log("Data Exchange - Raw topics from cache helper:", topics);
      console.log("Data Exchange - Raw topics length:", topics?.length);
      console.log("Data Exchange - Raw topics type:", typeof topics);

      if (!topics || !Array.isArray(topics)) {
        console.log("Data Exchange - Invalid topics data received");
        this.topicsSubject.next([]);
        this.loadingSubject.next(false);
        return [];
      }

      console.log("Data Exchange - Topics:", topics);
      console.log("Data Exchange - Topics length:", topics.length);
      
      this.topicsSubject.next(topics);
      
      // Invalidate topic hierarchy cache since topics changed
      this.invalidateTopicHierarchyCache();
      
      this.loadingSubject.next(false);
      
      return topics;
    } catch (error) {
      this.handleError(error);
      this.loadingSubject.next(false);
      throw error;
    }
  }

  /**
   * Fetches indicators metadata
   */
  async fetchIndicatorsMetadata(keycloakRolesArray: string[]): Promise<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Set the current roles for permission checking
    this.setCurrentKeycloakLoginRoles(keycloakRolesArray);
    console.log("fetchIndicatorsMetadata", keycloakRolesArray);
    try {
      // Use the cache helper service to fetch indicators (without filter, like original AngularJS service)
      const indicators = await this.cacheHelperService.fetchIndicatorsMetadata(keycloakRolesArray, undefined);

      console.log("Data Exchange - Raw indicators from cache helper:", indicators);
      console.log("Data Exchange - Raw indicators length:", indicators?.length);
      console.log("Data Exchange - Raw indicators type:", typeof indicators);

      if (!indicators || !Array.isArray(indicators)) {
        console.log("Data Exchange - Invalid indicators data received");
        this.indicatorsSubject.next([]);
        this.loadingSubject.next(false);
        return [];
      }

      const modifiedIndicators = this.modifyIndicators(indicators);
      console.log("Data Exchange - Modified indicators:", modifiedIndicators);
      console.log("Data Exchange - Modified indicators length:", modifiedIndicators.length);
      
      // Update cache
      this.indicatorsCache = {
        data: modifiedIndicators,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      };

      // Update maps
      this.availableIndicators_map.clear();
      for (const indicator of modifiedIndicators) {
        this.availableIndicators_map.set(indicator.indicatorId, indicator);
      }

      this.indicatorsSubject.next(modifiedIndicators);
      
      // Invalidate topic hierarchy cache since indicators changed
      this.invalidateTopicHierarchyCache();
      
      // Also fetch topics since they're needed for the topic hierarchy
      try {
        await this.fetchTopicsMetadata(keycloakRolesArray);
      } catch (topicsError) {
        console.log("Data Exchange - Error fetching topics:", topicsError);
        // Don't fail the entire operation if topics fail to load
      }
      
      this.loadingSubject.next(false);
      
      return modifiedIndicators;
    } catch (error) {
      this.handleError(error);
      this.loadingSubject.next(false);
      throw error;
    }
  }

  /**
   * Adds a single indicator metadata
   */
  addSingleIndicatorMetadata(indicatorMetadata: IndicatorMetadata): void {
    const modifiedIndicator = this.modifySingleIndicator(indicatorMetadata);
    const currentIndicators = this.indicatorsSubject.value;
    const updatedIndicators = [modifiedIndicator, ...currentIndicators];
    
    this.availableIndicators_map.set(indicatorMetadata.indicatorId, indicatorMetadata);
    this.indicatorsSubject.next(updatedIndicators);
    
    // Invalidate topic hierarchy cache since indicators changed
    this.invalidateTopicHierarchyCache();
  }

  /**
   * Replaces a single indicator metadata
   */
  replaceSingleIndicatorMetadata(indicatorMetadata: IndicatorMetadata): void {
    const currentIndicators = this.indicatorsSubject.value;
    const modifiedIndicator = this.modifySingleIndicator(indicatorMetadata);
    
    const updatedIndicators = currentIndicators.map(indicator => 
      indicator.indicatorId === indicatorMetadata.indicatorId ? modifiedIndicator : indicator
    );
    
    this.availableIndicators_map.set(indicatorMetadata.indicatorId, indicatorMetadata);
    this.indicatorsSubject.next(updatedIndicators);
    
    // Invalidate topic hierarchy cache since indicators changed
    this.invalidateTopicHierarchyCache();
  }

  /**
   * Deletes a single indicator metadata
   */
  deleteSingleIndicatorMetadata(indicatorId: string): void {
    const currentIndicators = this.indicatorsSubject.value;
    const updatedIndicators = currentIndicators.filter(
      indicator => indicator.indicatorId !== indicatorId
    );
    
    this.availableIndicators_map.delete(indicatorId);
    this.indicatorsSubject.next(updatedIndicators);
    
    // Invalidate topic hierarchy cache since indicators changed
    this.invalidateTopicHierarchyCache();
  }

  /**
   * Gets indicator metadata by ID
   */
  getIndicatorMetadataById(indicatorId: string): IndicatorMetadata | undefined {
    return this.availableIndicators_map.get(indicatorId);
  }

  /**
   * Gets georesource metadata by ID
   */
  getGeoresourceMetadataById(georesourceId: string): GeoresourceMetadata | undefined {
    return this.availableGeoresources_map.get(georesourceId);
  }

  /**
   * Gets topic hierarchy for topic ID
   */
  getTopicHierarchyForTopicId(topicId: string): any {
    // Implementation for topic hierarchy lookup
    return null;
  }

  /**
   * Gets spatial unit metadata by ID
   */
  getSpatialUnitMetadataById(spatialUnitId: string): SpatialUnitMetadata | undefined {
    return this.availableSpatialUnits_map.get(spatialUnitId);
  }

  /**
   * Checks if the current user has create permissions
   */
  checkCreatePermission(): boolean {
    if (this.checkAdminPermission()) {
      return true;
    }
    
    for (const role of this._currentKeycloakLoginRoles) {
      const roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (permissionLevel === "client-resources-creator" || permissionLevel === "unit-resources-creator") {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if the current user has editor permissions
   */
  checkEditorPermission(): boolean {
    if (this.checkAdminPermission()) {
      return true;
    }
    
    for (const role of this._currentKeycloakLoginRoles) {
      const roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (permissionLevel === "client-resources-creator" || permissionLevel === "unit-resources-creator") {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if the current user has delete permissions
   */
  checkDeletePermission(): boolean {
    if (this.checkAdminPermission()) {
      return true;
    }
    
    for (const role of this._currentKeycloakLoginRoles) {
      const roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (permissionLevel === "client-resources-creator" || permissionLevel === "unit-resources-creator") {
        return true;
      }
    }
    return false;
  }

  /**
   * Sets the current Keycloak login roles
   */
  setCurrentKeycloakLoginRoles(roles: string[]): void {
    this._currentKeycloakLoginRoles = roles;
  }

  /**
   * Display map application error
   */
  displayMapApplicationError(error: any): void {
    let errorMessage = '';
    
    if (error.data) {
      errorMessage = this.syntaxHighlightJSON(error.data);
    } else if (error.message) {
      errorMessage = this.syntaxHighlightJSON(error.message);
    } else {
      errorMessage = this.syntaxHighlightJSON(error);
    }
    
    this.errorSubject.next(errorMessage);
    
    // Show error alert in UI
    setTimeout(() => {
      const errorAlert = document.querySelector('.mapApplicationErrorAlert') as HTMLElement;
      if (errorAlert) {
        errorAlert.style.display = 'block';
      }
    }, 1000);
  }

  /**
   * Get all allowed roles string
   */
  getAllowedRolesString(permissions: any): string {
    if (!permissions || !Array.isArray(permissions)) return '';
    
    const roleMap: { [key: string]: string } = {
      'viewer': 'Betrachter',
      'editor': 'Bearbeiter',
      'creator': 'Ersteller'
    };
    
    return permissions.map((permission: string) => roleMap[permission] || permission).join(', ');
  }

  /**
   * Get role title
   */
  getRoleTitle(roleId: string): string {
    if (!roleId) return '';
    
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrator',
      'user': 'Benutzer',
      'guest': 'Gast'
    };
    
    return roleMap[roleId] || roleId;
  }

  /**
   * Get indicator string from indicator type
   */
  getIndicatorStringFromIndicatorType(indicatorType: any): string {
    if (!indicatorType) return '';
    
    const typeMap: { [key: string]: string } = {
      'headline': 'Leitindikator',
      'base': 'Basisindikator',
      'computed': 'Berechneter Indikator'
    };
    
    return typeMap[indicatorType] || indicatorType;
  }

  /**
   * Get topic hierarchy display string
   */
  getTopicHierarchyDisplayString(topicReference: any): string {
    if (!topicReference) return '';
    
    let hierarchy = '';
    if (topicReference.mainTopic) {
      hierarchy += topicReference.mainTopic;
    }
    if (topicReference.subTopic) {
      hierarchy += ' > ' + topicReference.subTopic;
    }
    if (topicReference.subsubTopic) {
      hierarchy += ' > ' + topicReference.subsubTopic;
    }
    if (topicReference.subsubsubTopic) {
      hierarchy += ' > ' + topicReference.subsubsubTopic;
    }
    
    return hierarchy;
  }

  /**
   * Syntax highlight JSON
   */
  syntaxHighlightJSON(json: any): string {
    if (typeof json === 'string') {
      try {
        json = JSON.parse(json);
      } catch (e) {
        return json;
      }
    }
    
    return JSON.stringify(json, null, 2)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Private helper methods
   */
  private getBaseApiUrl(): string {
    // Use the same pattern as the original AngularJS service
    const apiUrl = this.env?.apiUrl || '';
    const basePath = this.env?.basePath || '';
    const baseUrl = apiUrl + basePath;
    
    return baseUrl || 'http://localhost:8080/api';
  }

  private getAuthHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Add authentication headers if needed
    if (this.env?.enableKeycloakSecurity) {
      // Add Keycloak token if available
      const token = this.getKeycloakToken();
      if (token) {
        return headers.set('Authorization', `Bearer ${token}`);
      }
    }
    
    return headers;
  }

  private getKeycloakToken(): string | null {
    // Get token from AuthService (like other Angular components)
    if (this.authService?.Auth && this.authService.Auth.keycloak && this.authService.Auth.keycloak.token) {
      return this.authService.Auth.keycloak.token;
    }
    return null;
  }

  private modifyIndicators(indicators: IndicatorMetadata[]): IndicatorMetadata[] {
    const decimalDefault = this.env?.numberOfDecimals || 2;
    
    // First, modify precision values
    const modifiedIndicators = indicators.map(indicator => {
      if (indicator.precision === null || indicator.precision === undefined) {
        indicator.precision = decimalDefault;
        (indicator as any).defaultPrecision = true;
      } else {
        (indicator as any).defaultPrecision = false;
      }
      return indicator;
    });

    // Then apply the same filtering logic as the original AngularJS service
    return this.filterDisplayableIndicators(modifiedIndicators);
  }

  private filterDisplayableIndicators(indicators: IndicatorMetadata[]): IndicatorMetadata[] {
    const arrayOfNameSubstringsForHidingIndicators = this.env?.arrayOfNameSubstringsForHidingIndicators || [];
    
    console.log("Data Exchange - Total indicators before filtering:", indicators.length);
    console.log("Data Exchange - Hide substrings:", arrayOfNameSubstringsForHidingIndicators);
    
    const filteredIndicators = indicators.filter(indicator => {
      // Check if indicator has applicable dates
      if (!indicator.applicableDates || indicator.applicableDates.length === 0) {
        console.log("Data Exchange - Filtering out indicator (no dates):", indicator.indicatorName);
        return false;
      }

      // Check if indicator has applicable spatial units
      if (!indicator.applicableSpatialUnits || indicator.applicableSpatialUnits.length === 0) {
        console.log("Data Exchange - Filtering out indicator (no spatial units):", indicator.indicatorName);
        return false;
      }

      // Check if indicator name contains hidden substrings
      const isIndicatorThatShallNotBeDisplayed = arrayOfNameSubstringsForHidingIndicators.some(
        substring => String(indicator.indicatorName).includes(substring)
      );
      
      if (isIndicatorThatShallNotBeDisplayed) {
        console.log("Data Exchange - Filtering out indicator (hidden substring):", indicator.indicatorName);
        return false;
      }

      return true;
    });

    console.log("Data Exchange - Total indicators after filtering:", filteredIndicators.length);
    return filteredIndicators;
  }

  private modifySingleIndicator(indicator: IndicatorMetadata): IndicatorMetadata {
    const modified = this.modifyIndicators([indicator]);
    return modified[0];
  }

  private buildTopicIndicatorHierarchy(): any[] {
    // Filter topics that are for indicators
    const indicatorTopics = this.availableTopics.filter(topic => (topic as any).topicResource === "indicator");
    
    const topicsMap = this.buildTopicsMap_indicators(indicatorTopics);

    // Get filtered indicators
    const filteredIndicators = this.availableIndicators;

    // Map indicators to their topics
    for (const indicatorMetadata of filteredIndicators) {
      if (topicsMap.has(indicatorMetadata.topicReference)) {
        const indicatorArray = topicsMap.get(indicatorMetadata.topicReference);
        if (indicatorArray) {
          indicatorArray.push(indicatorMetadata);
          topicsMap.set(indicatorMetadata.topicReference, indicatorArray);
        }
      }
    }

    const result = this.addIndicatorDataToTopicHierarchy(indicatorTopics, topicsMap);
    return result;
  }

  private buildTopicsMap_indicators(indicatorTopics: TopicMetadata[]): Map<string, any[]> {
    const topicsMap = new Map<string, any[]>();

    for (const topic of indicatorTopics) {
      topicsMap.set(topic.topicId, []);
      if (topic.subTopics.length > 0) {
        this.addSubTopicsToMap_indicators(topic.subTopics, topicsMap);
      }
    }

    return topicsMap;
  }

  private addSubTopicsToMap_indicators(subTopicsArray: TopicMetadata[], topicsMap: Map<string, any[]>): Map<string, any[]> {
    for (const subTopic of subTopicsArray) {
      topicsMap.set(subTopic.topicId, []);
      if (subTopic.subTopics.length > 0) {
        this.addSubTopicsToMap_indicators(subTopic.subTopics, topicsMap);
      }
    }
    
    return topicsMap;
  }

  private addIndicatorDataToTopicHierarchy(topicsArray: TopicMetadata[], topicsMap: Map<string, any[]>): any[] {
    for (const topic of topicsArray) {
      (topic as any).indicatorData = topicsMap.get(topic.topicId) || [];
      
      // Sort by display order
      (topic as any).indicatorData.sort((a: any, b: any) => (a.displayOrder > b.displayOrder) ? 1 : ((b.displayOrder > a.displayOrder) ? -1 : 0));
      
      (topic as any).indicatorCount = (topic as any).indicatorData.length;
      
      if (topic.subTopics.length > 0) {
        this.addIndicatorDataToSubTopics(topic, topicsMap);
      }
    }

    return topicsArray as any[];
  }

  private addIndicatorDataToSubTopics(topic: TopicMetadata, topicsMap: Map<string, any[]>): TopicMetadata {
    for (const subTopic of topic.subTopics) {
      (subTopic as any).indicatorData = topicsMap.get(subTopic.topicId) || [];
      (subTopic as any).indicatorData.sort((a: any, b: any) => (a.displayOrder > b.displayOrder) ? 1 : ((b.displayOrder > a.displayOrder) ? -1 : 0));
      (subTopic as any).indicatorCount = (subTopic as any).indicatorData.length;
      
      if (subTopic.subTopics.length > 0) {
        this.addIndicatorDataToSubTopics(subTopic, topicsMap);
      }
      (topic as any).indicatorCount = (topic as any).indicatorCount + (subTopic as any).indicatorCount;
    }

    return topic;
  }

  public checkAdminPermission(): boolean {
    return this._currentKeycloakLoginRoles.includes(this.env?.keycloakKomMonitorAdminRoleName);
  }

  private handleError(error: any): void {
    this.errorSubject.next('An error occurred while fetching data');
  }

  /**
   * Invalidates the topic hierarchy cache
   */
  private invalidateTopicHierarchyCache(): void {
    this.topicHierarchyCache = null;
    this.topicHierarchyCacheTimestamp = 0;
  }
} 