import { Injectable } from '@angular/core';

/**
 * Holds the visibility flags for the diagram and georesource export buttons,
 * shared between the chart components/helpers and the georesource panels.
 * Extracted from DataExchangeService (Prio 7 god-service split, B-Rest cluster
 * "export buttons").
 */
@Injectable({
  providedIn: 'root',
})
export class ExportButtonVisibilityService {
  showDiagramExportButtons = true;
  showGeoresourceExportButtons = true;
}
