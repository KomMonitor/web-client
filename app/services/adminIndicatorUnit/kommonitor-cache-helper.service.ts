import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { AuthService } from 'services/auth-service/auth.service';

// Interfaces for type safety
export interface DatabaseModificationInfo {
  lastModification: string;
  spatialUnits: string;
  georesources: string;
  indicators: string;
  topics: string;
  processScripts: string;
  accessControl: string;
}

@Injectable({
  providedIn: 'root'
})
export class KommonitorIndicatorCacheHelperService {
  // Private subjects for reactive updates
  private lastModificationSubject = new BehaviorSubject<DatabaseModificationInfo | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

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
  private readonly indicatorsPublicEndpoint = "/public/indicators";
  private readonly indicatorsProtectedEndpoint = "/indicators";
  private indicatorsEndpoint = this.indicatorsProtectedEndpoint;

  // Local storage keys (like original AngularJS service)
  private readonly localStorageKey_indicators: string;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Get environment configuration
    this.env = (window as any).__env;
    this.baseUrl = this.getBaseApiUrl();
    this.localStoragePrefix = this.env?.localStoragePrefix || 'kommonitor';
    this.localStorageKey_indicators = this.localStoragePrefix + "_lastModification_indicators";
    
    // Initialize like original AngularJS service
    this.init();
  }

  /**
   * Initialize the service (like original AngularJS service)
   */
  private async init(): Promise<void> {
    this.checkAuthentication();
    await this.fetchLastDatabaseModificationObject();
  }

  /**
   * Check authentication and set appropriate endpoints (like original AngularJS service)
   */
  private checkAuthentication(): void {
    if (this.authService.Auth && this.authService.Auth.keycloak && this.authService.Auth.keycloak.authenticated) {
      this.indicatorsEndpoint = this.indicatorsProtectedEndpoint;
    } else {
      this.indicatorsEndpoint = this.indicatorsPublicEndpoint;
    }
  }

  /**
   * Fetch last database modification object (like original AngularJS service)
   */
  private async fetchLastDatabaseModificationObject(): Promise<void> {
    try {
      const url = `${this.baseUrl}/public/database/last-modification`;
      const response = await firstValueFrom(this.http.get<DatabaseModificationInfo>(url));
      console.log("fetchLastDatabaseModificationObject", response);
      this.lastDatabaseModificationInfo = response;
      this.lastModificationSubject.next(response);
    } catch (error) {
      // Error fetching last modification info
    }
  }

  /**
   * Fetches indicators metadata with caching (like original AngularJS service)
   */
  async fetchIndicatorsMetadata(keycloakRolesArray: string[], filter?: any): Promise<any[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log("Cache Helper - fetchIndicatorsMetadata called with roles:", keycloakRolesArray);
    console.log("Cache Helper - filter:", filter);

    try {
      // Check authentication
      this.checkAuthentication();
      console.log("Cache Helper - indicatorsEndpoint:", this.indicatorsEndpoint);
      // Use the same logic as original AngularJS service
      if (filter) {
        const filterBody = {
          topicIds: filter.indicatorTopics,
          ids: filter.indicators
        };
        return await this.fetchResource_fromCacheOrServer(
          this.localStorageKey_indicators,
          this.indicatorsEndpoint,
          "indicators",
          keycloakRolesArray,
          filterBody
        );
      } else {
        return await this.fetchResource_fromCacheOrServer(
          this.localStorageKey_indicators,
          this.indicatorsEndpoint,
          "indicators",
          keycloakRolesArray
        );
      }
    } catch (error) {
      this.errorSubject.next('Error fetching indicators metadata');
      this.loadingSubject.next(false);
      throw error;
    }
  }

  /**
   * Fetches single indicator metadata (like original AngularJS service)
   */
  async fetchSingleIndicatorMetadata(indicatorId: string, keycloakRolesArray: string[]): Promise<any> {
    try {
      const url = `${this.baseUrl}${this.indicatorsEndpoint}/${indicatorId}`;
      const headers = this.getAuthHeaders();
      const response = await firstValueFrom(this.http.get(url, { headers }));
      
      // Refresh the full indicators cache in the background (like original AngularJS service)
      this.fetchIndicatorsMetadata(keycloakRolesArray);
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch resource from cache or server (like original AngularJS service)
   */
  private async fetchResource_fromCacheOrServer(
    localStorageKey: string,
    resourceEndpoint: string,
    lastModificationResourceName: string,
    keycloakRolesArray: string[],
    filter?: any
  ): Promise<any[]> {
    console.log("Cache Helper - fetchResource_fromCacheOrServer called with roles:", keycloakRolesArray);
    
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
    
    console.log("Cache Helper - Generated cache keys:");
    console.log("Cache Helper - metadataKey:", metadataKey);
    console.log("Cache Helper - timestampKey:", timestampKey);

    // Check cache timestamp (like original AngularJS service)
    let lastModTimestamp_fromCache_string = localStorage.getItem(timestampKey);

    if (lastModTimestamp_fromCache_string && !filter) {
      let lastModTimestamp_fromCache = JSON.parse(lastModTimestamp_fromCache_string);

      if (lastModTimestamp_fromCache && this.lastDatabaseModificationInfo) {
        let lastModTimestamp_fromServer = this.lastDatabaseModificationInfo[lastModificationResourceName];

        if (lastModTimestamp_fromCache == lastModTimestamp_fromServer) {
          let storageObject_string = localStorage.getItem(metadataKey);

          if (storageObject_string) {
            let storageObject = JSON.parse(storageObject_string);
            this.loadingSubject.next(false);
            return storageObject;
          }
        }
      }
    }

    // Fetch from server (like original AngularJS service)
    if (filter) {
      const url = `${this.baseUrl}${resourceEndpoint}/filter`;
      const headers = this.getAuthHeaders();
      console.log("Cache Helper - Making POST request to:", url);
      console.log("Cache Helper - Headers:", headers);
      const response = await firstValueFrom(this.http.post<any[]>(url, filter, { headers }));
      console.log("Cache Helper - POST response:", response);
      this.loadingSubject.next(false);
      return response;
    } else {
      // Persist timestamp when fetching from server (like original AngularJS service)
      if (this.lastDatabaseModificationInfo) {
        localStorage.setItem(timestampKey, JSON.stringify(this.lastDatabaseModificationInfo[lastModificationResourceName]));
      }

      const url = `${this.baseUrl}${resourceEndpoint}`;
      const headers = this.getAuthHeaders();
      console.log("Cache Helper - Making GET request to:", url);
      console.log("Cache Helper - Headers:", headers);
      const response = await firstValueFrom(this.http.get<any[]>(url, { headers }));
      console.log("Cache Helper - GET response:", response);
      
      // Cache the response (like original AngularJS service)
      if (response && response.length > 0) {
        localStorage.setItem(metadataKey, JSON.stringify(response));
      }

      this.loadingSubject.next(false);
      return response;
    }
  }

  /**
   * Get base API URL (like original AngularJS service)
   */
  private getBaseApiUrl(): string {
    const apiUrl = this.env?.apiUrl || '';
    const basePath = this.env?.basePath || '';
    return apiUrl + basePath;
  }

  /**
   * Get authentication headers (like original AngularJS service)
   */
  private getAuthHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Add authentication headers if needed
    if (this.env?.enableKeycloakSecurity) {
      const token = this.getKeycloakToken();
      if (token) {
        return headers.set('Authorization', `Bearer ${token}`);
      }
    }
    
    return headers;
  }

  /**
   * Get Keycloak token (like original AngularJS service)
   */
  private getKeycloakToken(): string | null {
    if (this.authService.Auth && this.authService.Auth.keycloak && this.authService.Auth.keycloak.token) {
      return this.authService.Auth.keycloak.token;
    }
    return null;
  }
} 