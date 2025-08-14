import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../auth-service/auth.service';

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
  subTopics?: TopicHierarchy[];
}

export interface RoleMetadata {
  organizationalUnitId: string;
  name: string;
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KommonitorGeoresourceDataExchangeService implements OnDestroy {
  // Private subjects for reactive updates
  private georesourcesSubject = new BehaviorSubject<GeoresourceMetadata[]>([]);
  private currentRolesSubject = new BehaviorSubject<string[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  // Public observables
  public georesources$ = this.georesourcesSubject.asObservable();
  public currentRoles$ = this.currentRolesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

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

  // Current user state
  private _currentKeycloakLoginRoles: string[] = [];
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
    private authService: AuthService
  ) {
    // Get environment configuration
    this.env = (window as any).__env;
    this.baseUrl = this.getBaseApiUrl();
    
    // Initialize the service
    this.initializeService();
  }

  /**
   * Initialize the service
   */
  private async initializeService(): Promise<void> {
    try {
      // Check authentication
      await this.checkAuthentication();
      
      // Initialize current roles
      this._currentKeycloakLoginRoles = await this.getCurrentUserRoles();
      this.currentRolesSubject.next(this._currentKeycloakLoginRoles);
      
    } catch (error) {
      console.error('Error initializing georesource data exchange service:', error);
      this.handleError(error);
    }
  }

  /**
   * Check authentication status
   */
  private async checkAuthentication(): Promise<void> {
    try {
      const isAuthenticated = this.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      throw error;
    }
  }

  /**
   * Get current user roles
   */
  private async getCurrentUserRoles(): Promise<string[]> {
    try {
      const roles = this.getCurrentUserRolesFromKeycloak();
      return roles;
    } catch (error) {
      console.error('Failed to get current user roles:', error);
      return [];
    }
  }

  /**
   * Check if user is authenticated using Keycloak
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
   * Get current user roles from Keycloak
   */
  private getCurrentUserRolesFromKeycloak(): string[] {
    try {
      const keycloak = this.authService.Auth?.keycloak;
      if (keycloak?.tokenParsed?.realm_access?.roles) {
        return keycloak.tokenParsed.realm_access.roles;
      }
      return [];
    } catch (error) {
      console.error('Failed to get roles from Keycloak:', error);
      return [];
    }
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
   * Check create permission
   */
  checkCreatePermission(): boolean {
    return this._currentKeycloakLoginRoles.includes('creator') || 
           this._currentKeycloakLoginRoles.includes('admin');
  }

  /**
   * Check editor permission
   */
  checkEditorPermission(): boolean {
    return this._currentKeycloakLoginRoles.includes('editor') || 
           this._currentKeycloakLoginRoles.includes('creator') || 
           this._currentKeycloakLoginRoles.includes('admin');
  }

  /**
   * Check delete permission
   */
  checkDeletePermission(): boolean {
    return this._currentKeycloakLoginRoles.includes('creator') || 
           this._currentKeycloakLoginRoles.includes('admin');
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
   * Get LOI dash SVG from string value (like original AngularJS service)
   */
  getLoiDashSvgFromStringValue(dashArrayString: string): string {
    if (!dashArrayString) return '';
    
    // Simple implementation - can be enhanced to generate actual SVG
    return `<div style="border-top: 2px dashed #000; width: 20px;"></div>`;
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

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 