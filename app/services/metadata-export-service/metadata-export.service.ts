import { Injectable, inject } from '@angular/core';
import { PdfExportService } from 'services/pdf-export-service/pdf-export.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';

/**
 * Metadata PDF/ZIP export delegations to PdfExportService (Prio 7 / B2 + B3).
 *
 * Reads the canonical metadata collections / selection it needs
 * (availableTopics, availableSpatialUnits, selectedIndicator) directly from the
 * owning stores, so callers no longer have to thread that state through.
 */
@Injectable({
  providedIn: 'root',
})
export class MetadataExportService {
  private pdfExportService = inject(PdfExportService);
  private topicStore = inject(TopicMetadataStoreService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private selectionState = inject(SelectionStateService);

  async downloadMetadataPDF_georesource(georesourceMetadata) {
    return this.pdfExportService.downloadMetadataPDF_georesource(
      georesourceMetadata,
      this.topicStore.availableTopics
    );
  }

  async createMetadataPDF_georesource(georesource, pdfName) {
    return this.pdfExportService.createMetadataPDF_georesource(
      georesource,
      pdfName,
      this.topicStore.availableTopics
    );
  }

  async createMetadataPDF_indicator(indicator) {
    return this.pdfExportService.createMetadataPDF_indicator(
      indicator,
      this.spatialUnitStore.availableSpatialUnits,
      this.topicStore.availableTopics
    );
  }

  getImageDimensions(file) {
    return this.pdfExportService['_getImageDimensions'](file);
  }

  getIndicatorStringFromIndicatorType(indicatorType) {
    return this.pdfExportService.getIndicatorStringFromIndicatorType(indicatorType);
  }

  tsToDate_withOptionalUpdateInterval(ts, updateIntervalApiName: any = undefined) {
    return this.pdfExportService.tsToDate_withOptionalUpdateInterval(ts, updateIntervalApiName);
  }

  dateToTS(date) {
    return this.pdfExportService.dateToTS(date);
  }

  async generateAndDownloadIndicatorZIP(indicatorData, fileName, fileEnding, jsZipOptions) {
    return this.pdfExportService.generateAndDownloadIndicatorZIP(
      indicatorData,
      fileName,
      fileEnding,
      jsZipOptions,
      this.selectionState.selectedIndicator,
      this.spatialUnitStore.availableSpatialUnits,
      this.topicStore.availableTopics
    );
  }

  async generateIndicatorMetadataPdf_asBlob() {
    return this.pdfExportService.generateIndicatorMetadataPdf_asBlob(
      this.selectionState.selectedIndicator,
      this.spatialUnitStore.availableSpatialUnits,
      this.topicStore.availableTopics
    );
  }

  async generateIndicatorMetadataPdf(indicatorMetadata, pdfName) {
    return this.pdfExportService.generateIndicatorMetadataPdf(
      indicatorMetadata,
      pdfName,
      this.spatialUnitStore.availableSpatialUnits,
      this.topicStore.availableTopics
    );
  }

  async generateAndDownloadGeoresourceZIP(
    georesourceMetadata,
    georesourceData,
    fileName,
    fileEnding,
    jsZipOptions
  ) {
    return this.pdfExportService.generateAndDownloadGeoresourceZIP(
      georesourceMetadata,
      georesourceData,
      fileName,
      fileEnding,
      jsZipOptions,
      this.topicStore.availableTopics
    );
  }

  async generateGeoresourceMetadataPdf_asBlob(georesourceMetadata) {
    return this.pdfExportService.generateGeoresourceMetadataPdf_asBlob(
      georesourceMetadata,
      this.topicStore.availableTopics
    );
  }
}
