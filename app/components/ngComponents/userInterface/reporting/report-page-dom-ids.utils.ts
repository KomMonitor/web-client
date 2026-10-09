// Single source of truth for the report-page DOM element ids built ad-hoc throughout
// indicator-add.component.ts, reporting-overview.component.ts and report-page-preparation.service.ts.
// Pure string formulas only - no behavior change versus what each call site built inline before.
// The two components' HTML templates keep their own hardcoded id="..." interpolations (unchanged);
// they already produce the exact same strings as the functions below, so nothing needs to move
// across the TS/HTML boundary for them to stay in sync.

// indicator-add.component.ts family
export function indicatorAddPreviewPageId(idx: number): string {
  return 'reporting-addIndicator-page-' + idx;
}

export function indicatorAddPreviewPageElementId(
  idx: number,
  type: string,
  elementIdx?: number
): string {
  return (
    indicatorAddPreviewPageId(idx) + '-' + type + (elementIdx !== undefined ? '-' + elementIdx : '')
  );
}

export function indicatorAddBackgroundPageId(): string {
  return 'reporting-addIndicator-background-page';
}

export function indicatorAddBackgroundPageElementId(type: string, elementIdx: number): string {
  return indicatorAddBackgroundPageId() + '-' + type + '-' + elementIdx;
}

export function indicatorAddBackgroundLeafletContainerId(elementIdx: number): string {
  return 'reporting-addIndicator-background-leaflet-map-container-' + elementIdx;
}

// reporting-overview.component.ts family. NOTE: its background ids use a genuinely different
// literal prefix ('reporting-background-...', not 'reporting-overview-background-...') - existing
// behavior, not something this utility changes.
export function reportingOverviewPreviewPageId(idx: number): string {
  return 'reporting-overview-page-' + idx;
}

export function reportingOverviewPreviewPageElementId(
  idx: number,
  type: string,
  elementIdx?: number
): string {
  return (
    reportingOverviewPreviewPageId(idx) +
    '-' +
    type +
    (elementIdx !== undefined ? '-' + elementIdx : '')
  );
}

export function reportingOverviewBackgroundPageId(): string {
  return 'reporting-background-page';
}

export function reportingOverviewBackgroundPageElementId(type: string, elementIdx: number): string {
  return reportingOverviewBackgroundPageId() + '-' + type + '-' + elementIdx;
}

export function reportingOverviewBackgroundLeafletContainerId(elementIdx: number): string {
  return 'reporting-background-leaflet-map-container-' + elementIdx;
}
