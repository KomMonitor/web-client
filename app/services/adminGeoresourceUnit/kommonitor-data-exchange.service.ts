import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, timer, filter, takeUntil, map } from 'rxjs';
import { map as rxMap, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../auth-service/auth.service';
import { KommonitorGeoresourceCacheHelperService } from './kommonitor-cache-helper.service';

// Interfaces for better typing
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

export interface TopicHierarchy {
  topicId: string;
  name: string;
  title?: string;
  topicType?: string;
  topicResource?: string;
  topicName?: string;
  subTopics?: TopicHierarchy[];
}

export interface RoleMetadata {
  organizationalUnitId: string;
  name: string;
  title?: string;
  permissions?: Array<{
    permissionId: string;
    permissionLevel: string;
    isChecked?: boolean;
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
export class KommonitorGeoresourceDataExchangeService implements OnDestroy {
  // Private subjects for reactive updates
  private georesourcesSubject = new BehaviorSubject<GeoresourceMetadata[]>([]);
  private currentRolesSubject = new BehaviorSubject<string[]>([]);
  private komMonitorRolesSubject = new BehaviorSubject<string[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private authenticationStateSubject = new BehaviorSubject<boolean>(false);

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  // Public observables
  public georesources$ = this.georesourcesSubject.asObservable();
  public currentRoles$ = this.currentRolesSubject.asObservable();
  public komMonitorRoles$ = this.komMonitorRolesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public authenticationState$ = this.authenticationStateSubject.asObservable();

  // Cache for data with expiration
  private georesourcesCache: {
    data: GeoresourceMetadata[];
    timestamp: number;
    expiresAt: number;
  } | null = null;

  // Cache duration in milliseconds (5 minutes)
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  // Environment configuration
  private readonly env: any;
  private readonly baseUrl: string;

  // Date picker options
  datePickerOptions = {
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayHighlight: true,
    clearBtn: true
  };

  // Configuration options
  enableKeycloakSecurity = true;
  updateIntervalOptions = [
    {
      displayName: "jährlich",
      apiName: "YEARLY"
    },
    {
      displayName: "halbjährlich",
      apiName: "HALF_YEARLY"
    },
    {
      displayName: "vierteljährlich",
      apiName: "QUARTERLY"
    },
    {
      displayName: "monatlich",
      apiName: "MONTHLY"
    },
    {
      displayName: "wöchentlich",
      apiName: "WEEKLY"
    },
    {
      displayName: "täglich",
      apiName: "DAILY"
    },
    {
      displayName: "beliebig",
      apiName: "ARBITRARY"
    }
  ];

  // Available POI marker colors
  availablePoiMarkerColors = [
    {
      "colorName": "red",
      "colorValue": "rgb(205,59,40)"
    },
    {
      "colorName": "white",
      "colorValue": "rgb(255,255,255)"
    },
    {
      "colorName": "orange",
      "colorValue": "rgb(235,144,46)"
    },
    {
      "colorName": "beige",
      "colorValue": "rgb(255,198,138)"
    },
    {
      "colorName": "green",
      "colorValue": "rgb(108,166,36)"
    },
    {
      "colorName": "blue",
      "colorValue": "rgb(53,161,209)"
    },
    {
      "colorName": "purple",
      "colorValue": "rgb(198,77,175)"
    },
    {
      "colorName": "pink",
      "colorValue": "rgb(255,138,232)"
    },
    {
      "colorName": "gray",
      "colorValue": "rgb(163,163,163)"
    },
    {
      "colorName": "black",
      "colorValue": "rgb(47,47,47)"
    }
  ];

  // Available LOI dash array objects
  availableLoiDashArrayObjects = [
    {
      "svgString": '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black"/></svg>',
      "dashArrayValue": ""
    },
    {
      "svgString": '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20"/></svg>',
      "dashArrayValue": "20"
    },
    {
      "svgString": '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20 10"/></svg>',
      "dashArrayValue": "20 10"
    },
    {
      "svgString": '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20 10 5 10"/></svg>',
      "dashArrayValue": "20 10 5 10"
    },
    {
      "svgString": '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="5"/></svg>',
      "dashArrayValue": "5"
    }
  ];

  // Available spatial units
  availableSpatialUnits: any[] = [];

  // Additional configuration options from AngularJS
  indicatorTypeOptions: any[] = [];
  indicatorUnitOptions: any[] = [];
  indicatorCreationTypeOptions: any[] = [];
  geodataSourceFormats: any[] = [];

  // Current user state
  private _currentKeycloakLoginRoles: string[] = [];
  private _currentKomMonitorLoginRoleNames: string[] = [];
  private currentKeycloakUser: any = null;

  // Maps for quick access (like original AngularJS service)
  private availableGeoresources_map = new Map<string, GeoresourceMetadata>();
  private availableTopics_map = new Map<string, TopicHierarchy>();
  private availableRoles_map = new Map<string, RoleMetadata>();

  // Available resources arrays (like original AngularJS service)
  private _availableGeoresources: GeoresourceMetadata[] = [];
  private _availableTopics: TopicHierarchy[] = [];
  private _accessControl: RoleMetadata[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cacheHelperService: KommonitorGeoresourceCacheHelperService
  ) {
    // Get environment configuration
    this.env = (window as any).__env || this.getDefaultEnvironment();
    this.baseUrl = this.getBaseApiUrl();
    
    // Initialize environment-based options
    this.initializeEnvironmentOptions();
    
    // Initialize the service
    this.initializeService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize environment-based configuration options
   */
  private initializeEnvironmentOptions(): void {
    // Initialize options from environment configuration
    if (this.env?.updateIntervalOptions) {
      this.updateIntervalOptions = this.env.updateIntervalOptions;
    }
    if (this.env?.indicatorTypeOptions) {
      this.indicatorTypeOptions = this.env.indicatorTypeOptions;
    }
    if (this.env?.indicatorUnitOptions) {
      this.indicatorUnitOptions = this.env.indicatorUnitOptions.sort();
    }
    if (this.env?.indicatorCreationTypeOptions) {
      this.indicatorCreationTypeOptions = this.env.indicatorCreationTypeOptions;
    }
    if (this.env?.geodataSourceFormats) {
      this.geodataSourceFormats = this.env.geodataSourceFormats;
    }
  }

  /**
   * Get LOI dash SVG from string value (like AngularJS service)
   */
  getLoiDashSvgFromStringValue(loiDashArrayString: string): string | undefined {
    for (const loiDashArrayObject of this.availableLoiDashArrayObjects) {
      if (loiDashArrayObject.dashArrayValue === loiDashArrayString) {
        return loiDashArrayObject.svgString;
      }
    }
    return undefined;
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
    const accessControl = this._accessControl;
    if (accessControl && accessControl.length > 0) {
      accessControl.forEach(organizationalUnit => {
        if (organizationalUnit.name) {
          for (const roleSuffix of roleSuffixes) {
            possibleRoles.push(organizationalUnit.name + "." + roleSuffix);
          }
        }
      });
    }

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
   * Set current Keycloak login roles and update subjects
   */
  private setCurrentKeycloakLoginRoles(roles: string[]): void {
    this._currentKeycloakLoginRoles = roles;
    this.currentRolesSubject.next(roles);
    
    // Also filter and set KomMonitor-specific roles
    const komMonitorRoles = this.filterKomMonitorRoles(roles);
    this._currentKomMonitorLoginRoleNames = komMonitorRoles;
    this.komMonitorRolesSubject.next(komMonitorRoles);
  }

  /**
   * Clear all roles when user logs out
   */
  private clearRoles(): void {
    this._currentKeycloakLoginRoles = [];
    this._currentKomMonitorLoginRoleNames = [];
    this.currentRolesSubject.next([]);
    this.komMonitorRolesSubject.next([]);
  }

  /**
   * Get current KomMonitor login role names
   */
  get currentKomMonitorLoginRoleNames(): string[] {
    return this._currentKomMonitorLoginRoleNames;
  }

  /**
   * Get current KomMonitor login role IDs
   */
  getCurrentKomMonitorLoginRoleIds(): string[] {
    return this._currentKomMonitorLoginRoleNames;
  }

  /**
   * Get default environment configuration
   */
  private getDefaultEnvironment(): any {
    return {
      enableKeycloakSecurity: true,
      keycloakKomMonitorAdminRoleName: 'kommonitor-creator',
      keycloakKomMonitorGroupsEditRoleNames: ['client-users-creator', 'unit-users-creator'],
      keycloakKomMonitorThemesEditRoleNames: ['client-themes-creator', 'unit-themes-creator'],
      keycloakKomMonitorGeodataEditRoleNames: ['client-resources-creator', 'unit-resources-creator'],
      updateIntervalOptions: [
        { displayName: 'jährlich', apiName: 'YEARLY' },
        { displayName: 'halbjährlich', apiName: 'HALF_YEARLY' },
        { displayName: 'vierteljährlich', apiName: 'QUARTERLY' },
        { displayName: 'monatlich', apiName: 'MONTHLY' },
        { displayName: 'beliebig', apiName: 'ARBITRARY' }
      ],
      availablePoiMarkerColors: [
        { colorName: 'Weiß', colorValue: '#ffffff' },
        { colorName: 'Rot', colorValue: '#ff0000' },
        { colorName: 'Orange', colorValue: '#ffa500' },
        { colorName: 'Beige', colorValue: '#f5f5dc' },
        { colorName: 'Grün', colorValue: '#008000' },
        { colorName: 'Blau', colorValue: '#0000ff' },
        { colorName: 'Lila', colorValue: '#800080' },
        { colorName: 'Pink', colorValue: '#ffc0cb' },
        { colorName: 'Grau', colorValue: '#808080' },
        { colorName: 'Schwarz', colorValue: '#000000' }
      ],
      availableLoiDashArrayObjects: [
        { displayName: 'Durchgezogen', dashArrayValue: '0' },
        { displayName: 'Gestrichelt', dashArrayValue: '20 20' },
        { displayName: 'Gepunktet', dashArrayValue: '5 5' }
      ]
    };
  }

  /**
   * Get base API URL from environment configuration
   */
  private getBaseApiUrl(): string {
    if (this.env?.configStorageServerConfig?.targetUrlToConfigStorageServer) {
      return this.env.configStorageServerConfig.targetUrlToConfigStorageServer;
    }
    if (this.env?.apiUrl && this.env?.basePath) {
      return `${this.env.apiUrl}${this.env.basePath}`;
    }
    // Fallback to default values
    return 'http://localhost:8085/management';
  }



  /**
   * Get available georesources
   */
  get availableGeoresources(): GeoresourceMetadata[] {
    return this._availableGeoresources;
  }

  /**
   * Get current Keycloak login roles
   */
  get currentKeycloakLoginRoles(): string[] {
    return this._currentKeycloakLoginRoles;
  }

  /**
   * Get available topics
   */
  get availableTopics(): TopicHierarchy[] {
    return this._availableTopics;
  }

  /**
   * Get access control
   */
  get accessControl(): RoleMetadata[] {
    return this._accessControl;
  }

  /**
   * Check create permission
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
   * Check editor permission
   */
  checkEditorPermission(): boolean {
    const roles = this.currentKeycloakLoginRoles;
    const komMonitorRoles = this.currentKomMonitorLoginRoleNames;
    
    // Check for admin role
    if (roles.includes(this.env?.keycloakKomMonitorAdminRoleName || 'kommonitor-creator')) {
      return true;
    }
    
    // Check for editor or creator roles
    const hasEditorRole = komMonitorRoles.some(role => role.endsWith('-editor') || role.endsWith('-creator'));
    
    return hasEditorRole;
  }

  /**
   * Check delete permission
   */
  checkDeletePermission(): boolean {
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
   * Fetch georesources metadata
   */
  async fetchGeoresourcesMetadata(keycloakRolesArray: string[], filter?: any): Promise<GeoresourceMetadata[]> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      // Check cache first
      if (this.georesourcesCache && Date.now() - this.georesourcesCache.timestamp < this.CACHE_DURATION) {
        this.setGeoresources(this.georesourcesCache.data);
        return this.georesourcesCache.data;
      }

      // Fetch from API
      const url = `${this.baseUrl}/georesources`;
      const headers = this.getAuthHeaders();
      
      let response: GeoresourceMetadata[] | undefined;
      if (filter) {
        // POST request with filter
        response = await this.http.post<GeoresourceMetadata[]>(`${url}/filter`, filter, { headers }).toPromise();
      } else {
        // Standard GET request
        response = await this.http.get<GeoresourceMetadata[]>(url, { headers }).toPromise();
      }
      
      if (!response) {
        throw new Error('No response from georesources API');
      }

      // Update cache
      this.georesourcesCache = {
        data: response,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      };

      // Set georesources
      this.setGeoresources(response);

      return response;

    } catch (error) {
      console.error('Error fetching georesources metadata:', error);
      this.handleError(error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Set georesources (like original AngularJS service)
   */
  private setGeoresources(georesourcesArray: GeoresourceMetadata[]): void {
    this._availableGeoresources = georesourcesArray;
    this.availableGeoresources_map.clear();
    
    for (const georesourceMetadata of georesourcesArray) {
      this.availableGeoresources_map.set(georesourceMetadata.georesourceId, georesourceMetadata);
    }

    // Update the subject
    this.georesourcesSubject.next(georesourcesArray);
  }

  /**
   * Add single georesource metadata (like original AngularJS service)
   */
  addSingleGeoresourceMetadata(georesourceMetadata: GeoresourceMetadata): void {
    const tmpArray = [georesourceMetadata];
    Array.prototype.push.apply(tmpArray, this._availableGeoresources);
    this._availableGeoresources = tmpArray;
    this.availableGeoresources_map.set(georesourceMetadata.georesourceId, georesourceMetadata);
    
    // Update the subject
    this.georesourcesSubject.next(this._availableGeoresources);
  }

  /**
   * Replace single georesource metadata (like original AngularJS service)
   */
  replaceSingleGeoresourceMetadata(georesourceMetadata: GeoresourceMetadata): void {
    for (let index = 0; index < this._availableGeoresources.length; index++) {
      const georesource = this._availableGeoresources[index];
      if (georesource.georesourceId === georesourceMetadata.georesourceId) {
        this._availableGeoresources[index] = georesourceMetadata;
        break;
      }
    }
    this.availableGeoresources_map.set(georesourceMetadata.georesourceId, georesourceMetadata);
    // Keep cache in sync so a subsequent cached fetch does not overwrite fresh data
    if (this.georesourcesCache && Array.isArray(this.georesourcesCache.data)) {
      const cacheIndex = this.georesourcesCache.data.findIndex(
        (g) => g.georesourceId === georesourceMetadata.georesourceId
      );
      if (cacheIndex !== -1) {
        this.georesourcesCache.data[cacheIndex] = georesourceMetadata;
      } else {
        // If it wasn't present, prepend to keep behavior consistent with add
        this.georesourcesCache.data.unshift(georesourceMetadata);
      }
      // Refresh cache timestamp to avoid immediate refetch churn
      this.georesourcesCache.timestamp = Date.now();
    }
    
    // Update the subject
    this.georesourcesSubject.next(this._availableGeoresources);
  }

  /**
   * Delete single georesource metadata (like original AngularJS service)
   */
  deleteSingleGeoresourceMetadata(georesourceId: string): void {
    for (let index = 0; index < this._availableGeoresources.length; index++) {
      const georesource = this._availableGeoresources[index];
      if (georesource.georesourceId === georesourceId) {
        this._availableGeoresources.splice(index, 1);
        break;
      }
    }
    this.availableGeoresources_map.delete(georesourceId);
    
    // Update the subject
    this.georesourcesSubject.next(this._availableGeoresources);
  }

  /**
   * Get georesource metadata by ID (like original AngularJS service)
   */
  getGeoresourceMetadataById(georesourceId: string): GeoresourceMetadata | undefined {
    return this.availableGeoresources_map.get(georesourceId);
  }

  /**
   * Get base URL to KomMonitor Data API for spatial resources
   */
  getBaseUrlToKomMonitorDataAPI_spatialResource(): string {
    return this.baseUrl;
  }

  /**
   * Get base URL to KomMonitor Data API (getter for compatibility)
   */
  get baseUrlToKomMonitorDataAPI(): string {
    return this.baseUrl;
  }

  /**
   * Get role title (like original AngularJS service)
   */
  getRoleTitle(roleId: string): string {
    const role = this.availableRoles_map.get(roleId);
    if (role) {
      return role.title || role.name || roleId;
    }
    return roleId;
  }



  /**
   * Get topic hierarchy display string (like original AngularJS service)
   */
  getTopicHierarchyDisplayString(topicReference: any): string {
    if (!topicReference) return '';
    
    if (Array.isArray(topicReference)) {
      return topicReference.map((topic: any) => topic.name || topic.title || topic.id).join(' > ');
    }
    
    if (typeof topicReference === 'object') {
      return topicReference.name || topicReference.title || topicReference.id || '';
    }
    
    return String(topicReference);
  }

  /**
   * Get all allowed roles string (like original AngularJS service)
   */
  getAllowedRolesString(permissions: any): string {
    if (!permissions) return '';
    
    if (Array.isArray(permissions)) {
      return permissions.join(', ');
    }
    
    if (typeof permissions === 'object') {
      return Object.keys(permissions).join(', ');
    }
    
    return String(permissions);
  }



  /**
   * Syntax highlight JSON for display (matches original AngularJS implementation)
   */
  syntaxHighlightJSON(json: any): string {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, undefined, 2);
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
    console.error('Service error:', error);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.georesourcesCache = null;
  }

  /**
   * Refresh data
   */
  async refreshData(): Promise<void> {
    this.clearCache();
    await this.fetchGeoresourcesMetadata(this._currentKeycloakLoginRoles);
  }

  // Get access control by ID
  getAccessControlById(organizationalUnitId: string): any | undefined {
    if (!this.accessControl) return undefined;
    return this.accessControl.find(item => item.organizationalUnitId === organizationalUnitId);
  }

  // Fetch access control metadata
  async fetchAccessControlMetadata(): Promise<void> {
    try {
      console.log('Fetching access control metadata from:', `${this.baseUrl}/organizationalUnits`);
      const response = await this.http.get<any[]>(`${this.baseUrl}/organizationalUnits`).toPromise();
      console.log('Access control metadata response:', response);
      if (response) {
        this._accessControl = response;
        console.log('Access control data set:', this._accessControl);
      }
    } catch (error) {
      console.error('Error fetching access control metadata:', error);
      console.error('Base URL:', this.baseUrl);
      console.error('Full URL:', `${this.baseUrl}/organizationalUnits`);
      throw error;
    }
  }

  /**
   * Fetches topics metadata
   */
  async fetchTopicsMetadata(keycloakRolesArray: string[]): Promise<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Set the current roles for permission checking
    this.setCurrentKeycloakLoginRoles(keycloakRolesArray);
    
    try {
      // Check cache first
      if (this._availableTopics && this._availableTopics.length > 0) {
        console.log('Using cached topics data');
        this.loadingSubject.next(false);
        return this._availableTopics;
      }

      // Use cache helper service to fetch topics
      if (!this.cacheHelperService) {
        console.error('Cache helper service not available');
        throw new Error('Cache helper service not available');
      }

      const topics = await this.cacheHelperService.fetchTopicsMetadata(keycloakRolesArray);
      
      if (!topics || !Array.isArray(topics)) {
        console.warn('No topics data received from cache helper');
        this._availableTopics = [];
        this.loadingSubject.next(false);
        return [];
      }
      
      // Transform the response to match TopicHierarchy interface
      const transformedTopics = this.transformTopicsResponse(topics);
      this._availableTopics = transformedTopics;
      
      // Update the map for quick access
      this.availableTopics_map.clear();
      transformedTopics.forEach(topic => {
        this.availableTopics_map.set(topic.topicId, topic);
      });
      
      console.log('Topics data loaded:', this._availableTopics);
      this.loadingSubject.next(false);
      
      return this._availableTopics;
    } catch (error) {
      console.error('Error fetching topics metadata:', error);
      this.handleError(error);
      this.loadingSubject.next(false);
      throw error;
    }
  }

  /**
   * Transform API response to TopicHierarchy format
   */
  private transformTopicsResponse(apiTopics: any[]): TopicHierarchy[] {
    const transformed = apiTopics.map(topic => ({
      topicId: topic.topicId || topic.id,
      name: topic.name || topic.topicName,
      title: topic.title || topic.name || topic.topicName,
      topicType: topic.topicType,
      topicResource: topic.topicResource,
      topicName: topic.topicName || topic.name || topic.title,
      subTopics: Array.isArray(topic.subTopics) ? this.transformTopicsResponse(topic.subTopics) : undefined
    }));
    try {
      console.log('[DataExchangeService] transformTopicsResponse -> counts', {
        inputCount: Array.isArray(apiTopics) ? apiTopics.length : 0,
        outputCount: Array.isArray(transformed) ? transformed.length : 0
      });
    } catch {}
    return transformed;
  }

  // Check if user has admin permission (matches original AngularJS implementation)
  checkAdminPermission(): boolean {
    if (!this.env?.keycloakKomMonitorAdminRoleName) {
      return false;
    }
    
    return this.currentKeycloakLoginRoles.includes(this.env.keycloakKomMonitorAdminRoleName);
  }

  // Get topic hierarchy for topic ID (matches original AngularJS implementation)
  getTopicHierarchyForTopicId(topicReferenceId: string): TopicHierarchy[] {
    // create an array representing the topic hierarchy
    // i.e. [mainTopic_firstTier, subTopic_secondTier, subTopic_thirdTier, ...]
    const topicHierarchyArray: TopicHierarchy[] = [];

    for (let i = 0; i < this.availableTopics.length; i++) {
      const mainTopicCandidate = this.availableTopics[i];

      if (mainTopicCandidate.topicId === topicReferenceId) {
        topicHierarchyArray.push(mainTopicCandidate);
        break;
      } else if (mainTopicCandidate.subTopics && this.findIdInAnySubTopicHierarchy(topicReferenceId, mainTopicCandidate.subTopics)) {
        topicHierarchyArray.push(mainTopicCandidate);
        return this.addSubTopicHierarchy(topicHierarchyArray, topicReferenceId, mainTopicCandidate.subTopics);
      }
    }

    return topicHierarchyArray;
  }

  private findIdInAnySubTopicHierarchy(topicReferenceId: string, subTopicsArray: TopicHierarchy[]): boolean {
    for (let index = 0; index < subTopicsArray.length; index++) {
      const subTopicCandidate = subTopicsArray[index];

      if (subTopicCandidate.topicId === topicReferenceId) {
        return true;
      } else if (subTopicCandidate.subTopics && this.findIdInAnySubTopicHierarchy(topicReferenceId, subTopicCandidate.subTopics)) {
        return true;
      }
    }

    return false;
  }

  private addSubTopicHierarchy(topicHierarchyArray: TopicHierarchy[], topicReferenceId: string, subTopicsArray: TopicHierarchy[]): TopicHierarchy[] {
    for (let index = 0; index < subTopicsArray.length; index++) {
      const subTopicCandidate = subTopicsArray[index];

      if (subTopicCandidate.topicId === topicReferenceId) {
        topicHierarchyArray.push(subTopicCandidate);
        break;
      } else if (subTopicCandidate.subTopics && this.findIdInAnySubTopicHierarchy(topicReferenceId, subTopicCandidate.subTopics)) {
        topicHierarchyArray.push(subTopicCandidate);
        return this.addSubTopicHierarchy(topicHierarchyArray, topicReferenceId, subTopicCandidate.subTopics);
      }
    }

    return topicHierarchyArray;
  }
} 