import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, catchError, tap } from 'rxjs';

// TypeScript interfaces for better type safety
export interface DatabaseModificationInfo {
  'access-control': string;
  topics: string;
  'spatial-units': string;
  georesources: string;
  indicators: string;
  'process-scripts': string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: string;
  lastModified: string;
}

export interface SpatialUnitMetadata {
  spatialUnitId: string;
  spatialUnitLevel: string;
  metadata: {
    description: string;
    datasource: string;
    contact: string;
    note?: string;
    literature?: string;
    updateInterval?: string;
    lastUpdate?: string;
    databasis?: string;
    sridEPSG?: number;
  };
  nextLowerHierarchyLevel?: string;
  nextUpperHierarchyLevel?: string;
  availablePeriodsOfValidity: Array<{
    startDate: string;
    endDate?: string;
  }>;
  permissions: string[];
  isPublic: boolean;
  ownerId: string;
  userPermissions?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class KommonitorCacheHelperService {
  private http = inject(HttpClient);

  private baseUrlToKomMonitorDataAPI: string = '';
  private lastDatabaseModificationInfo: DatabaseModificationInfo | null = null;

  // Endpoints
  private spatialUnitsPublicEndpoint = '/public/spatial-units';
  private spatialUnitsProtectedEndpoint = '/spatial-units';
  private spatialUnitsEndpoint = this.spatialUnitsProtectedEndpoint;

  // Local storage keys
  private localStorageKey_prefix: string = '';
  private localStorageKey_spatialUnits: string = '';

  // Reactive subjects for state management
  private spatialUnitsSubject = new BehaviorSubject<SpatialUnitMetadata[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private lastModificationSubject = new BehaviorSubject<DatabaseModificationInfo | null>(null);

  // Public observables
  public spatialUnits$ = this.spatialUnitsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public lastModification$ = this.lastModificationSubject.asObservable();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the service with configuration
   */
  private initializeService(): void {
    // Get configuration from environment
    const env = (window as any).__env;
    this.baseUrlToKomMonitorDataAPI = env?.apiUrl + env?.basePath || '';
    this.localStorageKey_prefix = env?.localStoragePrefix || 'kommonitor';
    this.localStorageKey_spatialUnits =
      this.localStorageKey_prefix + '_lastModification_spatialUnits';

    // Check authentication and set appropriate endpoints
    this.checkAuthentication();

    // Fetch initial database modification info
    this.fetchLastDatabaseModificationObject();
  }

  /**
   * Check authentication status and set appropriate endpoints
   */
  private checkAuthentication(): void {
    // This would integrate with your authentication service
    // For now, we'll assume authenticated and use protected endpoints
    const isAuthenticated = this.isUserAuthenticated();

    if (isAuthenticated) {
      this.spatialUnitsEndpoint = this.spatialUnitsProtectedEndpoint;
    } else {
      this.spatialUnitsEndpoint = this.spatialUnitsPublicEndpoint;
    }
  }

  /**
   * Check if user is authenticated
   * This is a placeholder method that should integrate with your auth service
   */
  private isUserAuthenticated(): boolean {
    // This would integrate with your authentication service (Keycloak, etc.)
    // For now, return true as a placeholder
    return true;
  }

  /**
   * Fetch last database modification info from server
   */
  private fetchLastDatabaseModificationObject(): Observable<DatabaseModificationInfo> {
    const url = `${this.baseUrlToKomMonitorDataAPI}/public/database/last-modification`;

    return this.http.get<DatabaseModificationInfo>(url).pipe(
      tap((info) => {
        this.lastDatabaseModificationInfo = info;
        this.lastModificationSubject.next(info);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Fetch spatial units metadata with caching
   */
  fetchSpatialUnitsMetadata(keycloakRolesArray: string[]): Observable<SpatialUnitMetadata[]> {
    // Check cache first
    const cachedData = this.getCachedSpatialUnits(keycloakRolesArray);
    if (cachedData) {
      this.spatialUnitsSubject.next(cachedData);
      return of(cachedData);
    }

    // Fetch from server

    this.setLoading(true);
    this.clearError();

    return this.fetchResourceFromServer<SpatialUnitMetadata>(
      this.localStorageKey_spatialUnits,
      this.spatialUnitsEndpoint,
      'spatial-units',
      keycloakRolesArray
    ).pipe(
      tap((data: SpatialUnitMetadata[]) => {
        this.spatialUnitsSubject.next(data);
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setError(error);
        this.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Fetch single spatial unit metadata
   */
  fetchSingleSpatialUnitMetadata(
    spatialUnitId: string,
    keycloakRolesArray: string[]
  ): Observable<SpatialUnitMetadata> {
    const url = `${this.baseUrlToKomMonitorDataAPI}${this.spatialUnitsEndpoint}/${spatialUnitId}`;

    return this.http.get<SpatialUnitMetadata>(url).pipe(
      tap(() => {
        // Refresh the full list in the background
        this.fetchSpatialUnitsMetadata(keycloakRolesArray).subscribe();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Fetch resource from server with optional filtering
   */
  private fetchResourceFromServer<T>(
    localStorageKey: string,
    resourceEndpoint: string,
    lastModificationResourceName: string,
    keycloakRolesArray: string[],
    filter?: any
  ): Observable<T[]> {
    const url = `${this.baseUrlToKomMonitorDataAPI}${resourceEndpoint}`;

    if (filter) {
      // POST request with filter
      return this.http.post<T[]>(`${url}/filter`, filter).pipe(
        tap((data: T[]) =>
          this.updateCache(localStorageKey, data, lastModificationResourceName, keycloakRolesArray)
        ),
        catchError(this.handleError)
      );
    } else {
      // Standard GET request
      return this.http.get<T[]>(url).pipe(
        tap((data: T[]) =>
          this.updateCache(localStorageKey, data, lastModificationResourceName, keycloakRolesArray)
        ),
        catchError(this.handleError)
      );
    }
  }

  /**
   * Get cached spatial units data
   */
  private getCachedSpatialUnits(keycloakRolesArray: string[]): SpatialUnitMetadata[] | null {
    if (!this.lastDatabaseModificationInfo) {
      return null;
    }

    const { timestampKey, metadataKey } = this.getCacheKeys(keycloakRolesArray);

    const cachedTimestamp = localStorage.getItem(timestampKey);
    if (!cachedTimestamp) {
      return null;
    }

    const cachedLastModified = JSON.parse(cachedTimestamp);
    const serverLastModified = this.lastDatabaseModificationInfo['spatial-units'];

    if (cachedLastModified !== serverLastModified) {
      return null;
    }

    const cachedData = localStorage.getItem(metadataKey);
    if (!cachedData) {
      return null;
    }

    try {
      const parsedData = JSON.parse(cachedData);

      return parsedData;
    } catch {
      return null;
    }
  }

  /**
   * Update cache with new data
   */
  private updateCache<T>(
    localStorageKey: string,
    data: T[],
    lastModificationResourceName: string,
    keycloakRolesArray: string[]
  ): void {
    if (!this.lastDatabaseModificationInfo) {
      return;
    }

    const { timestampKey, metadataKey } = this.getCacheKeys(keycloakRolesArray);

    // Store timestamp
    const timestamp =
      this.lastDatabaseModificationInfo[
        lastModificationResourceName as keyof DatabaseModificationInfo
      ];
    localStorage.setItem(timestampKey, JSON.stringify(timestamp));

    // Store data
    localStorage.setItem(metadataKey, JSON.stringify(data));
  }

  /**
   * Get cache keys based on roles
   */
  private getCacheKeys(keycloakRolesArray: string[]): {
    timestampKey: string;
    metadataKey: string;
  } {
    const env = (window as any).__env;
    let suffix = '_public';

    if (keycloakRolesArray && keycloakRolesArray.length > 0) {
      if (keycloakRolesArray.includes(env?.keycloakKomMonitorAdminRoleName)) {
        suffix = '_' + env.keycloakKomMonitorAdminRoleName;
      } else {
        suffix = '_' + JSON.stringify(keycloakRolesArray);
      }
    }

    const timestampKey = this.localStorageKey_spatialUnits + '_timestamp' + suffix;
    const metadataKey = this.localStorageKey_spatialUnits + '_metadata' + suffix;

    return { timestampKey, metadataKey };
  }

  /**
   * Clear cache for spatial units
   */
  clearSpatialUnitsCache(keycloakRolesArray: string[]): void {
    const { timestampKey, metadataKey } = this.getCacheKeys(keycloakRolesArray);
    localStorage.removeItem(timestampKey);
    localStorage.removeItem(metadataKey);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(this.localStorageKey_prefix));
    cacheKeys.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Get current spatial units data
   */
  get availableSpatialUnits(): SpatialUnitMetadata[] {
    return this.spatialUnitsSubject.value;
  }

  /**
   * Get current loading state
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Get current error state
   */
  get currentError(): string | null {
    return this.errorSubject.value;
  }

  /**
   * Get base URL
   */
  get baseUrl(): string {
    return this.baseUrlToKomMonitorDataAPI;
  }

  /**
   * Get spatial units endpoint
   */
  get spatialUnitsEndpointPath(): string {
    return this.spatialUnitsEndpoint;
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Set error state
   */
  private setError(error: any): void {
    const errorMessage = error?.error?.message || error?.message || 'An unknown error occurred';
    this.errorSubject.next(errorMessage);
  }

  /**
   * Clear error state
   */
  private clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Initialize the service
   */
  async init(): Promise<void> {
    this.checkAuthentication();
    await this.fetchLastDatabaseModificationObject().toPromise();
  }

  /**
   * Refresh spatial units data
   */
  refreshSpatialUnits(keycloakRolesArray: string[]): Observable<SpatialUnitMetadata[]> {
    this.clearSpatialUnitsCache(keycloakRolesArray);
    return this.fetchSpatialUnitsMetadata(keycloakRolesArray);
  }
}
