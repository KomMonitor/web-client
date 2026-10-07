// Pure, stateless helpers shared by indicator-add.component.ts and reporting-overview.component.ts.
// Both components build report pages from a `pages` array (indicator-add: reportingService.clonedTemplate.pages,
// reporting-overview: reportingService.workingTemplate.pages) with a "preview the first N pages, prepare the
// rest in the background" strategy. These functions used to be duplicated verbatim in both components.

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
