import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

export interface IndicatorJobHealth {
  activeJobs: number;
  delayedJobs: number;
  failedJobs: number;
  newestJobId: number;
  queueStatus: string;
  succeededJobs: number;
  waitingJobs: number;
}

export interface IndicatorJob {
  jobId: string;
  status: string;
  progress: number;
  logs: {
    message: string;
    type: string;
  }[];
  spatialUnitIntegrationSummary: string[];
  jobData: any;
}
@Injectable({
  providedIn: 'root',
})
export class AdminScriptExecutionService {
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);

  getDefaultIndicatorJobs() {
    const url = `${this.envConfigService.targetUrlToProcessingEngine}/script-engine/defaultIndicatorComputation`;
    return this.http.get<IndicatorJob[]>(url).pipe(timeout(5000));
  }

  getCustomizedIndicatorJobs() {
    const url = `${this.envConfigService.targetUrlToProcessingEngine}/script-engine/customizableIndicatorComputation`;
    return this.http.get<IndicatorJob[]>(url).pipe(timeout(5000));
  }

  getDefaultIndicatorJobHealth() {
    const url = `${this.envConfigService.targetUrlToProcessingEngine}/script-engine/defaultIndicatorComputation/health`;
    return this.http.get<IndicatorJobHealth>(url).pipe(timeout(5000));
  }

  getCustomizedIndicatorJobHealth() {
    const url = `${this.envConfigService.targetUrlToProcessingEngine}/script-engine/customizableIndicatorComputation/health`;
    return this.http.get<IndicatorJobHealth>(url).pipe(timeout(5000));
  }
}
