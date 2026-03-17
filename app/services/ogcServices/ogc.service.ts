import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { catchError, map, Observable, of } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

export interface WmsTestResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class OgcService {

  private baseUrlToKomMonitorDataAPI = this.envConfigService.apiUrl + this.envConfigService.basePath;

  constructor(
    private http: HttpClient,
    private envConfigService: EnvConfigService
  ) {}

  testConnection(wmsUrl: string): Observable<WmsTestResult> {
    const url = this.buildGetCapabilitiesUrl(wmsUrl);

    return this.http.get(url, { responseType: 'text' }).pipe(
      map(response => {
        if (
          response.includes('WMS_Capabilities') ||
          response.includes('WMT_MS_Capabilities')
        ) {
          return {
            success: true,
            message: 'WMS connection successful'
          };
        }

        return {
          success: false,
          message: 'Response received, but not a valid WMS service'
        };
      }),
      catchError((error: HttpErrorResponse) => {
        return of({
          success: false,
          message:`HTTP ${error.status}: ${error.statusText}`
        });
      })
    );
  }

  public buildGetCapabilitiesUrl(baseUrl: string): string {

    if(!baseUrl)
      return '';

    const hasQuery = baseUrl.includes('?');
    return `${baseUrl}${(hasQuery ? '&' : '?')}service=WMS&request=GetCapabilities&version=1.3.0`;
  }

  public buildLegendUrl(baseUrl: string, layer:string):string {
    
    if(!baseUrl || !layer)
      return '';

    const hasQuery = baseUrl.includes('?');
    return `${baseUrl}${(hasQuery ? '&' : '?')}service=WMS&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${layer}`;
  }

  registerWms(data): Observable<any> {

    let header = {
      'Content-Type': 'application/json'
    };

    return this.http.post(this.baseUrlToKomMonitorDataAPI + '/web-services', JSON.stringify(data), {headers: header});
  }

  updateWms(id, data): Observable<any> {

    let header = {
      'Content-Type': 'application/json'
    };
                    
    return this.http.put(`${this.baseUrlToKomMonitorDataAPI}/web-services/${id}`, JSON.stringify(data), {headers: header});
  }

  deleteWms(data: WmsDataset): Observable<any> {

    return this.http.delete(`${this.baseUrlToKomMonitorDataAPI}/web-services/${data.id}`);
  }

  updatePermissions(id, data): Observable<any> {

    let header = {
      'Content-Type': 'application/json'
    };
                    
    return this.http.put(`${this.baseUrlToKomMonitorDataAPI}/web-services/${id}/permissions`, JSON.stringify(data), {headers: header});
  }

  updateOwnership(id, data): Observable<any> {

    let header = {
      'Content-Type': 'application/json'
    };
                    
    return this.http.put(`${this.baseUrlToKomMonitorDataAPI}/web-services/${id}/ownership`, JSON.stringify(data), {headers: header});
  }
}
