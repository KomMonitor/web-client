import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../auth-service/auth.service';

// Define interfaces locally to avoid circular dependencies
export interface GeoresourceMetadata {
  georesourceId: string;
  datasetName: string;
  isPOI?: boolean;
  isLOI?: boolean;
  isAOI?: boolean;
  poiSymbolColor?: string;
  poiSymbolBootstrap3Name?: string;
  poiMarkerColor?: string;
  loiColor?: string;
  loiWidth?: number;
  loiDashArrayString?: string;
  aoiColor?: string;
  metadata?: {
    description?: string;
    datasource?: string;
    contact?: string;
  };
  availablePeriodsOfValidity?: Array<{
    startDate: string;
    endDate?: string;
  }>;
  topicReference?: any;
  permissions?: any;
  isPublic?: boolean;
  ownerId?: string;
  userPermissions?: string[];
}

export interface DatabaseModificationInfo {
  georesources: string;
  spatialUnits: string;
  indicators: string;
  topics: string;
  processScripts: string;
  accessControl: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  lastModification: string;
}

@Injectable({
  providedIn: 'root'
})
export class KommonitorGeoresourceCacheHelperService implements OnDestroy {
  // Private subjects for reactive updates
  private lastModificationSubject = new BehaviorSubject<DatabaseModificationInfo | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  // Public observables
  public lastModification$ = this.lastModificationSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  // Environment configuration
  private readonly env: any;
  private readonly baseUrl: string;
  private readonly localStoragePrefix: string;

  // Database modification info (like original AngularJS service)
  private lastDatabaseModificationInfo: DatabaseModificationInfo | null = null;

  // Endpoints (like original AngularJS service)
  private readonly georesourcesPublicEndpoint = "/public/georesources";
  private readonly georesourcesProtectedEndpoint = "/georesources";
  private readonly spatialUnitsPublicEndpoint = "/public/spatial-units";
  private readonly spatialUnitsProtectedEndpoint = "/spatial-units";
  private readonly indicatorsPublicEndpoint = "/public/indicators";
  private readonly indicatorsProtectedEndpoint = "/indicators";
  private readonly scriptsPublicEndpoint = "/public/process-scripts";
  private readonly scriptsProtectedEndpoint = "/process-scripts";
  private readonly topicsPublicEndpoint = "/public/topics";
  private readonly accessControlEndpoint = "/organizationalUnits";

  // Current endpoints based on authentication
  private georesourcesEndpoint = this.georesourcesProtectedEndpoint;
  private spatialUnitsEndpoint = this.spatialUnitsProtectedEndpoint;
  private indicatorsEndpoint = this.indicatorsProtectedEndpoint;
  private scriptsEndpoint = this.scriptsProtectedEndpoint;
  public spatialResourceGETUrlPath_forAuthentication = "";

  // Local storage keys (like original AngularJS service)
  private readonly localStorageKey_georesources: string;
  private readonly localStorageKey_spatialUnits: string;
  private readonly localStorageKey_indicators: string;
  private readonly localStorageKey_topics: string;
  private readonly localStorageKey_processScripts: string;
  private readonly localStorageKey_accessControl: string;

  // Cache duration in milliseconds (5 minutes)
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Get environment configuration
    this.env = (window as any).__env;
    this.baseUrl = this.getBaseApiUrl();
    this.localStoragePrefix = this.env?.localStoragePrefix || 'kommonitor';
    
    // Initialize local storage keys
    this.localStorageKey_georesources = this.localStoragePrefix + "_lastModification_georesources";
    this.localStorageKey_spatialUnits = this.localStoragePrefix + "_lastModification_spatialUnits";
    this.localStorageKey_indicators = this.localStoragePrefix + "_lastModification_indicators";
    this.localStorageKey_topics = this.localStoragePrefix + "_lastModification_topics";
    this.localStorageKey_processScripts = this.localStoragePrefix + "_lastModification_processScripts";
    this.localStorageKey_accessControl = this.localStoragePrefix + "_lastModification_accessControl";
    
    // Initialize the service
    this.initializeService();
  }

  /**
   * Initialize the service (like original AngularJS service)
   */
  private async initializeService(): Promise<void> {
    try {
      this.checkAuthentication();
      await this.fetchLastDatabaseModificationObject();
    } catch (error) {
      console.error('Error initializing cache helper service:', error);
      this.handleError(error);
    }
  }

  /**
   * Check authentication and set endpoints accordingly (like original AngularJS service)
   */
  private checkAuthentication(): void {
    try {
      const keycloak = this.authService.Auth?.keycloak;
      if (keycloak?.authenticated) {
        this.georesourcesEndpoint = this.georesourcesProtectedEndpoint;
        this.spatialUnitsEndpoint = this.spatialUnitsProtectedEndpoint;
        this.indicatorsEndpoint = this.indicatorsProtectedEndpoint;
        this.scriptsEndpoint = this.scriptsProtectedEndpoint;
        this.spatialResourceGETUrlPath_forAuthentication = "";
      } else {
        this.georesourcesEndpoint = this.georesourcesPublicEndpoint;
        this.spatialUnitsEndpoint = this.spatialUnitsPublicEndpoint;
        this.indicatorsEndpoint = this.indicatorsPublicEndpoint;
        this.scriptsEndpoint = this.scriptsPublicEndpoint;
        this.spatialResourceGETUrlPath_forAuthentication = "/public";
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      // Default to public endpoints
      this.georesourcesEndpoint = this.georesourcesPublicEndpoint;
      this.spatialUnitsEndpoint = this.spatialUnitsPublicEndpoint;
      this.indicatorsEndpoint = this.indicatorsPublicEndpoint;
      this.scriptsEndpoint = this.scriptsPublicEndpoint;
      this.spatialResourceGETUrlPath_forAuthentication = "/public";
    }
  }

  /**
   * Fetch last database modification object (like original AngularJS service)
   */
  private async fetchLastDatabaseModificationObject(): Promise<void> {
    try {
      const url = `${this.baseUrl}/public/database/last-modification`;
      const response = await this.http.get<DatabaseModificationInfo>(url).toPromise();
      console.log("fetchLastDatabaseModificationObject", response);
      
      if (response) {
        this.lastDatabaseModificationInfo = response;
        this.lastModificationSubject.next(response);
      }
    } catch (error) {
      // Error fetching last modification info
      console.warn('Could not fetch last database modification info:', error);
    }
  }

  /**
   * Fetches topics metadata with caching (like original AngularJS service)
   */
  async fetchTopicsMetadata(keycloakRolesArray: string[]): Promise<any[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log("Georesource Cache Helper - fetchTopicsMetadata called with roles:", keycloakRolesArray);

    try {
      // Check authentication
      this.checkAuthentication();
      console.log("Georesource Cache Helper - topics endpoint:", this.topicsPublicEndpoint);
      
      // For now, use the public topics endpoint
      // In the future, this could be enhanced to use protected endpoint when authenticated
      const url = `${this.baseUrl}${this.topicsPublicEndpoint}`;
      console.log("Georesource Cache Helper - fetching from URL:", url);
      
      const response = await this.http.get<any[]>(url).toPromise();
      console.log("Georesource Cache Helper - topics response:", response);
      
      if (!response || !Array.isArray(response)) {
        console.warn("Georesource Cache Helper - No topics data received");
        this.loadingSubject.next(false);
        return [];
      }
      
      this.loadingSubject.next(false);
      return response;
    } catch (error) {
      console.error("Georesource Cache Helper - Error fetching topics metadata:", error);
      this.errorSubject.next('Error fetching topics metadata');
      this.loadingSubject.next(false);
      throw error;
    }
  }

  /**
   * Fetch single georesource metadata (like original AngularJS service)
   */
  async fetchSingleGeoresourceMetadata(georesourceId: string, keycloakRolesArray: string[]): Promise<GeoresourceMetadata> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      // Fetch from server
      const url = `${this.baseUrl}${this.georesourcesEndpoint}/${georesourceId}`;
      const headers = this.getAuthHeaders();
      
      const response = await this.http.get<GeoresourceMetadata>(url, { headers }).toPromise();
      
      if (!response) {
        throw new Error('No response from georesource API');
      }

      // Cache the result
      this.cacheGeoresource(georesourceId, response, keycloakRolesArray);

      // Optionally refresh the full list in the background to keep list fresh
      this.fetchGeoresourceMetadata(keycloakRolesArray).subscribe({
        error: () => { /* ignore background errors */ }
      });

      return response;

    } catch (error) {
      console.error('Error fetching single georesource metadata:', error);
      this.handleError(error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Fetch georesource metadata (like original AngularJS service)
   */
  fetchGeoresourceMetadata(keycloakRolesArray: string[], filter?: any): Observable<GeoresourceMetadata[]> {
    return this.fetchResource_fromCacheOrServer(
      this.localStorageKey_georesources,
      this.georesourcesEndpoint,
      'georesources',
      keycloakRolesArray,
      filter
    );
  }

  /**
   * Fetch spatial units metadata (like original AngularJS service)
   */
  fetchSpatialUnitsMetadata(keycloakRolesArray: string[]): Observable<any[]> {
    return this.fetchResource_fromCacheOrServer(
      this.localStorageKey_spatialUnits,
      this.spatialUnitsEndpoint,
      'spatialUnits',
      keycloakRolesArray
    );
  }

  /**
   * Fetch indicators metadata (like original AngularJS service)
   */
  fetchIndicatorsMetadata(keycloakRolesArray: string[], filter?: any): Observable<any[]> {
    return this.fetchResource_fromCacheOrServer(
      this.localStorageKey_indicators,
      this.indicatorsEndpoint,
      'indicators',
      keycloakRolesArray,
      filter
    );
  }

  /**
   * Fetch single georesource schema (like original AngularJS service)
   */
  async fetchSingleGeoresourceSchema(targetGeoresourceId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}${this.georesourcesEndpoint}/${targetGeoresourceId}/schema`;
      const headers = this.getAuthHeaders();
      
      const response = await this.http.get(url, { headers }).toPromise();
      return response;
    } catch (error) {
      console.error('Error fetching georesource schema:', error);
      throw error;
    }
  }

  /**
   * Fetch single georesource without geometry (like original AngularJS service)
   */
  async fetchSingleGeoresourceWithoutGeometry(targetGeoresourceId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}${this.georesourcesEndpoint}/${targetGeoresourceId}/allFeatures/without-geometry`;
      const headers = this.getAuthHeaders();
      
      const response = await this.http.get(url, { headers }).toPromise();
      return response;
    } catch (error) {
      console.error('Error fetching georesource without geometry:', error);
      throw error;
    }
  }

  /**
   * Fetch resource from cache or server (like original AngularJS service)
   */
  private fetchResource_fromCacheOrServer<T>(
    localStorageKey: string,
    resourceEndpoint: string,
    lastModificationResourceName: string,
    keycloakRolesArray: string[],
    filter?: any
  ): Observable<T[]> {
    
    return new Observable<T[]>(observer => {
      this.fetchResourceFromCacheOrServerAsync<T>(
        localStorageKey,
        resourceEndpoint,
        lastModificationResourceName,
        keycloakRolesArray,
        filter
      ).then(data => {
        observer.next(data as T[]);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Async implementation of fetchResource_fromCacheOrServer
   */
  private async fetchResourceFromCacheOrServerAsync<T>(
    localStorageKey: string,
    resourceEndpoint: string,
    lastModificationResourceName: string,
    keycloakRolesArray: string[],
    filter?: any
  ): Promise<T[]> {
    
    // Fetch latest database modification info
    await this.fetchLastDatabaseModificationObject();

    // Build cache keys like original AngularJS service
    let timestampKey = localStorageKey + "_timestamp";
    let metadataKey = localStorageKey + "_metadata";

    // Different cache keys based on roles (like original AngularJS service)
    if (keycloakRolesArray && keycloakRolesArray.length > 0) {
      if (keycloakRolesArray.includes(this.env?.keycloakKomMonitorAdminRoleName)) {
        metadataKey += "_" + this.env?.keycloakKomMonitorAdminRoleName;
        timestampKey += "_" + this.env?.keycloakKomMonitorAdminRoleName;
      } else {
        metadataKey += "_" + JSON.stringify(keycloakRolesArray);
        timestampKey += "_" + JSON.stringify(keycloakRolesArray);
      }
    } else {
      metadataKey += "_public";
      timestampKey += "_public";
    }

    // Check cache timestamp (like original AngularJS service)
    let lastModTimestamp_fromCache_string = localStorage.getItem(timestampKey);

    if (lastModTimestamp_fromCache_string && !filter) {
      const lastModTimestamp_fromCache = new Date(lastModTimestamp_fromCache_string);
      const lastModTimestamp_fromServer = new Date(this.lastDatabaseModificationInfo?.[lastModificationResourceName as keyof DatabaseModificationInfo] || '');

      if (lastModTimestamp_fromCache.getTime() === lastModTimestamp_fromServer.getTime()) {
        // Cache is valid, return cached data
        const cachedMetadata = localStorage.getItem(metadataKey);
        if (cachedMetadata) {
          try {
            return JSON.parse(cachedMetadata);
          } catch (error) {
            console.error('Error parsing cached metadata:', error);
          }
        }
      }
    }

    // Cache is invalid or doesn't exist, fetch from server
    return this.fetchResourceFromServer<T>(
      localStorageKey,
      resourceEndpoint,
      lastModificationResourceName,
      keycloakRolesArray,
      filter
    );
  }

  /**
   * Fetch resource from server with optional filtering
   */
  private async fetchResourceFromServer<T>(
    localStorageKey: string,
    resourceEndpoint: string,
    lastModificationResourceName: string,
    keycloakRolesArray: string[],
    filter?: any
  ): Promise<T[]> {
    
    const url = `${this.baseUrl}${resourceEndpoint}`;
    const headers = this.getAuthHeaders();
    
    let response: T[] | undefined;
    if (filter) {
      // POST request with filter
      response = await this.http.post<T[]>(`${url}/filter`, filter, { headers }).toPromise();
    } else {
      // Standard GET request
      response = await this.http.get<T[]>(url, { headers }).toPromise();
    }
    
    if (!response) {
      throw new Error(`No response from ${resourceEndpoint} API`);
    }

    // Update cache
    this.updateCache(localStorageKey, response, lastModificationResourceName, keycloakRolesArray);

    return response;
  }

  /**
   * Get cached georesource
   */
  private getCachedGeoresource(georesourceId: string, keycloakRolesArray: string[]): GeoresourceMetadata | null {
    const cacheKey = this.buildCacheKey(this.localStorageKey_georesources, keycloakRolesArray);
    const cachedData = localStorage.getItem(cacheKey + "_metadata");
    
    if (cachedData) {
      try {
        const georesources: GeoresourceMetadata[] = JSON.parse(cachedData);
        return georesources.find(geo => geo.georesourceId === georesourceId) || null;
      } catch (error) {
        console.error('Error parsing cached georesource data:', error);
      }
    }
    
    return null;
  }

  /**
   * Cache georesource
   */
  private cacheGeoresource(georesourceId: string, data: GeoresourceMetadata, keycloakRolesArray: string[]): void {
    const cacheKey = this.buildCacheKey(this.localStorageKey_georesources, keycloakRolesArray);
    const timestampKey = cacheKey + "_timestamp";
    const metadataKey = cacheKey + "_metadata";
    
    // Get existing cache
    const existingData = localStorage.getItem(metadataKey);
    let georesources: GeoresourceMetadata[] = [];
    
    if (existingData) {
      try {
        georesources = JSON.parse(existingData);
      } catch (error) {
        console.error('Error parsing existing cache:', error);
      }
    }
    
    // Update or add the georesource
    const existingIndex = georesources.findIndex(geo => geo.georesourceId === georesourceId);
    if (existingIndex >= 0) {
      georesources[existingIndex] = data;
    } else {
      georesources.push(data);
    }
    
    // Save to cache
    localStorage.setItem(metadataKey, JSON.stringify(georesources));
    localStorage.setItem(timestampKey, new Date().toISOString());
  }

  /**
   * Update cache
   */
  private updateCache<T>(
    localStorageKey: string,
    data: T[],
    lastModificationResourceName: string,
    keycloakRolesArray: string[]
  ): void {
    const cacheKey = this.buildCacheKey(localStorageKey, keycloakRolesArray);
    const timestampKey = cacheKey + "_timestamp";
    const metadataKey = cacheKey + "_metadata";
    
    localStorage.setItem(metadataKey, JSON.stringify(data));
    localStorage.setItem(timestampKey, new Date().toISOString());
  }

  /**
   * Build cache key based on roles
   */
  private buildCacheKey(localStorageKey: string, keycloakRolesArray: string[]): string {
    if (keycloakRolesArray && keycloakRolesArray.length > 0) {
      if (keycloakRolesArray.includes(this.env?.keycloakKomMonitorAdminRoleName)) {
        return localStorageKey + "_" + this.env?.keycloakKomMonitorAdminRoleName;
      } else {
        return localStorageKey + "_" + JSON.stringify(keycloakRolesArray);
      }
    } else {
      return localStorageKey + "_public";
    }
  }

  /**
   * Get the base API URL from environment configuration
   */
  private getBaseApiUrl(): string {
    if (this.env?.apiUrl && this.env?.basePath) {
      return `${this.env.apiUrl}${this.env.basePath}`;
    }
    // Fallback to default values
    return 'http://localhost:8085/management';
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Add auth token if available
    const token = this.getKeycloakToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  /**
   * Get Keycloak token
   */
  private getKeycloakToken(): string | null {
    try {
      const keycloak = this.authService.Auth?.keycloak;
      return keycloak?.token || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    let errorMessage = 'An error occurred';
    
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    this.errorSubject.next(errorMessage);
    console.error('Cache helper service error:', error);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    const keys = [
      this.localStorageKey_georesources,
      this.localStorageKey_spatialUnits,
      this.localStorageKey_indicators,
      this.localStorageKey_topics,
      this.localStorageKey_processScripts,
      this.localStorageKey_accessControl
    ];
    
    keys.forEach(key => {
      this.clearCacheByPattern(key);
    });
  }

  /**
   * Clear cache by pattern
   */
  private clearCacheByPattern(pattern: string): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(pattern)) {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Refresh all data
   */
  async refreshAllData(keycloakRolesArray: string[]): Promise<void> {
    this.clearAllCaches();
    await this.fetchLastDatabaseModificationObject();
    
    // Refresh all metadata
    this.fetchGeoresourceMetadata(keycloakRolesArray).subscribe();
    this.fetchSpatialUnitsMetadata(keycloakRolesArray).subscribe();
    this.fetchIndicatorsMetadata(keycloakRolesArray).subscribe();
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 