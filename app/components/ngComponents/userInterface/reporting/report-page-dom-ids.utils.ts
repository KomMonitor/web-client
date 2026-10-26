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

// Keyed by pageIdx too, not just elementIdx: multiple pages commonly share the same elementIdx
// (map is usually each page's first/only element of that type) - without pageIdx, generating
// page N+1 would look up and remove page N's still-visible live Leaflet map (same id, global
// document.getElementById lookup), making it vanish from the preview a moment after it rendered.
export function indicatorAddBackgroundLeafletContainerId(
  pageIdx: number,
  elementIdx: number
): string {
  return 'reporting-addIndicator-background-leaflet-map-container-' + pageIdx + '-' + elementIdx;
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

// Keyed by pageIdx too - see indicatorAddBackgroundLeafletContainerId's comment, same reasoning.
export function reportingOverviewBackgroundLeafletContainerId(
  pageIdx: number,
  elementIdx: number
): string {
  return 'reporting-background-leaflet-map-container-' + pageIdx + '-' + elementIdx;
}
