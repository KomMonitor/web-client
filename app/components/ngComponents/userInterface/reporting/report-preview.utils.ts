// Pure, stateless helpers shared by indicator-add.component.ts and reporting-overview.component.ts.
// Both components build report pages from a `pages` array (indicator-add: reportingService.clonedTemplate.pages,
// reporting-overview: reportingService.workingTemplate.pages) with a "preview the first N pages, prepare the
// rest in the background" strategy. These functions used to be duplicated verbatim in both components.
// Also includes stat/average computation helpers used while building bar-chart report pages.

import { isQualitativeMapping } from 'components/ngComponents/models/classification.models';

export function isPageInPreview(
  pages: any[],
  page: any,
  maxPreviewAreaSpecificPages: number,
  maxPreviewDatatablePages: number
): boolean {
  if (page.type !== 'area_specific' && page.type !== 'datatable') return true;
  if (page.type === 'area_specific') {
    const areaPages = pages.filter((p: any) => p.type === 'area_specific');
    return areaPages.indexOf(page) < maxPreviewAreaSpecificPages;
  }
  if (page.type === 'datatable') {
    const dtPages = pages.filter((p: any) => p.type === 'datatable');
    return dtPages.indexOf(page) < maxPreviewDatatablePages;
  }
  return true;
}

export function isLastPreviewPage(
  pages: any[],
  page: any,
  maxPreviewAreaSpecificPages: number,
  maxPreviewDatatablePages: number
): boolean {
  if (page.type === 'area_specific') {
    const areaPages = pages.filter((p: any) => p.type === 'area_specific');
    return areaPages.indexOf(page) === maxPreviewAreaSpecificPages - 1;
  }
  if (page.type === 'datatable') {
    const dtPages = pages.filter((p: any) => p.type === 'datatable');
    return dtPages.indexOf(page) === maxPreviewDatatablePages - 1;
  }
  return false;
}

export function countBackgroundPages(
  pages: any[],
  page: any,
  maxPreviewAreaSpecificPages: number,
  maxPreviewDatatablePages: number
): number {
  if (!pages || !page) return 0;
  if (page.type === 'area_specific') {
    const areaPages = pages.filter((p: any) => p.type === 'area_specific');
    return Math.max(0, areaPages.length - maxPreviewAreaSpecificPages);
  }
  if (page.type === 'datatable') {
    const dtPages = pages.filter((p: any) => p.type === 'datatable');
    return Math.max(0, dtPages.length - maxPreviewDatatablePages);
  }
  return 0;
}

export function createDatatableSkeleton(colNamesArr: string[]): HTMLTableElement {
  const table = document.createElement('table');
  table.classList.add('table-striped');
  table.classList.add('table-bordered');
  table.classList.add('table-position');

  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);

  const headerRow = document.createElement('tr');

  for (const colName of colNamesArr) {
    const col = document.createElement('th');
    col.classList.add('text-center');
    col.innerText = colName;
    headerRow.appendChild(col);
  }

  headerRow.style.height = '25px';
  thead.appendChild(headerRow);

  return table;
}

// Renders a datatable page element from already-computed `pageElement.tableData`/`.columnNames`.
// Only used by reporting-overview.component.ts - indicator-add's equivalent
// (ReportPagePreparationService.createDatatablePageForIndicatorAdd) also computes the row data
// itself and splices continuation pages into the template, so it isn't a pure renderer like this one.
export function createDatatablePage(pElementDom: any, pageElement: any): void {
  pElementDom.innerHTML = '';
  pElementDom.style.border = 'none'; // hide dotted border from outer dom element
  pElementDom.style.justifyContent = 'flex-start'; // align table at top instead of center
  // add data
  const table = createDatatableSkeleton(pageElement.columnNames);
  const tbody: any = table.querySelector('tbody');
  // tabledata is a nested array with one sub-array per row
  for (const row of pageElement.tableData) {
    const tr = document.createElement('tr');
    tr.style.height = '25px';
    for (let i = 0; i < row.length; i++) {
      const td = document.createElement('td');
      td.innerText = row[i];
      // get corresponding column name for styling
      const colName = pageElement.columnNames[i];
      if (colName === 'Bereich') {
        td.classList.add('text-left');
      }
      if (colName === 'Wert') {
        td.classList.add('text-right');
      }

      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  pElementDom.appendChild(table);
}

// `pageConfig` is resolved differently by each caller: indicator-add reads its own component-level
// `pageConfig` (configuring the one section currently being added), reporting-overview reads the
// already-attached `page.templateSection.pageConfig` (a section added earlier). Both pass the
// resolved object in here; a missing one (e.g. reporting-overview before a page has its section
// attached) defaults to visible.
export function checkVisibility(pageElement: any, page: any, pageConfig: any): boolean {
  if (!pageConfig) {
    return true;
  }

  switch (pageElement.type) {
    case 'indicatorTitle-landscape':
    case 'indicatorTitle-portrait': {
      return pageConfig.headerFooterControl.showTitle;
    }
    case 'communeLogo-landscape':
    case 'communeLogo-portrait': {
      return pageConfig.headerFooterControl.showLogo;
    }
    case 'dataTimestamp-landscape':
    case 'dataTimestamp-portrait': {
      return pageConfig.headerFooterControl.showSubtitle;
    }
    case 'dataTimeseries-landscape':
    case 'dataTimeseries-portrait': {
      return pageConfig.headerFooterControl.showSubtitle;
    }
    case 'reachability-subtitle-landscape':
    case 'reachability-subtitle-portrait': {
      return pageConfig.headerFooterControl.showSubtitle;
    }
    case 'footerHorizontalSpacer-landscape':
    case 'footerHorizontalSpacer-portrait': {
      return pageConfig.headerFooterControl.showFooterCreationInfo;
    }
    case 'footerCreationInfo-landscape':
    case 'footerCreationInfo-portrait': {
      return pageConfig.headerFooterControl.showFooterCreationInfo;
    }
    case 'pageNumber-landscape':
    case 'pageNumber-portrait': {
      return pageConfig.headerFooterControl.showPageNumber;
    }
    // template-specific elements
    case 'map': {
      return true;
    }
    // case "mapLegend" can be ignored since it is included in the map if needed
    case 'barchart': {
      if (page.type == 'area_specific') {
        return pageConfig.sectionContentControl.showRankingChartPerArea;
      }
      return true;
    }
    case 'linechart': {
      if (page.type == 'area_specific') {
        return pageConfig.sectionContentControl.showLineChartPerArea;
      }
      return true;
    }
    case 'textInput': {
      return pageConfig.sectionContentControl.showFreeText;
    }
    case 'datatable': {
      return pageConfig.sectionControl.showDatatable;
    }
    default: {
      return true;
    }
  }
}

export function createLowerCaseNameProperty(features: any[]): any[] {
  for (const feature of features) {
    if (Object.prototype.hasOwnProperty.call(feature, 'properties')) {
      if (!Object.prototype.hasOwnProperty.call(feature.properties, 'name')) {
        const featureName = feature.properties.NAME;
        feature.properties.name = featureName;
      }
    }
  }
  return features;
}

export function calculateSeriesDataForTimeseries(features: any[], timeseries: any): any[] {
  const result: any[] = [];
  const mostRecentDate = timeseries.to;
  const oldestDate = timeseries.from;

  for (const feature of features) {
    const obj: any = {};
    obj.name = feature.properties.name;
    let value =
      feature.properties['DATE_' + mostRecentDate] - feature.properties['DATE_' + oldestDate];
    if (typeof value == 'number') {
      value = Math.round(value * 100) / 100;
    }
    obj.value = value;

    result.push(obj);
  }
  return result;
}

export function calculateAvg(
  indicator: any,
  timestamp: any,
  calcForSelection: boolean,
  selectedAreas: any[]
): number | null {
  // categorical values have no numeric average - callers must not display this as a value
  if (isQualitativeMapping(indicator?.defaultClassificationMapping)) {
    return null;
  }

  // calculate avg from geoJSON property, which should be the currently selected spatial unit
  let features = indicator.geoJSON.features;
  if (calcForSelection) {
    features = features.filter((el) => {
      return selectedAreas.map((area: any) => area.name).includes(el.properties.NAME);
    });
  }

  const data = features.map((feature) => {
    return feature.properties['DATE_' + timestamp];
  });

  let noDataCounter = 0;
  let sum = 0;
  for (const value of data) {
    if (typeof value === 'number' && !isNaN(value)) {
      sum += value;
    } else {
      noDataCounter++;
    }
  }

  let avg = sum / (data.length - noDataCounter);
  avg = Math.round(avg * 100) / 100; // 2 decimal places
  return avg;
}
