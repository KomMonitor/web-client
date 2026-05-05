import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { EnvConfigService } from "services/env-config-service/env-config.service";

export type TargetTimeMode = "START_END" | "INCLUDE_DATES";
export type DownloadFormat = "GEOPACKAGE" | "GEOJSON" | "EXCEL" | "CSV";

export interface TargetTime {
  mode: TargetTimeMode;
  include_dates?: string[];
  start_date?: string;
  end_date?: string;
}

export interface IndicatorExportInput {
  indicator_id: string;
  spatial_unit_ids: string[];
  target_time: TargetTime;
  download_format: DownloadFormat[];
}

export interface GeoresourceExportInput {
  georessource_id: string;
  target_time: TargetTime;
  download_format: DownloadFormat[];
}

export interface SingleExportParams {
  crs: string;
  indicators?: IndicatorExportInput[];
  georessources?: GeoresourceExportInput[];
}

export interface SpatialUnitIndicatorInput {
  indicator_id: string;
  target_time: TargetTime;
}

export interface SpatialUnitExportParams {
  crs: string;
  spatial_unit_id: string;
  download_format: DownloadFormat[];
  indicators: SpatialUnitIndicatorInput[];
}

export interface MultipleExportIndicatorInput {
  indicator_id: string;
  spatial_unit_ids: string[];
  target_time: TargetTime;
}

export interface MultipleExportParams {
  crs: string;
  indicators: MultipleExportIndicatorInput[];
}

export interface ExportFileLink {
  href: string;
  rel: string;
  type: string;
  title: string;
}

export interface ExportResponse {
  status: string;
  file: ExportFileLink;
  userId: string;
}

@Injectable({
  providedIn: "root",
})
export class ExportingService {
  private readonly SINGLE_EXPORT_PATH = "processes/SingleExport/execution";
  private readonly SPATIAL_UNIT_EXPORT_PATH =
    "processes/SpatialUnitExport/execution";
  private readonly MULTIPLE_EXPORT_PATH = "processes/MultipleExport/execution";

  // TODO: get from config
  private readonly url = "https://demo.kommonitor.de.52north.org/processes-api/";

  constructor(
    private http: HttpClient,
    private envConfigService: EnvConfigService,
  ) {}

  executeSingleExport(params: SingleExportParams): Observable<ExportResponse> {
    console.log(params);
    const url = `${this.url}${this.SINGLE_EXPORT_PATH}`;
    const body = {
      inputs: {
        single_export: {
          value: params,
        },
      },
    };
    const headers = new HttpHeaders({ "Content-Type": "application/json" });
    return this.http.post<ExportResponse>(url, body, { headers });
  }

  executeSpatialUnitExport(params: SpatialUnitExportParams): Observable<ExportResponse> {
    const url = `${this.envConfigService.targetUrlToProcessingEngine}${this.SPATIAL_UNIT_EXPORT_PATH}`;
    const body = {
      inputs: {
        spatial_unit: {
          value: params,
        },
      },
    };
    const headers = new HttpHeaders({ "Content-Type": "application/json" });
    return this.http.post<ExportResponse>(url, body, { headers });
  }

  executeMultipleExport(params: MultipleExportParams): Observable<ExportResponse> {
    const url = `${this.envConfigService.targetUrlToProcessingEngine}${this.MULTIPLE_EXPORT_PATH}`;
    const body = {
      inputs: {
        multiple_export: {
          value: params,
        },
      },
    };
    const headers = new HttpHeaders({ "Content-Type": "application/json" });
    return this.http.post<ExportResponse>(url, body, { headers });
  }
}
