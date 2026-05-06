import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Observable, finalize } from "rxjs";
import { ExportTypSelectionComponent } from "../export-typ-selection/export-typ-selection.component";
import { ExportDatasetListComponent } from "../export-dataset-list/export-dataset-list.component";
import { EpsgSelectorComponent } from "../epsg-selector/epsg-selector.component";
import { ExportingStateService } from "../exporting-state.service";
import { ExpandableBoxComponent } from "../../../common/expandable-box/expandable-box.component";
import {
  DownloadFormat,
  ExportingService,
  ExportResponse,
  GeoressourceExportInput,
  IndicatorExportInput,
  MultipleExportIndicatorInput,
  MultipleExportParams,
  SingleExportParams,
  SpatialUnitExportParams,
  TargetTime,
} from "../../../../../services/exporting/exporting.service";
import { SelectedTargetTime } from "../models";

const FORMAT_MAP: Record<string, DownloadFormat | null> = {
  GeoPackage: "GEOPACKAGE",
  GeoJSON: "GEOJSON",
  CSV: "CSV",
  Excel: "EXCEL",
};

function mapFormats(formats: string[]): DownloadFormat[] {
  return formats
    .map((f) => FORMAT_MAP[f])
    .filter((f): f is DownloadFormat => f !== null);
}

function buildTargetTime(targetTime?: SelectedTargetTime): TargetTime {
  if (!targetTime) {
    return {
      mode: "ALL",
    };
  }
  if (typeof targetTime === "string") {
    return {
      mode: "SINGLE",
      start_date: targetTime,
      end_date: targetTime,
      include_dates: [targetTime],
    };
  }
  return {
    mode: "START_END",
    start_date: targetTime.start,
    end_date: targetTime.end,
    include_dates: [targetTime.start, targetTime.end],
  };
}

@Component({
  selector: "app-download-modal",
  templateUrl: "./download-modal.component.html",
  styleUrls: ["./download-modal.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    ExportTypSelectionComponent,
    ExportDatasetListComponent,
    ExpandableBoxComponent,
    EpsgSelectorComponent,
  ],
})
export class DownloadModalComponent {
  activeModal = inject(NgbActiveModal);
  isLoading = signal(false);

  isSingleExportValid = computed(() => {
    const hasValidIndicator = this.stateSrvc
      .indicatorItems()
      .some(
        (item) =>
          item.selectedSpatialUnits.length > 0 &&
          item.selectedFormats.length > 0,
      );
    const hasValidGeoressource = this.stateSrvc
      .georessourceItems()
      .some((item) => item.selectedFormats.length > 0);
    return hasValidIndicator || hasValidGeoressource;
  });

  isSpatialUnitExportValid = computed(() => {
    const hasSelectedSpatialUnit = this.stateSrvc.selectedSpatialUnit() !== null;
    const hasIndicatorWithFormat = this.stateSrvc
      .indicatorItems()
      .some((item) => item.selectedFormats.length > 0);
    return hasSelectedSpatialUnit && hasIndicatorWithFormat;
  });

  isMultipleExportValid = computed(() =>
    this.stateSrvc
      .indicatorItems()
      .some(
        (item) =>
          item.selectedFormats.length > 0 && item.selectedSpatialUnits.length > 0,
      ),
  );

  constructor(
    protected stateSrvc: ExportingStateService,
    protected exportSrvc: ExportingService,
  ) {}

  onEpsgCodeChange(code: number | null): void {
    this.stateSrvc.selectedEpsgCode.set(code);
  }

  startDownload(): void {
    const epsgCode = this.stateSrvc.selectedEpsgCode();
    if (!epsgCode) return;

    const crs = `EPSG:${epsgCode}`;
    const exportType = this.stateSrvc.exportType();

    let request$: Observable<any>;
    switch (exportType) {
      case "single":
        request$ = this.exportSrvc.executeSingleExport(
          this.buildSingleExportParams(crs),
        );
        break;
      case "spatialUnit":
        request$ = this.exportSrvc.executeSpatialUnitExport(
          this.buildSpatialUnitExportParams(crs),
        );
        break;
      case "multiple":
        request$ = this.exportSrvc.executeMultipleExport(
          this.buildMultipleExportParams(crs),
        );
        break;
    }

    this.isLoading.set(true);
    request$.pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (result: ExportResponse) => {
        if (result.status === "successful" && result.file?.href) {
          window.open(result.file.href, "_blank");
        }
      },
      error: (err) => {
        console.error("Export error", err);
      },
    });
  }

  private buildSingleExportParams(crs: string): SingleExportParams {
    const indicators: IndicatorExportInput[] = this.stateSrvc
      .indicatorItems()
      .filter((item) => item.selectedSpatialUnits.length > 0)
      .map((item) => ({
        indicator_id: item.dataset.id,
        spatial_unit_ids: item.selectedSpatialUnits,
        target_time: buildTargetTime(item.selectedTargetTime),
        download_format: mapFormats(item.selectedFormats),
      }));
    const georessources: GeoressourceExportInput[] = this.stateSrvc
      .georessourceItems()
      .map((item) => ({
        georessource_id: item.dataset.id,
        target_time: buildTargetTime(item.selectedTargetTime),
        download_format: mapFormats(item.selectedFormats),
      }));

    return { crs, indicators, georessources };
  }

  private buildSpatialUnitExportParams(crs: string): SpatialUnitExportParams {
    const spatialUnitId = this.stateSrvc.selectedSpatialUnit() ?? "";
    const allFormats = new Set<DownloadFormat>();
    const indicators = this.stateSrvc.indicatorItems().map((item) => {
      mapFormats(item.selectedFormats).forEach((f) => allFormats.add(f));
      return {
        indicator_id: item.dataset.id,
        target_time: buildTargetTime(item.selectedTargetTime),
      };
    });

    return {
      crs,
      spatial_unit_id: spatialUnitId,
      download_format: [...allFormats],
      indicators,
    };
  }

  private buildMultipleExportParams(crs: string): MultipleExportParams {
    const indicators: MultipleExportIndicatorInput[] = this.stateSrvc
      .indicatorItems()
      .map((item) => ({
        indicator_id: item.dataset.id,
        spatial_unit_ids: item.selectedSpatialUnits,
        target_time: buildTargetTime(item.selectedTargetTime),
      }));

    return { crs, indicators };
  }
}
