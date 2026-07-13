import { DownloadFormat, TargetTime } from 'services/exporting/exporting.service';
import { ExportFormat, SelectedTargetTime } from './models';

/** Maps the client-side export format labels to the backend download-format enum. */
export const FORMAT_MAP: Record<ExportFormat, DownloadFormat | null> = {
  GeoPackage: 'GEOPACKAGE',
  GeoJSON: 'GEOJSON',
  CSV: 'CSV',
  Excel: 'EXCEL',
};

export function mapFormats(formats: ExportFormat[]): DownloadFormat[] {
  return formats.map((f) => FORMAT_MAP[f]).filter((f): f is DownloadFormat => f !== null);
}

/** Builds the backend target-time payload from the UI selection. */
export function buildTargetTime(
  targetTime?: SelectedTargetTime,
  availableTimestamps: string[] = []
): TargetTime {
  if (!targetTime) {
    return { mode: 'ALL' };
  }
  if (targetTime.mode === 'point') {
    return {
      mode: 'SINGLE',
      start_date: targetTime.value,
      end_date: targetTime.value,
      include_dates: [targetTime.value],
    };
  }
  const includeDates = availableTimestamps.filter(
    (t) => t >= targetTime.start && t <= targetTime.end
  );
  return {
    mode: 'START_END',
    start_date: targetTime.start,
    end_date: targetTime.end,
    include_dates: includeDates.length > 0 ? includeDates : [targetTime.start, targetTime.end],
  };
}
