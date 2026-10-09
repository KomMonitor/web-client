import { Injectable, inject } from '@angular/core';
import * as L from 'leaflet';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { LeafletScreenshotCacheHelperService } from 'services/leaflet-screenshot-cache-helper-service/leaflet-screenshot-cache-helper.service';
import { ReportingService } from 'services/reporting-service/reporting.service';
import { ReportGenerationContext } from 'components/ngComponents/userInterface/reporting/report-generation-context.model';
import {
  calculateAvg,
  createDatatableSkeleton,
} from 'components/ngComponents/userInterface/reporting/report-preview.utils';
import {
  indicatorAddBackgroundLeafletContainerId,
  indicatorAddBackgroundPageElementId,
  indicatorAddBackgroundPageId,
  indicatorAddPreviewPageId,
  reportingOverviewBackgroundLeafletContainerId,
  reportingOverviewBackgroundPageElementId,
  reportingOverviewBackgroundPageId,
  reportingOverviewPreviewPageId,
} from 'components/ngComponents/userInterface/reporting/report-page-dom-ids.utils';

// Phase C3 (slice 1) of the reporting-preview dedup: relocates indicator-add's report-page
// preparation methods here one at a time, rewired to read from ReportGenerationContext instead
// of component state. Methods are moved verbatim (this.X -> context.X / injected-service only) -
// no behavior reconciliation with reporting-overview.component.ts's equivalents, which have
// genuine behavioral divergences (cache short-circuit, dataUrl validation, timeout handling etc.
// differ between the two). See the reporting-preview-dedup plan/memory for the full picture.
@Injectable({
  providedIn: 'root',
})
export class ReportPagePreparationService {
  private reportingService = inject(ReportingService);
  private diagramHelperService = inject(DiagramHelperServiceService);
  private leafletScreenshotCacheHelperService = inject(LeafletScreenshotCacheHelperService);
  private envConfigService = inject(EnvConfigService);

  private reportingReachabilityMapAttribution;

  private async getReportingRechabilityMapAttribution() {
    if (!this.reportingReachabilityMapAttribution) {
      this.reportingReachabilityMapAttribution =
        await this.diagramHelperService.createReportingReachabilityMapAttribution();
    }

    return this.reportingReachabilityMapAttribution;
  }

  async prepareLeafletMapForIndicatorAdd(
    page,
    pageElement,
    elementIdx: number,
    map,
    isPreview: boolean | undefined,
    context: ReportGenerationContext
  ): Promise<string | undefined> {
    const pageIdx: any = context.pages.indexOf(page);
    const id = indicatorAddBackgroundLeafletContainerId(pageIdx, elementIdx);

    // For preview pages use the visible page DOM so Leaflet can load tiles reliably.
    // For background-only pages use the off-screen background processor.
    const pageDomId = isPreview
      ? indicatorAddPreviewPageId(pageIdx)
      : indicatorAddBackgroundPageId();
    // pageElementDom is always in the background processor - attribution/legend appended here
    // get moved to previewEl together with the ECharts canvas by preparePageForIndicatorAdd
    const pageElementDomId = indicatorAddBackgroundPageElementId('map', elementIdx);

    let pageDom: any = document.getElementById(pageDomId);
    let pageElementDom: any = document.getElementById(pageElementDomId);

    if (!pageDom) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      pageDom = document.getElementById(pageDomId);
      pageElementDom = document.getElementById(pageElementDomId);
    }

    if (!pageDom) {
      console.error('Could not find background DOM for leaflet map init: ' + pageDomId);
      return undefined;
    }

    const oldMapNode: any = document.getElementById(id);
    if (oldMapNode) oldMapNode.remove();

    const div: any = document.createElement('div');
    div.id = id;
    div.style.position = 'absolute';
    div.style.left = pageElement.dimensions.left;
    div.style.top = pageElement.dimensions.top;
    div.style.width = pageElement.dimensions.width;
    div.style.height = pageElement.dimensions.height;
    div.style.zIndex = 10;
    div.style.backgroundColor = 'white';
    pageDom.appendChild(div);
    const echartsOptions = map.getOption();

    const leafletMap = L.map(div.id, {
      zoomControl: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      trackResize: false,
      attributionControl: false,
      // prevents leaflet form snapping to closest pre-defined zoom level.
      // In other words, it allows us to set exact map extend by a (echarts) bounding box
      zoomSnap: 0,
      // disable any fade and zoom animation in order to get screenshots directly after layer event load was called
      fadeAnimation: false,
      zoomAnimation: false,
    });
    // Leaflet caches the container size at construction time; force it to re-measure
    // now (after our explicit width/height are applied) so fitBounds() below computes
    // against the real size instead of a stale/zero one - otherwise only the fraction
    // of the container Leaflet thinks is visible gets tiles (classic top-left-only bug).
    leafletMap.invalidateSize(false);
    // manually create a field for attribution so we can control the z-index.
    const prevAttributionDiv = pageDom.querySelector('.map-attribution');
    if (prevAttributionDiv) prevAttributionDiv.remove();
    const attrDiv: any = document.createElement('div');
    attrDiv.classList.add('map-attribution');
    attrDiv.style.position = 'absolute';
    attrDiv.style.bottom = 0;
    attrDiv.style.left = 0;
    attrDiv.style.zIndex = 800;
    const attrImg = await this.getReportingRechabilityMapAttribution();
    attrDiv.appendChild(attrImg);
    pageElementDom.appendChild(attrDiv);

    if (this.reportingService.clonedTemplate.name.includes('reachability')) {
      // also create the reachability specific legend manually
      const prevLegendDiv = pageDom.querySelector('.map-legend');
      if (prevLegendDiv) prevLegendDiv.remove();
      const legendDiv: any = document.createElement('div');
      legendDiv.classList.add('map-legend');
      legendDiv.style.position = 'absolute';
      legendDiv.style.bottom = 0;
      legendDiv.style.right = 0;
      legendDiv.style.zIndex = 800;
      const legendImg = await this.diagramHelperService.createReportingReachabilityMapLegend(
        echartsOptions,
        context.selectedSpatialUnit,
        context.isochronesRangeType,
        context.isochronesRangeUnits
      );
      legendDiv.appendChild(legendImg);
      pageElementDom.appendChild(legendDiv);
    }

    // echarts uses [lon, lat], leaflet uses [lat, lon]
    let boundingCoords = echartsOptions.series[0].boundingCoords;
    const westLon = boundingCoords[0][0];
    const southLat = boundingCoords[1][1];
    const eastLon = boundingCoords[1][0];
    const northLat = boundingCoords[0][1];

    if (page.area && page.area.length) {
      const feature = context.geoJsonForReachability_byFeatureName!.get(page.area);
      page.spatialUnitFeatureId =
        feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME];
    }

    leafletMap.fitBounds([
      [southLat, westLon],
      [northLat, eastLon],
    ]);
    const bounds = leafletMap.getBounds();

    /*
      as we might have landscape and portrait versions of the same content
      leaflet fitBounds() will not work properly, if the leaflet map is actually not included in the DOM currently

      --> hence we make a workaround. if the leaflet coords of northeast and southwest are exactly the same
      then we just ignore it and instead reuse the original echarts coordinates --> they are proper at the beginning of the function

      */

    if (bounds.getWest() == bounds.getEast() && bounds.getNorth() == bounds.getSouth()) {
      // this is only the case, if leaflet.fitBounds() results in a single coordinate (due to map HTML element not within DOM)
      // hence, simply use current echarts extent
    } else {
      // normal case, leaflet has properly rendered and zoomed to the given extent
      // thus we use the leaflet coords in order to adjust the echarts extent for proper overlay
      boundingCoords = [
        [bounds.getWest(), bounds.getNorth()],
        [bounds.getEast(), bounds.getSouth()],
      ];
    }

    for (const series of echartsOptions.series) {
      series.left = 0;
      series.top = 0;
      series.right = 0;
      series.bottom = 0;
      series.boundingCoords = boundingCoords;
      series.projection = {
        project: (point) => context.mercatorProjection_d3(point),
        unproject: (point) => context.mercatorProjection_d3.invert(point),
      };
    }

    echartsOptions.geo[0].top = 0;
    echartsOptions.geo[0].left = 0;
    echartsOptions.geo[0].right = 0;
    echartsOptions.geo[0].bottom = 0;
    echartsOptions.geo[0].projection = {
      project: (point) => context.mercatorProjection_d3(point),
      unproject: (point) => context.mercatorProjection_d3.invert(point),
    };
    echartsOptions.geo[0].boundingCoords = boundingCoords;

    // due to strange leaflet screenshot issues with multiple echarts series, only pass the first series during screenshot
    // and restore all series after the screenshot is taken
    const firstSeries_array = [echartsOptions.series[0]];
    const allSeries_array = echartsOptions.series;

    echartsOptions.series = firstSeries_array;
    map.setOption(echartsOptions, {
      notMerge: false,
    });

    let leafletLayer: any;
    if (context.selectedBaseMap.layerConfig.layerType === 'TILE_LAYER_GRAYSCALE') {
      leafletLayer = new L.tileLayer(context.selectedBaseMap.layerConfig.url);
    } else if (context.selectedBaseMap.layerConfig.layerType === 'TILE_LAYER') {
      leafletLayer = new L.tileLayer(context.selectedBaseMap.layerConfig.url);
    } else if (context.selectedBaseMap.layerConfig.layerType === 'WMS') {
      leafletLayer = new L.tileLayer.wms(context.selectedBaseMap.layerConfig.url, {
        layers: context.selectedBaseMap.layerConfig.layerName_WMS,
        format: 'image/jpeg',
      });
    }

    const domNode = leafletMap['_container'];

    pageElement.selectedBaseMap = context.selectedBaseMap;
    pageElement.leafletMap = leafletMap;
    pageElement.leafletBbox = bounds;
    pageElement.echartsOptions = echartsOptions;

    const screenshotPromise = new Promise<string | undefined>((resolve) => {
      const timeoutHandle = setTimeout(() => {
        console.warn(
          'Leaflet tile load timed out for page ' + pageIdx + ', proceeding without screenshot'
        );
        resolve(undefined);
      }, 15000);
      leafletLayer.on('load', async () => {
        clearTimeout(timeoutHandle);
        if (page.orientation === this.reportingService.clonedTemplate.orientation) {
          await new Promise((r) => setTimeout(r, 500));
          const dataUrl = await this.leafletScreenshotCacheHelperService.checkForScreenshot(
            context.selectedBaseMap.layerConfig.name,
            context.selectedSpatialUnit.spatialUnitId,
            page.spatialUnitFeatureId,
            page.orientation,
            domNode,
            this.reportingService.clonedTemplate.name
          );
          resolve(dataUrl);
        } else {
          resolve(undefined);
        }
      });
    });

    // give the browser a beat to settle layout before Leaflet measures the container;
    // only then add the tile layer, so its tile grid is computed against the real size
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        leafletMap.invalidateSize(false);
        resolve();
      }, 100);
    });
    leafletLayer.addTo(leafletMap);

    const dataUrl = await screenshotPromise;

    if (!isPreview) {
      leafletMap.remove();
      div.remove();
    }

    // restore all series now that screenshot is done
    echartsOptions.series = allSeries_array;
    map.setOption(echartsOptions, { notMerge: false });

    return dataUrl;
  }

  // Duplicated from reporting-overview.component.ts's own getFeatureLookupKey (kept there too -
  // it's also used by two other component methods not moved here). Relocate-only, not deduped.
  private getFeatureLookupKey(templateSection) {
    return templateSection.indicatorId
      ? templateSection.indicatorId + '_' + templateSection.spatialUnitName
      : templateSection.poiLayerName + '_' + templateSection.spatialUnitName;
  }

  async prepareLeafletMapForOverview(
    page,
    pageElement,
    elementIdx: number,
    echartsMap,
    spatialUnit,
    forceScreenshot,
    isVisible,
    isPreview: boolean | undefined,
    context: ReportGenerationContext
  ) {
    // declared outside the try block so the finally clause can always clean them up -
    // for preview pages this map is built directly inside the visible page DOM, so leaving
    // it behind on an early return/exception would show a stuck, partially-loaded live map
    let leafletMap: any;
    let div: any;
    try {
      const pageIdx = context.pages.indexOf(page);

      // store spatial unit and feature id before cache check
      page.spatialUnitId = spatialUnit.spatialUnitId;
      if (page.area) {
        const cacheKey = this.getFeatureLookupKey(page.templateSection);
        let featureMap = context.featureLookupCache!.get(cacheKey);
        if (!featureMap) featureMap = context.geoJsonForReachability_byFeatureName;
        const feature = featureMap.get(page.area);
        if (feature) {
          page.spatialUnitFeatureId =
            feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME];
        }
      }
      // "overview" (no-area) pages have no feature to key off - without a fallback here every
      // such page across the whole report shares one screenshot cache key/pending-promise slot
      // (same base map + spatial unit + undefined featureId), so the second one to request a
      // screenshot gets the first one's in-flight promise instead of capturing its own map.
      if (!page.spatialUnitFeatureId) {
        page.spatialUnitFeatureId = 'overview-page-' + pageIdx;
      }

      // check cache before creating leaflet map
      const cachedScreenshot = this.leafletScreenshotCacheHelperService.getResourceFromCache(
        pageElement.selectedBaseMap.layerConfig.name,
        page.spatialUnitId,
        page.spatialUnitFeatureId,
        page.orientation,
        this.reportingService.workingTemplate.name
      );
      if (cachedScreenshot) {
        return await this.leafletScreenshotCacheHelperService.checkForScreenshot(
          pageElement.selectedBaseMap.layerConfig.name,
          spatialUnit.spatialUnitId,
          page.spatialUnitFeatureId,
          page.orientation,
          null,
          this.reportingService.workingTemplate.name
        );
      }

      const id = reportingOverviewBackgroundLeafletContainerId(pageIdx, elementIdx);
      // Leaflet does not reliably load tiles while off-screen (opacity: 0 / far off-canvas
      // position) - for preview pages, build the map inside the visible page DOM instead,
      // same workaround already used by indicator-add.component.ts's equivalent function.
      const pageDomId = isPreview
        ? reportingOverviewPreviewPageId(pageIdx)
        : reportingOverviewBackgroundPageId();
      let pageDom: any = document.getElementById(pageDomId);
      const pageElementDomId = reportingOverviewBackgroundPageElementId('map', elementIdx);
      let pageElementDom: any = document.getElementById(pageElementDomId);

      if (!pageDom) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        pageDom = document.getElementById(pageDomId);
        pageElementDom = document.getElementById(pageElementDomId);
      }

      if (!pageDom) {
        console.error('Could not find DOM for leaflet map init: ' + pageDomId);
        return undefined;
      }

      const oldMapNode = document.getElementById(id);
      if (oldMapNode) {
        oldMapNode.remove();
      }
      div = document.createElement('div');
      div.id = id;
      div.style.position = 'absolute';
      div.style.left = pageElement.dimensions.left;
      div.style.top = pageElement.dimensions.top;
      div.style.width = pageElement.dimensions.width;
      div.style.height = pageElement.dimensions.height;
      div.style.zIndex = 10;
      pageDom.appendChild(div);
      const echartsOptions = echartsMap.getOption();

      leafletMap = L.map(div.id, {
        zoomControl: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false,
        trackResize: false,
        attributionControl: false,
        zoomSnap: 0,
        fadeAnimation: false,
        zoomAnimation: false,
      });
      // Leaflet caches the container size at construction time; force it to re-measure
      // now (after our explicit width/height are applied) so fitBounds() below computes
      // against the real size instead of a stale/zero one - otherwise only the fraction
      // of the container Leaflet thinks is visible gets tiles (classic top-left-only bug).
      leafletMap.invalidateSize(false);

      // manually create attribution overlay with controlled z-index
      const prevAttributionDiv = pageDom.querySelector('.map-attribution');
      if (prevAttributionDiv) prevAttributionDiv.remove();
      const attrDiv: any = document.createElement('div');
      attrDiv.classList.add('map-attribution');
      attrDiv.style.position = 'absolute';
      attrDiv.style.bottom = 0;
      attrDiv.style.left = 0;
      attrDiv.style.zIndex = 800;
      const attrImg = await this.diagramHelperService.createReportingReachabilityMapAttribution();
      attrDiv.appendChild(attrImg);
      if (pageElementDom) pageElementDom.appendChild(attrDiv);

      if (this.reportingService.workingTemplate.name.includes('reachability')) {
        const prevLegendDiv = pageDom.querySelector('.map-legend');
        if (prevLegendDiv) prevLegendDiv.remove();
        const legendDiv: any = document.createElement('div');
        legendDiv.classList.add('map-legend');
        legendDiv.style.position = 'absolute';
        legendDiv.style.bottom = 0;
        legendDiv.style.right = 0;
        legendDiv.style.zIndex = 800;
        const isochronesRangeType = page.templateSection.isochronesRangeType;
        const isochronesRangeUnits = page.templateSection.isochronesRangeUnits;
        const legendImg = await this.diagramHelperService.createReportingReachabilityMapLegend(
          echartsOptions,
          spatialUnit,
          isochronesRangeType,
          isochronesRangeUnits
        );
        page.templateSection.legendImg = legendImg;
        legendDiv.appendChild(legendImg);
        if (pageElementDom) pageElementDom.appendChild(legendDiv);
      }

      let boundingCoords = echartsOptions.series[0].boundingCoords;
      const westLon = boundingCoords[0][0];
      const southLat = boundingCoords[1][1];
      const eastLon = boundingCoords[1][0];
      const northLat = boundingCoords[0][1];

      leafletMap.fitBounds([
        [southLat, westLon],
        [northLat, eastLon],
      ]);
      const bounds = leafletMap.getBounds();

      if (!(bounds.getWest() == bounds.getEast() && bounds.getNorth() == bounds.getSouth())) {
        boundingCoords = [
          [bounds.getWest(), bounds.getNorth()],
          [bounds.getEast(), bounds.getSouth()],
        ];
      }

      for (const series of echartsOptions.series) {
        series.left = 0;
        series.top = 0;
        series.right = 0;
        series.bottom = 0;
        series.boundingCoords = boundingCoords;
        series.projection = {
          project: (point) => context.mercatorProjection_d3(point),
          unproject: (point) => context.mercatorProjection_d3.invert(point),
        };
      }

      echartsOptions.geo[0].top = 0;
      echartsOptions.geo[0].left = 0;
      echartsOptions.geo[0].right = 0;
      echartsOptions.geo[0].bottom = 0;
      echartsOptions.geo[0].projection = {
        project: (point) => context.mercatorProjection_d3(point),
        unproject: (point) => context.mercatorProjection_d3.invert(point),
      };
      echartsOptions.geo[0].boundingCoords = boundingCoords;

      echartsMap.setOption(echartsOptions, { notMerge: false });

      let leafletLayer: any;
      if (pageElement.selectedBaseMap.layerConfig.layerType === 'TILE_LAYER_GRAYSCALE') {
        leafletLayer = new L.tileLayer(pageElement.selectedBaseMap.layerConfig.url);
      } else if (pageElement.selectedBaseMap.layerConfig.layerType === 'TILE_LAYER') {
        leafletLayer = new L.tileLayer(pageElement.selectedBaseMap.layerConfig.url);
      } else if (pageElement.selectedBaseMap.layerConfig.layerType === 'WMS') {
        leafletLayer = new L.tileLayer.wms(pageElement.selectedBaseMap.layerConfig.url, {
          layers: pageElement.selectedBaseMap.layerConfig.layerName_WMS,
          format: 'image/jpeg',
        });
      } else {
        leafletLayer = new L.tileLayer('');
      }

      const screenshotPromise = new Promise<string>((resolve) => {
        leafletLayer.on('load', async () => {
          await new Promise((r) => setTimeout(r, 500));
          const dataUrl = await this.leafletScreenshotCacheHelperService.checkForScreenshot(
            pageElement.selectedBaseMap.layerConfig.name,
            spatialUnit.spatialUnitId,
            page.spatialUnitFeatureId,
            page.orientation,
            leafletMap['_container'],
            this.reportingService.workingTemplate.name
          );
          resolve(dataUrl);
        });
      });

      // give the browser a beat to settle layout before Leaflet measures the container;
      // only then add the tile layer, so its tile grid is computed against the real size
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          leafletMap.invalidateSize(false);
          resolve();
        }, 100);
      });
      leafletLayer.addTo(leafletMap);

      pageElement.leafletMap = leafletMap;
      pageElement.leafletBbox = bounds;
      pageElement.echartsOptions = echartsOptions;

      const dataUrl = await screenshotPromise;

      if (
        !dataUrl ||
        (!dataUrl.startsWith('data:image') && !dataUrl.startsWith('blob:')) ||
        dataUrl.length < 10
      ) {
        console.warn('Invalid leaflet map screenshot generated for page ' + pageIdx);
        return undefined;
      }

      return dataUrl;
    } catch (error) {
      console.error(error);
      return undefined;
    } finally {
      // guaranteed cleanup: for preview pages this map/div lives in the visible page DOM,
      // so any early return or exception above must not leave a stuck partial map behind
      if (!isVisible) {
        if (leafletMap) leafletMap.remove();
        if (div) div.remove();
      }
    }
  }

  // `timeseries` is precomputed by the caller (this.getFormattedDateSliderValues(true), only for
  // 'timeseries' templates) since that reads live date-slider UI state only the component can
  // access - not something to pull into ReportGenerationContext or this service.
  createDatatablePageForIndicatorAdd(
    wrapper,
    page,
    timeseries: any,
    context: ReportGenerationContext
  ) {
    // table looks different depending on template type
    // for single timestamps it is added at the end of each timestamp-section, so each area is inserted once
    // for timeseries it is added once at the end of the template and contains an extra column for timestamps.
    // Each area is inserted for multiple timestamps.

    // our wrapper is 440px high.
    // 440 - 25 (header) = 415
    // we set each row to be 25px high, so we can fit 415 / 25 --> 16 rows on one page.
    const wrapperHeight = parseInt(wrapper.style.height, 10);
    const maxRows = Math.floor((wrapperHeight - 25) / 25);
    const rowsData: any[] = [];
    let timestamp = undefined;

    if (this.reportingService.clonedTemplate.name.includes('timestamp')) {
      // get the timestamp from pageElement, not from dom because dom might not be up to date yet
      const dateElement = page.pageElements.find((el) => {
        return el.type.includes('dataTimestamp-');
      });
      timestamp = dateElement.text;
    }

    // see how many pages need to be added. Rows are added later
    for (const feature of context.selectedIndicator.geoJSON.features) {
      // don't add row if feature not selected
      let isSelected = false;
      for (const tEarea of context.selectedAreas!) {
        const area: any = tEarea;

        if (area.name === feature.properties.NAME) {
          isSelected = true;
        }
      }
      if (!isSelected) continue;

      if (this.reportingService.clonedTemplate.name.includes('timestamp')) {
        // get the timestamp from pageElement, not from dom because dom might not be up to date yet
        const dateElement = page.pageElements.find((el) => {
          return el.type.includes('dataTimestamp-');
        });
        const timestamp = dateElement.text;
        // prepare data to insert later
        let value = feature.properties['DATE_' + timestamp];
        if (typeof value == 'number') value = Math.round(value * 100) / 100;

        rowsData.push({
          name: feature.properties.NAME,
          value: value,
        });
      }

      if (this.reportingService.clonedTemplate.name.includes('timeseries')) {
        for (const timestamp of timeseries.dates) {
          let value = feature.properties['DATE_' + timestamp];
          if (typeof value == 'number') value = Math.round(value * 100) / 100;
          rowsData.push({
            name: feature.properties.NAME,
            timestamp: timestamp,
            value: value,
          });
        }
      }
    }

    // sort by area name
    rowsData.sort((a, b) => a.name.localeCompare(b.name));

    // append average as last row if needed - categorical values have no meaningful average
    if (
      this.reportingService.clonedTemplate.name.includes('timestamp') &&
      !context.selectedIndicatorIsCategorical
    ) {
      rowsData.push({
        name: 'Durchschnitt Selektion',
        value: calculateAvg(context.selectedIndicator, timestamp, true, context.selectedAreas!),
      });
      rowsData.push({
        name: 'Durchschnitt Gesamtstadt',
        value: calculateAvg(context.selectedIndicator, timestamp, false, context.selectedAreas!),
      });
    }

    const columnNames = this.reportingService.clonedTemplate.name.includes('timeseries')
      ? ['Bereich', 'Zeitpunkt', 'Wert']
      : ['Bereich', 'Wert'];

    // rowsData is identical on every call (it's always recomputed from the full
    // selection); which slice of it belongs on THIS page is its position among all
    // 'datatable' pages currently in the template -- preparePageForIndicatorAdd's
    // 'datatable' case already removed any stale continuation pages before calling us,
    // so on first entry for a given indicator there's exactly one (this one)
    const datatablePageIndices = context.pages
      .map((p: any, i: number) =>
        p.pageElements.some((el: any) => el.type === 'datatable') ? i : -1
      )
      .filter((i: number) => i !== -1);
    const pageIndex = context.pages.indexOf(page);
    const pageOffset = datatablePageIndices.indexOf(pageIndex);

    // if more rows remain than fit here and no continuation page exists yet, insert exactly
    // one -- the outer preparation loop re-checks pages.length every iteration, so it will
    // reach this new page next and call back into this method for its own slice
    const isLastDatatablePage = pageOffset === datatablePageIndices.length - 1;
    if (isLastDatatablePage && rowsData.length > (pageOffset + 1) * maxRows) {
      const newPage = this.reportingService.getDatatablePageClone();
      newPage.id = this.reportingService.nextTemplatePageId();

      for (const pageElement of newPage.pageElements) {
        if (pageElement.type.includes('indicatorTitle-')) {
          pageElement.text =
            context.selectedIndicator.indicatorName + ' [' + context.selectedIndicator.unit + ']';
          pageElement.isPlaceholder = false;
        }

        if (pageElement.type.includes('dataTimestamp-')) {
          pageElement.text = timestamp;
          pageElement.isPlaceholder = false;
        }

        // exists only on timeseries template (instead of dataTimestamp-landscape), so we don't need another if...else here
        if (pageElement.type.includes('dataTimeseries-')) {
          pageElement.text = timeseries.from + ' - ' + timeseries.to;
          pageElement.isPlaceholder = false;
        }

        if (pageElement.type === 'datatable') {
          pageElement.isPlaceholder = false;
        }
      }

      context.pages.splice(pageIndex + 1, 0, newPage);
    }

    // build this page's table directly into the element we were given -- no DOM lookup/
    // polling needed, `wrapper` already is the right node (see preparePageForIndicatorAdd's
    // 'datatable' case, which also scrapes the result straight back out synchronously)
    wrapper.innerHTML = '';
    wrapper.style.border = 'none'; // hide dotted border from outer dom element
    wrapper.style.justifyContent = 'flex-start'; // align table at top instead of center

    const table = createDatatableSkeleton(columnNames);
    wrapper.appendChild(table);
    const tbody = table.querySelector('tbody')!;

    const pageElement = page.pageElements.find((el) => el.type === 'datatable');
    pageElement.isPlaceholder = false;

    const rowsForThisPage = rowsData.slice(pageOffset * maxRows, (pageOffset + 1) * maxRows);
    for (const rowData of rowsForThisPage) {
      const row = document.createElement('tr');
      row.style.height = '25px';

      for (const colName of columnNames) {
        const td = document.createElement('td');
        if (colName === 'Bereich') {
          td.innerText = rowData.name;
          td.classList.add('text-left');
        }

        if (colName === 'Zeitpunkt') {
          td.innerText = rowData.timestamp;
        }

        if (colName === 'Wert') {
          td.innerText = rowData.value;
          td.classList.add('text-right');
        }

        row.appendChild(td);
      }

      tbody.appendChild(row);
    }
  }
}
