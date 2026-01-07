import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

export interface WmsTestResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class OgcService {


  constructor(private http: HttpClient) {}

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
    const hasQuery = baseUrl.includes('?');
    return `${baseUrl}${(hasQuery ? '&' : '?')}service=WMS&request=GetCapabilities&version=1.3.0`;
  }

  public buildLegendUrl(baseUrl: string, layer:string):string {
    const hasQuery = baseUrl.includes('?');
    return `${baseUrl}${(hasQuery ? '&' : '?')}service=WMS&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${layer}`;
  }
}
