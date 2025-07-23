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
    console.log('Initializing KommonitorDataExchangeService...');
    
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
        console.log('Authentication state changed:', isAuthenticated);
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
        if (roles.length > 0) {
          console.log('Roles extracted successfully:', roles);
        } else {
          console.warn('No roles found after', maxRetries, 'attempts');
        }
      } else {
        retryCount++;
        console.log(`Role extraction attempt ${retryCount}/${maxRetries} - retrying...`);
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
          console.log('Roles changed, updating...');
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
        console.log('Keycloak not available');
        return [];
      }

      if (!keycloak.authenticated) {
        console.log('User not authenticated');
        return [];
      }

      const tokenParsed = keycloak.tokenParsed;
      if (!tokenParsed?.realm_access?.roles) {
        console.log('No roles found in token');
        return [];
      }

      const roles = tokenParsed.realm_access.roles;
      console.log('Extracted roles from Keycloak:', roles);
      return roles;
    } catch (error) {
      console.error('Error extracting roles from Keycloak:', error);
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
    
    console.log('Filtered KomMonitor roles:', komMonitorRoles);
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
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Clear roles when user logs out
   */
  private clearRoles(): void {
    this.currentRolesSubject.next([]);
    this.komMonitorRolesSubject.next([]);
    console.log('Roles cleared due to logout');
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
    console.log('Fetching spatial units metadata with roles:', keycloakRolesArray);
    
    // Check cache first
    if (this.isCacheValid(this.spatialUnitsCache)) {
      console.log('Returning cached spatial units data');
      this.spatialUnitsSubject.next(this.spatialUnitsCache!.data);
      return of(this.spatialUnitsCache!.data);
    }

    console.log('Cache miss, fetching from API...');
    this.setLoading(true);
    this.clearError();

    const endpoint = this.getSpatialUnitsEndpoint();
    const url = `${this.baseUrl}${endpoint}`;
    console.log('Making API call to:', url);

    return this.http.get<SpatialUnitMetadata[]>(url).pipe(
      tap(data => {
        console.log('Spatial units data received:', data.length, 'items');
        this.spatialUnitsSubject.next(data);
        this.updateSpatialUnitsCache(data);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error fetching spatial units:', error);
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
    console.log('Fetching access control metadata...');
    
    // Check cache first
    if (this.isCacheValid(this.accessControlCache)) {
      console.log('Returning cached access control data');
      this.accessControlSubject.next(this.accessControlCache!.data);
      return of(this.accessControlCache!.data);
    }

    this.setLoading(true);
    this.clearError();

    const url = `${this.baseUrl}${this.endpoints.accessControl}`;
    console.log('Making API call to:', url);

    return this.http.get<AccessControlMetadata[]>(url).pipe(
      tap(data => {
        console.log('Access control data received:', data.length, 'items');
        this.accessControlSubject.next(data);
        this.updateAccessControlCache(data);
        this.setLoading(false);
        
        // Update KomMonitor roles after access control is loaded
        this.updateKomMonitorRoles();
      }),
      catchError(error => {
        console.error('Error fetching access control:', error);
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
    console.log('Fetching indicators metadata with roles:', keycloakRolesArray);
    
    this.setLoading(true);
    this.clearError();

    const endpoint = this.getIndicatorsEndpoint();
    const url = `${this.baseUrl}${endpoint}`;
    console.log('Making API call to:', url);

    return this.http.get<any[]>(url).pipe(
      tap(data => {
        console.log('Indicators data received:', data.length, 'items');
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error fetching indicators:', error);
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
    console.log('Setting current Keycloak login roles:', roles);
    this.currentRolesSubject.next([...roles]);
    this.komMonitorRolesSubject.next(this.filterKomMonitorRoles(roles));
  }

  /**
   * Check if user has permission to create spatial units
   */
  checkCreatePermission(): boolean {
    const roles = this.currentKeycloakLoginRoles;
    const komMonitorRoles = this.currentKomMonitorLoginRoleNames;
    
    console.log('Checking create permission with roles:', roles);
    console.log('KomMonitor roles:', komMonitorRoles);
    
    // Check for admin role
    if (roles.includes(this.env?.keycloakKomMonitorAdminRoleName || 'kommonitor-creator')) {
      console.log('User has admin role, create permission granted');
      return true;
    }
    
    // Check for creator roles
    const hasCreatorRole = komMonitorRoles.some(role => role.endsWith('-creator'));
    console.log('User has creator role:', hasCreatorRole);
    
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
    console.error('Map application error:', error);
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
    console.log('All caches cleared');
  }

  /**
   * Get the appropriate spatial units endpoint based on authentication
   */
  private getSpatialUnitsEndpoint(): string {
    const endpoint = this.enableKeycloakSecurity ? 
      this.endpoints.spatialUnits : 
      this.endpoints.spatialUnitsPublic;
    console.log('Selected spatial units endpoint:', endpoint, '(Keycloak enabled:', this.enableKeycloakSecurity, ')');
    return endpoint;
  }

  /**
   * Get the appropriate indicators endpoint based on authentication
   */
  private getIndicatorsEndpoint(): string {
    const endpoint = this.enableKeycloakSecurity ? 
      this.endpoints.indicators : 
      this.endpoints.indicatorsPublic;
    console.log('Selected indicators endpoint:', endpoint, '(Keycloak enabled:', this.enableKeycloakSecurity, ')');
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
    console.log('Spatial units cache updated');
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
    console.log('Access control cache updated');
  }

  /**
   * Invalidate spatial units cache
   */
  private invalidateSpatialUnitsCache(): void {
    this.spatialUnitsCache = null;
    console.log('Spatial units cache invalidated');
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
} 