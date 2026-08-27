import { Injectable } from '@angular/core';

/**
 * Holds the visibility flags for the diagram and georesource export buttons,
 * shared between the chart components/helpers and the georesource panels.
 * Extracted in the Prio 7 god-service split
 * (see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 */
@Injectable({
  providedIn: 'root',
})
export class ExportButtonVisibilityService {
  showDiagramExportButtons = true;
  showGeoresourceExportButtons = true;
}
