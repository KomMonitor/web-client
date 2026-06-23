import { Injectable, inject } from '@angular/core';
import { PdfExportService } from 'services/pdf-export-service/pdf-export.service';

/**
 * Metadata PDF/ZIP export delegations extracted from DataExchangeService
 * (Prio 7 / B2 — see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * Thin pass-throughs to PdfExportService. Deliberately stateless: the metadata
 * collections / selection (availableTopics, availableSpatialUnits, selectedIndicator)
 * are passed in by the DataExchangeService facade, so this service holds no shared state.
 */
@Injectable({
  providedIn: 'root',
})
export class MetadataExportService {
  private pdfExportService = inject(PdfExportService);

  async downloadMetadataPDF_georesource(georesourceMetadata, availableTopics) {
    return this.pdfExportService.downloadMetadataPDF_georesource(
      georesourceMetadata,
      availableTopics
    );
  }

  async createMetadataPDF_georesource(georesource, pdfName, availableTopics) {
    return this.pdfExportService.createMetadataPDF_georesource(
      georesource,
      pdfName,
      availableTopics
    );
  }

  async createMetadataPDF_indicator(indicator, availableSpatialUnits, availableTopics) {
    return this.pdfExportService.createMetadataPDF_indicator(
      indicator,
      availableSpatialUnits,
      availableTopics
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

  async generateAndDownloadIndicatorZIP(
    indicatorData,
    fileName,
    fileEnding,
    jsZipOptions,
    selectedIndicator,
    availableSpatialUnits,
    availableTopics
  ) {
    return this.pdfExportService.generateAndDownloadIndicatorZIP(
      indicatorData,
      fileName,
      fileEnding,
      jsZipOptions,
      selectedIndicator,
      availableSpatialUnits,
      availableTopics
    );
  }

  async generateIndicatorMetadataPdf_asBlob(
    selectedIndicator,
    availableSpatialUnits,
    availableTopics
  ) {
    return this.pdfExportService.generateIndicatorMetadataPdf_asBlob(
      selectedIndicator,
      availableSpatialUnits,
      availableTopics
    );
  }

  async generateIndicatorMetadataPdf(
    indicatorMetadata,
    pdfName,
    availableSpatialUnits,
    availableTopics
  ) {
    return this.pdfExportService.generateIndicatorMetadataPdf(
      indicatorMetadata,
      pdfName,
      availableSpatialUnits,
      availableTopics
    );
  }

  async generateAndDownloadGeoresourceZIP(
    georesourceMetadata,
    georesourceData,
    fileName,
    fileEnding,
    jsZipOptions,
    availableTopics
  ) {
    return this.pdfExportService.generateAndDownloadGeoresourceZIP(
      georesourceMetadata,
      georesourceData,
      fileName,
      fileEnding,
      jsZipOptions,
      availableTopics
    );
  }

  async generateGeoresourceMetadataPdf_asBlob(georesourceMetadata, availableTopics) {
    return this.pdfExportService.generateGeoresourceMetadataPdf_asBlob(
      georesourceMetadata,
      availableTopics
    );
  }
}
