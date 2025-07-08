import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KommonitorCacheHelperService {
  private baseUrlToKomMonitorDataAPI: string;
  private spatialUnitsEndpoint = '/spatial-units';
  private spatialUnitsPublicEndpoint = '/public/spatial-units';
  private spatialUnitsProtectedEndpoint = '/spatial-units';

  constructor(
    private http: HttpClient,
    @Inject('kommonitorCacheHelperService') private angularJsCacheHelperService: any
  ) {
    // Initialize the base URL - this should come from environment configuration
    this.baseUrlToKomMonitorDataAPI = this.getBaseApiUrl();
    this.checkAuthentication();
  }

  /**
   * Gets the base API URL from environment configuration
   * This is a placeholder - should be configured properly in environment
   */
  private getBaseApiUrl(): string {
    // This should come from environment configuration
    // For now, using a placeholder that would be configured properly
    return (window as any).__env?.apiUrl + (window as any).__env?.basePath || '';
  }

  /**
   * Checks authentication status and sets appropriate endpoints
   * Mirrors the original AngularJS implementation
   */
  private checkAuthentication(): void {
    // This would check with the authentication service
    // For now, we'll assume authenticated and use protected endpoints
    // In a real implementation, this would check with Keycloak or similar
    const isAuthenticated = this.isUserAuthenticated();
    
    if (isAuthenticated) {
      this.spatialUnitsEndpoint = this.spatialUnitsProtectedEndpoint;
    } else {
      this.spatialUnitsEndpoint = this.spatialUnitsPublicEndpoint;
    }
  }

  /**
   * Checks if user is authenticated
   * This is a placeholder method
   */
  private isUserAuthenticated(): boolean {
    // This would integrate with your authentication service
    // For now, return true as a placeholder
    return true;
  }

  /**
   * Fetches spatial units metadata - delegates to AngularJS service
   */
  async fetchSpatialUnitsMetadata(keycloakRolesArray: string[]): Promise<any[]> {
    return this.angularJsCacheHelperService.fetchSpatialUnitsMetadata(keycloakRolesArray);
  }

  /**
   * Fetches single spatial unit metadata - delegates to AngularJS service
   */
  async fetchSingleSpatialUnitMetadata(spatialUnitId: string, keycloakRolesArray: string[]): Promise<any> {
    return this.angularJsCacheHelperService.fetchSingleSpatialUnitMetadata(spatialUnitId, keycloakRolesArray);
  }

  /**
   * Fetches resource from cache or server with caching logic
   * This is a simplified version of the original caching mechanism
   */
  private async fetchResource_fromCacheOrServer(
    localStorageKey: string,
    resourceEndpoint: string,
    lastModificationResourceName: string,
    keycloakRolesArray: string[],
    filter?: any
  ): Promise<any[]> {
    try {
      // Simplified implementation without full caching logic
      // In a real implementation, you'd check localStorage and last modification timestamps
      const url = `${this.baseUrlToKomMonitorDataAPI}${resourceEndpoint}`;
      
      if (filter) {
        // If filter is provided, make a POST request with filter
        const response = await this.http.post<any[]>(`${url}/filter`, filter, {
          headers: {
            'Content-Type': 'application/json'
          }
        }).toPromise();
        return response || [];
      } else {
        // Standard GET request
        const response = await this.http.get<any[]>(url).toPromise();
        return response || [];
      }
    } catch (error) {
      console.error(`Error fetching resource from ${resourceEndpoint}:`, error);
      return [];
    }
  }

  /**
   * Initialize the service
   * Mirrors the original AngularJS init method
   */
  async init(): Promise<void> {
    this.checkAuthentication();
    // Additional initialization logic could go here
  }
} 