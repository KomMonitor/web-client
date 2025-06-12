import { ajskommonitorSpatialDataProcessorHelperServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpatialDataProcessorHelperService {

  pipedData:any;

  constructor(
    @Inject('kommonitorSpatialDataProcessorHelperService') private ajskommonitorSpatialDataProcessorHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) { 
    this.pipedData = this.ajskommonitorSpatialDataProcessorHelperServiceProvider;
  }

  async getJobStatus(jobId) {
    return await this.ajskommonitorSpatialDataProcessorHelperServiceProvider.getJobStatus(jobId);
  }

  async getJobResult(jobId) {
    return await this.ajskommonitorSpatialDataProcessorHelperServiceProvider.getJobResult(jobId);
  }

  async postNewIsochroneStatistic(indicatorIdArray, isochroneGeoJson, spatialUnitId, targetDate, weight) {
    return await this.ajskommonitorSpatialDataProcessorHelperServiceProvider.postNewIsochroneStatistic(indicatorIdArray, isochroneGeoJson, spatialUnitId, targetDate, weight);
  }
}
