import { Injectable, Inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { 
  Observable, 
  BehaviorSubject, 
  throwError, 
  of, 
  timer,
  combineLatest,
  catchError,
  retry,
  shareReplay,
  switchMap,
  tap,
  map,
  filter,
  takeUntil,
  Subject
} from 'rxjs';
import { AuthService } from '../auth-service/auth.service';

// TypeScript interfaces for better type safety
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
  permissions: any[];
  isPublic: boolean;
  ownerId: string;
  userPermissions: string[];
  isOutlineLayer?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  outlineDashArrayString?: string;
}

export interface AccessControlMetadata {
  organizationalUnitId: string;
  name: string;
  permissions: Array<{
    permissionId: string;
    permissionLevel: string;
    isChecked: boolean;
  }>;
  datasetOwner?: boolean;
  children?: string[];
  parentId?: string;
  description?: string;
  contact?: string;
  mandant?: boolean;
  keycloakId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KommonitorDataExchangeService implements OnDestroy {
  // Reactive subjects for state management
  private spatialUnitsSubject = new BehaviorSubject<SpatialUnitMetadata[]>([]);
  private accessControlSubject = new BehaviorSubject<AccessControlMetadata[]>([]);
  private currentRolesSubject = new BehaviorSubject<string[]>([]);
  private komMonitorRolesSubject = new BehaviorSubject<string[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private authenticationStateSubject = new BehaviorSubject<boolean>(false);

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  // Public observables
  public spatialUnits$ = this.spatialUnitsSubject.asObservable();
  public accessControl$ = this.accessControlSubject.asObservable();
  public currentRoles$ = this.currentRolesSubject.asObservable();
  public komMonitorRoles$ = this.komMonitorRolesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public authenticationState$ = this.authenticationStateSubject.asObservable();

  // Cache for spatial units with expiration
  private spatialUnitsCache: {
    data: SpatialUnitMetadata[];
    timestamp: number;
    expiresAt: number;
  } | null = null;

  // Cache for access control with expiration
  private accessControlCache: {
    data: AccessControlMetadata[];
    timestamp: number;
    expiresAt: number;
  } | null = null;

  // Cache duration in milliseconds (5 minutes)
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  // Base URL for API calls
  private readonly baseUrl: string;

  // API endpoints
  private readonly endpoints = {
    spatialUnits: '/spatial-units',
    spatialUnitsPublic: '/public/spatial-units',
    accessControl: '/organizationalUnits',
    indicators: '/indicators',
    indicatorsPublic: '/public/indicators'
  };

  // Environment configuration
  private readonly env: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Get environment configuration
    this.env = (window as any).__env;
    this.baseUrl = this.getBaseApiUrl();
    
    // Initialize the service
    this.initializeService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the service with proper race condition handling
   */
  private initializeService(): void {
    // Set up authentication listeners
    this.setupAuthenticationListeners();
    
    // Initial role extraction (with retry logic for race conditions)
    this.extractAndSetRolesWithRetry();
    
    // Set up periodic role checking to handle token refreshes
    this.setupPeriodicRoleCheck();
  }

  /**
   * Set up authentication state listeners
   */
  private setupAuthenticationListeners(): void {
    // Listen for authentication state changes
    timer(0, 1000) // Check every second
      .pipe(
        takeUntil(this.destroy$),
        map(() => this.isAuthenticated()),
        filter((isAuth, index) => {
          const currentState = this.authenticationStateSubject.value;
          return isAuth !== currentState; // Only emit when state changes
        })
      )
      .subscribe(isAuthenticated => {
        this.authenticationStateSubject.next(isAuthenticated);
        
        if (isAuthenticated) {
          // User just authenticated, extract roles
          this.extractAndSetRoles();
        } else {
          // User logged out, clear roles
          this.clearRoles();
        }
      });
  }

  /**
   * Extract roles with retry logic to handle race conditions
   */
  private extractAndSetRolesWithRetry(): void {
    const maxRetries = 10;
    let retryCount = 0;

    const attemptRoleExtraction = () => {
      const roles = this.extractRolesFromKeycloak();
      
      if (roles.length > 0 || retryCount >= maxRetries) {
        this.setCurrentKeycloakLoginRoles(roles);
      } else {
        retryCount++;
        setTimeout(attemptRoleExtraction, 500); // Retry after 500ms
      }
    };

    attemptRoleExtraction();
  }

  /**
   * Set up periodic role checking for token refreshes
   */
  private setupPeriodicRoleCheck(): void {
    timer(30000, 30000) // Check every 30 seconds
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.isAuthenticated())
      )
      .subscribe(() => {
        const currentRoles = this.currentRolesSubject.value;
        const newRoles = this.extractRolesFromKeycloak();
        
        // Only update if roles have changed
        if (JSON.stringify(currentRoles) !== JSON.stringify(newRoles)) {
          this.setCurrentKeycloakLoginRoles(newRoles);
        }
      });
  }

  /**
   * Extract roles directly from Keycloak JWT token
   */
  private extractRolesFromKeycloak(): string[] {
    try {
      const keycloak = this.authService.Auth?.keycloak;
      
      if (!keycloak) {
        return [];
      }

      if (!keycloak.authenticated) {
        return [];
      }

      const tokenParsed = keycloak.tokenParsed;
      if (!tokenParsed?.realm_access?.roles) {
        return [];
      }

      const roles = tokenParsed.realm_access.roles;
      return roles;
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract and set roles from Keycloak
   */
  private extractAndSetRoles(): void {
    const roles = this.extractRolesFromKeycloak();
    this.setCurrentKeycloakLoginRoles(roles);
  }

  /**
   * Filter roles to only include KomMonitor-specific roles
   */
  private filterKomMonitorRoles(allRoles: string[]): string[] {
    if (!allRoles || allRoles.length === 0) {
      return [];
    }

    // Get environment configuration for role suffixes
    const roleSuffixes = [
      ...(this.env?.keycloakKomMonitorGroupsEditRoleNames || []),
      ...(this.env?.keycloakKomMonitorThemesEditRoleNames || []),
      ...(this.env?.keycloakKomMonitorGeodataEditRoleNames || [])
    ];

    // Always include admin role
    const possibleRoles = [this.env?.keycloakKomMonitorAdminRoleName || 'kommonitor-creator'];

    // Add organizational unit roles based on access control data
    const accessControl = this.accessControlSubject.value;
    accessControl.forEach(organizationalUnit => {
      for (const roleSuffix of roleSuffixes) {
        possibleRoles.push(organizationalUnit.name + "." + roleSuffix);
      }
    });

    // Filter roles to only include KomMonitor-specific ones
    const komMonitorRoles = allRoles.filter(role => possibleRoles.includes(role));
    
    return komMonitorRoles;
  }

  /**
   * Check if user is authenticated
   */
  private isAuthenticated(): boolean {
    try {
      const keycloak = this.authService.Auth?.keycloak;
      return keycloak?.authenticated || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear roles when user logs out
   */
  private clearRoles(): void {
    this.currentRolesSubject.next([]);
    this.komMonitorRolesSubject.next([]);
  }

  /**
   * Gets the base API URL from environment configuration
   */
  private getBaseApiUrl(): string {
    if (this.env?.apiUrl && this.env?.basePath) {
      return `${this.env.apiUrl}${this.env.basePath}`;
    }
    // Fallback to default values
    return 'http://localhost:8085/management';
  }

  /**
   * Get available spatial units with caching
   */
  get availableSpatialUnits(): SpatialUnitMetadata[] {
    return this.spatialUnitsSubject.value;
  }

  /**
   * Get current Keycloak login roles
   */
  get currentKeycloakLoginRoles(): string[] {
    return this.currentRolesSubject.value;
  }

  /**
   * Get KomMonitor-specific roles
   */
  get currentKomMonitorLoginRoleNames(): string[] {
    return this.komMonitorRolesSubject.value;
  }

  /**
   * Get spatial units map for quick lookup
   */
  get availableSpatialUnits_map(): Map<string, SpatialUnitMetadata> {
    const spatialUnits = this.availableSpatialUnits;
    const map = new Map<string, SpatialUnitMetadata>();
    spatialUnits.forEach(unit => {
      map.set(unit.spatialUnitId, unit);
    });
    return map;
  }

  /**
   * Get access control data
   */
  get accessControl(): AccessControlMetadata[] {
    return this.accessControlSubject.value;
  }

  /**
   * Get base URL to KomMonitor Data API
   */
  get baseUrlToKomMonitorDataAPI(): string {
    return this.baseUrl;
  }

  /**
   * Get base URL to KomMonitor Data API for spatial resources
   * This includes the authentication path based on user authentication state
   */
  getBaseUrlToKomMonitorDataAPI_spatialResource(): string {
    // For now, we'll use "/public" as the default path for spatial resources
    // This should be configurable based on authentication state
    const spatialResourcePath = this.isAuthenticated() ? "" : "/public";
    return this.baseUrl + spatialResourcePath;
  }

  /**
   * Check if Keycloak security is enabled
   */
  get enableKeycloakSecurity(): boolean {
    return this.env?.enableKeycloakSecurity || false;
  }

  /**
   * Get date picker options
   */
  get datePickerOptions(): any {
    return {
      format: 'dd.mm.yyyy',
      autoclose: true,
      todayBtn: 'linked',
      todayHighlight: true,
      assumeNearbyYear: true,
      startView: 2,
      minView: 2
    };
  }

  /**
   * Get update interval options
   */
  get updateIntervalOptions(): any[] {
    return [
      { value: 'daily', label: 'Täglich' },
      { value: 'weekly', label: 'Wöchentlich' },
      { value: 'monthly', label: 'Monatlich' },
      { value: 'quarterly', label: 'Vierteljährlich' },
      { value: 'yearly', label: 'Jährlich' },
      { value: 'on-demand', label: 'Bei Bedarf' }
    ];
  }

  /**
   * Get available line of interest dash array objects
   */
  get availableLoiDashArrayObjects(): any[] {
    return [
      { value: 'solid', label: 'Durchgezogen', dashArray: null },
      { value: 'dashed', label: 'Gestrichelt', dashArray: '10,5' },
      { value: 'dotted', label: 'Gepunktet', dashArray: '2,2' },
      { value: 'dash-dot', label: 'Strich-Punkt', dashArray: '10,2,2,2' }
    ];
  }

  /**
   * Fetches spatial units metadata with caching and error handling
   */
  fetchSpatialUnitsMetadata(keycloakRolesArray: string[]): Observable<SpatialUnitMetadata[]> {
    
    // Check cache first
    if (this.isCacheValid(this.spatialUnitsCache)) {
      this.spatialUnitsSubject.next(this.spatialUnitsCache!.data);
      return of(this.spatialUnitsCache!.data);
    }

    this.setLoading(true);
    this.clearError();

    const endpoint = this.getSpatialUnitsEndpoint();
    const url = `${this.baseUrl}${endpoint}`;

    return this.http.get<SpatialUnitMetadata[]>(url).pipe(
      tap(data => {
        this.spatialUnitsSubject.next(data);
        this.updateSpatialUnitsCache(data);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setError(this.handleHttpError(error));
        this.setLoading(false);
        return throwError(() => error);
      }),
      retry(2),
      shareReplay(1)
    );
  }

  /**
   * Fetches access control metadata
   */
  fetchAccessControlMetadata(): Observable<AccessControlMetadata[]> {
    
    // Check cache first
    if (this.isCacheValid(this.accessControlCache)) {
      this.accessControlSubject.next(this.accessControlCache!.data);
      return of(this.accessControlCache!.data);
    }

    this.setLoading(true);
    this.clearError();

    const url = `${this.baseUrl}${this.endpoints.accessControl}`;

    return this.http.get<AccessControlMetadata[]>(url).pipe(
      tap(data => {
        this.accessControlSubject.next(data);
        this.updateAccessControlCache(data);
        
        // Update KomMonitor roles after access control is loaded
        this.updateKomMonitorRoles();
      }),
      catchError(error => {
        this.setError(this.handleHttpError(error));
        this.setLoading(false);
        return throwError(() => error);
      }),
      retry(2),
      shareReplay(1)
    );
  }

  /**
   * Fetches indicators metadata
   */
  fetchIndicatorsMetadata(keycloakRolesArray: string[]): Observable<any[]> {
    
    this.setLoading(true);
    this.clearError();

    const endpoint = this.getIndicatorsEndpoint();
    const url = `${this.baseUrl}${endpoint}`;

    return this.http.get<any[]>(url).pipe(
      tap(data => {
        this.setLoading(false);
      }),
      catchError(error => {
        this.setError(this.handleHttpError(error));
        this.setLoading(false);
        return throwError(() => error);
      }),
      retry(2)
    );
  }

  /**
   * Get spatial unit metadata by ID
   */
  getSpatialUnitMetadataById(spatialUnitId: string): SpatialUnitMetadata | null {
    const spatialUnits = this.availableSpatialUnits;
    return spatialUnits.find(unit => unit.spatialUnitId === spatialUnitId) || null;
  }

  /**
   * Sets the current Keycloak login roles
   */
  setCurrentKeycloakLoginRoles(roles: string[]): void {
    this.currentRolesSubject.next([...roles]);
    this.komMonitorRolesSubject.next(this.filterKomMonitorRoles(roles));
  }

  /**
   * Check if user has permission to create spatial units
   */
  checkCreatePermission(): boolean {
    const roles = this.currentKeycloakLoginRoles;
    const komMonitorRoles = this.currentKomMonitorLoginRoleNames;
    
    // Check for admin role
    if (roles.includes(this.env?.keycloakKomMonitorAdminRoleName || 'kommonitor-creator')) {
      return true;
    }
    
    // Check for creator roles
    const hasCreatorRole = komMonitorRoles.some(role => role.endsWith('-creator'));
    
    return hasCreatorRole;
  }

  /**
   * Get allowed roles string for display
   */
  getAllowedRolesString(permissions: any): string {
    if (!permissions || !Array.isArray(permissions)) {
      return '';
    }
    
    const accessControl = this.accessControl;
    const roleNames = permissions.map((permissionId: string) => {
      for (const unit of accessControl) {
        const permission = unit.permissions.find(p => p.permissionId === permissionId);
        if (permission) {
          return unit.name + '.' + permission.permissionLevel;
        }
      }
      return permissionId;
    });
    
    return roleNames.join(', ');
  }

  /**
   * Get role title by role ID
   */
  getRoleTitle(roleId: string): string {
    const accessControl = this.accessControl;
    const unit = accessControl.find(u => u.organizationalUnitId === roleId);
    return unit ? unit.name : roleId;
  }

  /**
   * Syntax highlight JSON for error display
   */
  syntaxHighlightJSON(json: any): string {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, null, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

  /**
   * Display map application error
   */
  displayMapApplicationError(error: any): void {
    this.setError(typeof error === 'string' ? error : JSON.stringify(error));
  }

  /**
   * Refresh spatial units data
   */
  refreshSpatialUnits(): Observable<SpatialUnitMetadata[]> {
    this.invalidateSpatialUnitsCache();
    return this.fetchSpatialUnitsMetadata(this.currentKeycloakLoginRoles);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.invalidateSpatialUnitsCache();
    this.accessControlCache = null;
  }

  /**
   * Get the appropriate spatial units endpoint based on authentication
   */
  private getSpatialUnitsEndpoint(): string {
    const endpoint = this.enableKeycloakSecurity ? 
      this.endpoints.spatialUnits : 
      this.endpoints.spatialUnitsPublic;
    return endpoint;
  }

  /**
   * Get the appropriate indicators endpoint based on authentication
   */
  private getIndicatorsEndpoint(): string {
    const endpoint = this.enableKeycloakSecurity ? 
      this.endpoints.indicators : 
      this.endpoints.indicatorsPublic;
    return endpoint;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(cache: any): boolean {
    return cache && cache.data && cache.expiresAt > Date.now();
  }

  /**
   * Update spatial units cache
   */
  private updateSpatialUnitsCache(data: SpatialUnitMetadata[]): void {
    this.spatialUnitsCache = {
      data: [...data],
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    };
  }

  /**
   * Update access control cache
   */
  private updateAccessControlCache(data: AccessControlMetadata[]): void {
    this.accessControlCache = {
      data: [...data],
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    };
  }

  /**
   * Invalidate spatial units cache
   */
  private invalidateSpatialUnitsCache(): void {
    this.spatialUnitsCache = null;
  }

  /**
   * Update KomMonitor roles after access control is loaded
   */
  private updateKomMonitorRoles(): void {
    const currentRoles = this.currentRolesSubject.value;
    const komMonitorRoles = this.filterKomMonitorRoles(currentRoles);
    this.komMonitorRolesSubject.next(komMonitorRoles);
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
  private setError(error: string): void {
    this.errorSubject.next(error);
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
  private handleHttpError(error: HttpErrorResponse): string {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && typeof error.error === 'object') {
        errorMessage += `\nDetails: ${JSON.stringify(error.error)}`;
      }
    }
    
    return errorMessage;
  }

  /**
   * Check if current user has admin permission
   */
  checkAdminPermission(): boolean {
    const currentRoles = this.currentRolesSubject.value;
    const adminRoleName = this.env?.keycloakKomMonitorAdminRoleName;
    
    if (!adminRoleName || !currentRoles || currentRoles.length === 0) {
      return false;
    }
    
    return currentRoles.includes(adminRoleName);
  }

  /**
   * Get access control metadata by organizational unit ID
   */
  getAccessControlById(id: string): AccessControlMetadata | null {
    return this.accessControl.find(unit => unit.organizationalUnitId === id) || null;
  }

  /**
   * Get access control metadata by organizational unit name
   */
  getAccessControlByName(name: string): AccessControlMetadata | null {
    return this.accessControl.find(unit => unit.name === name) || null;
  }

  /**
   * Filter child or self organizational units
   */
  filterChildOrSelfOrganizationalUnits(organizationalUnitReferenceItem: AccessControlMetadata | null): (organizationalUnit: AccessControlMetadata) => boolean {
    return (organizationalUnit: AccessControlMetadata) => {
      if (!organizationalUnitReferenceItem) {
        return true;
      }

      if (organizationalUnit.organizationalUnitId === organizationalUnitReferenceItem.organizationalUnitId) {
        return false;
      }

      if (organizationalUnitReferenceItem.children && organizationalUnitReferenceItem.children.length > 0) {
        return !this.isDescendantOfReferenceItem(organizationalUnitReferenceItem, organizationalUnit);
      }
      
      return true;
    };
  }

  /**
   * Check if an organizational unit is a descendant of a reference item
   */
  isDescendantOfReferenceItem(organizationalUnitReferenceItem: AccessControlMetadata, organizationalUnitCandidate: AccessControlMetadata): boolean {
    if (organizationalUnitReferenceItem.children && organizationalUnitReferenceItem.children.includes(organizationalUnitCandidate.organizationalUnitId)) {
      return true;
    }

    // Check all further descendants
    if (organizationalUnitReferenceItem.children) {
      for (const childOrganizationalUnitId of organizationalUnitReferenceItem.children) {
        const childOrganizationalUnit = this.getAccessControlById(childOrganizationalUnitId);
        if (childOrganizationalUnit && childOrganizationalUnit.children && childOrganizationalUnit.children.length > 0) {
          if (this.isDescendantOfReferenceItem(childOrganizationalUnit, organizationalUnitCandidate)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
} 