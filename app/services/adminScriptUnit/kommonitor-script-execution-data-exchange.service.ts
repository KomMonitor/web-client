import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ScriptExecutionJobHealth {
  queueStatus?: string;
  newestJobId?: number;
  succeededJobs?: number;
  failedJobs?: number;
  activeJobs?: number;
  waitingJobs?: number;
  delayedJobs?: number;
}

@Injectable({ providedIn: 'root' })
export class KommonitorScriptExecutionDataExchangeService {

  private readonly baseProcessingUrl: string = (window as any)?.__env?.targetUrlToProcessingEngine || '';

  constructor(private http: HttpClient) {}

  fetchDefaultIndicatorJobs(): Observable<any[]> {
    const url = this.baseProcessingUrl + 'script-engine/defaultIndicatorComputation';
    return this.safeGet<any[]>(url, []);
  }

  fetchCustomizedIndicatorJobs(): Observable<any[]> {
    const url = this.baseProcessingUrl + 'script-engine/customizableIndicatorComputation';
    return this.safeGet<any[]>(url, []);
  }

  fetchDefaultIndicatorJobHealth(): Observable<ScriptExecutionJobHealth> {
    const url = this.baseProcessingUrl + 'script-engine/defaultIndicatorComputation/health';
    return this.safeGet<ScriptExecutionJobHealth>(url, {} as ScriptExecutionJobHealth);
  }

  fetchCustomizedIndicatorJobHealth(): Observable<ScriptExecutionJobHealth> {
    const url = this.baseProcessingUrl + 'script-engine/customizableIndicatorComputation/health';
    return this.safeGet<ScriptExecutionJobHealth>(url, {} as ScriptExecutionJobHealth);
  }

  private safeGet<T>(url: string, fallback: T): Observable<T> {
    return this.http.get<T>(url).pipe(
      map(resp => resp as T),
      catchError(_ => of(fallback))
    );
  }
}


