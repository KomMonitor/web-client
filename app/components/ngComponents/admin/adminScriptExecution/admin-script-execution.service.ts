import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { timeout } from "rxjs";

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
  providedIn: "root",
})
export class AdminScriptExecutionService {
  // TODO: remove use of __env
  private processEngineBaseUrl: string =
    window.__env.targetUrlToProcessingEngine;

  constructor(private http: HttpClient) {}

  getDefaultIndicatorJobs() {
    const url = `${this.processEngineBaseUrl}/script-engine/defaultIndicatorComputation`;
    return this.http.get<IndicatorJob[]>(url).pipe(timeout(5000));
  }

  getCustomizedIndicatorJobs() {
    const url = `${this.processEngineBaseUrl}/script-engine/customizableIndicatorComputation`;
    return this.http.get<IndicatorJob[]>(url).pipe(timeout(5000));
  }

  getDefaultIndicatorJobHealth() {
    const url = `${this.processEngineBaseUrl}/script-engine/defaultIndicatorComputation/health`;
    return this.http.get<IndicatorJobHealth>(url).pipe(timeout(5000));
  }

  getCustomizedIndicatorJobHealth() {
    const url = `${this.processEngineBaseUrl}/script-engine/customizableIndicatorComputation/health`;
    return this.http.get<IndicatorJobHealth>(url).pipe(timeout(5000));
  }
}
