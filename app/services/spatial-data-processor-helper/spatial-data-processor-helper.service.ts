import { AuthService } from 'services/auth-service/auth.service';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpatialDataProcessorHelperService {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);

  targetUrlToSpatialDataProcessorInstance =
    this.envConfigService.targetUrlToSpatialDataProcessorInstance;
  targetProcessName_indicatorReachabilityStatistics =
    this.envConfigService.spatialDataProcessor_processName_indicatorReachabilityStatistics;

  postNewIsochroneStatistic(
    indicatorIdArray,
    isochroneGeoJson,
    spatialUnitId,
    targetDate,
    weighting
  ): Promise<string> {
    // get auth token to make authenticated requests
    const bearerToken = this.authService.getToken();

    /*
    {
      "name": "isochrone-prune",
      "isochrones": {},
      "spatialUnit": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "indicator": [
        "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      ],
      "date": "2023-07-12",
      "weighting": "simple"
    }
    */

    // remove any olf relics from isochrone geoJSON document
    for (const poiFeature of isochroneGeoJson.features) {
      // ensure that each poi does not hold old information from another scenario
      delete poiFeature.properties.individualIsochrones;
      delete poiFeature.properties.individualIsochronePruneResults;
    }

    const body = {
      name: 'isochrone-prune',
      isochrones: JSON.stringify(isochroneGeoJson),
      spatialUnit: spatialUnitId,
      indicator: indicatorIdArray,
      date: targetDate,
      weighting: weighting,
    };

    const headers = {
      Accept: 'application/json',
    };
    if (bearerToken) {
      headers['Authorization'] = 'Bearer ' + bearerToken; // Note the appropriate header
    }

    return new Promise((resolve) => {
      this.http
        .post(this.targetUrlToSpatialDataProcessorInstance + 'jobs', body, { headers: headers })
        .subscribe({
          next: (response: any) => {
            resolve(response);
          },
          error: (error) => {
            console.error('Error while posting isochrone statistic request.');
            throw error;
          },
        });
    });
  }

  /*
    {
      "id": "a81da875-2e13-4436-8643-08b532637b07",
      "process": "org.n52.kommonitor.spatialdataprocessor.process.IsochronePruneProcess@323aa6ab",
      "timestamp": "2023-09-01T09:17:20.9885221+02:00",
      "status": "finished"
    }
  */
  async getJobStatus(jobId) {
    // get auth token to make authenticated requests
    const bearerToken = this.authService.getToken();

    const headers = {
      Accept: 'application/json',
    };
    if (bearerToken) {
      headers['Authorization'] = 'Bearer ' + bearerToken; // Note the appropriate header
    }

    /*
    returns
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "process": "string",
        "timestamp": "2023-07-12T21:16:34.843Z",
        "status": "queued"
      }
    */

    return await firstValueFrom(
      this.http.get(this.targetUrlToSpatialDataProcessorInstance + 'jobs/' + jobId, {
        headers: headers,
      })
    );
  }

  /*
  {
    "id": "a81da875-2e13-4436-8643-08b532637b07",
    "result": [
      {
        "indicatorId": "eefe288b-0da8-4d30-a2fe-759a9814f9d5",
          "timeseries": [
            {
                "date": "2021-12-31",
                "value": 588375.0
            }
        ],
        "overallCoverage": [
          {
            "range": 300,
            "coverage": [
              {
                "date": "2023-01-01",
                "absoluteCoverage": 350.60593,
                "relativeCoverage": 0.11357497
              }
            ]
          }
        ],
        "poiCoverage": [
          {
            "poiFeatureId": "35_5",
            "overallCoverage": [
              {
                "date": "2023-01-01",
                "absoluteCoverage": 6.3172536,
                "relativeCoverage": 0.0020464053
              }
            ],
            "spatialUnitCoverage": [
              {
                "spatialUnitFeatureId": "7",
                "coverage": [
                  {
                    "date": "2023-01-01",
                    "absoluteCoverage": 6.3172536,
                    "relativeCoverage": 0.0186901
                  }
                ]
              }
            ]
          },
          ...
        ]
      }
    ]
  }
  */
  async getJobResult(jobId) {
    try {
      // get auth token to make authenticated requests
      const bearerToken = this.authService.getToken();
      const headers = {
        Accept: 'application/json',
      };
      if (bearerToken) {
        headers['Authorization'] = 'Bearer ' + bearerToken; // Note the appropriate header
      }

      /*
      returns
        
      */

      return await firstValueFrom(
        this.http.get(this.targetUrlToSpatialDataProcessorInstance + 'jobs/' + jobId + '/result', {
          headers: headers,
        })
      );
    } catch (error) {
      console.error('Error while fetching job result.', error);
      throw error;
    }
  }
}
