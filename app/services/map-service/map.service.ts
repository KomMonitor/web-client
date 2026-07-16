import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';

export interface MapRefreshObject {
  values: MapRefreshValues;
  error: boolean;
  errorMsg?: string[] | undefined;
}

export interface MapRefreshValues {
  indicator: any | undefined;
  spatialUnit: any | undefined;
  date: any | undefined;
  justRestyling?: boolean | undefined;
  customComputation?: boolean | undefined;
}

/**
 * Single typed request for rendering an indicator on the main map.
 *
 * `source` distinguishes why the render happens:
 * - 'selection': the user selected indicator/spatial unit/date (data setup flow)
 * - 'dataset-replacement': an already displayed dataset was replaced with new
 *   feature values (filtering, balance computation) — consumers such as the
 *   filter component only react to this variant
 */
export interface IndicatorRenderRequest {
  indicator: any;
  spatialUnitName: any;
  date: any;
  justRestyling: boolean;
  isCustomComputation: boolean;
  source: 'selection' | 'dataset-replacement';
}

/**
 * Typed command for the main map (map refactoring plan, Phase 5 — replaces the
 * former untyped BroadcastService messages consumed by KommonitorMapComponent).
 * The map component is the single dispatcher: it forwards layer commands to the
 * layer manager services and handles the styling/highlight/UI commands itself.
 * A few sidebar components subscribe too, filtering for the commands they share
 * with the map (changeSpatialUnit, unselectAllFeatures, beginIndicatorTimeSetup,
 * onGlobalFilterChange).
 */
export type MapCommand =
  // indicator classification controls
  | { type: 'changeClassifyMethod'; method: any }
  | { type: 'changeNumClasses'; numClasses: any }
  | { type: 'changeColorScheme'; colorSchemeName: any }
  | { type: 'changeBreaks'; breaks: any }
  | { type: 'changeDynamicBreaks'; breaks: any }
  | { type: 'restyleCurrentLayer'; skipDiagramRefresh: boolean }
  | { type: 'changeSpatialUnit' }
  | { type: 'beginIndicatorTimeSetup' }
  // feature highlighting
  | { type: 'highlightFeature'; featureName: any }
  | { type: 'unhighlightFeature'; featureName: any }
  | { type: 'switchHighlightFeature'; featureName: any }
  | { type: 'preserveHighlightedFeatures' }
  | { type: 'unselectAllFeatures' }
  // georesource layers
  | { type: 'addPoiGeoresource'; georesource: any; date: any; useCluster: any }
  | { type: 'removePoiGeoresource'; georesource: any }
  | { type: 'addLoiGeoresource'; georesource: any; date: any }
  | { type: 'removeLoiGeoresource'; georesource: any }
  | { type: 'addAoiGeoresource'; georesource: any; date: any }
  | { type: 'removeAoiGeoresource'; georesource: any }
  // OGC layers
  | { type: 'addWmsLayer'; dataset: any; opacity: any }
  | { type: 'removeWmsLayer'; dataset: any }
  | { type: 'addWfsLayer'; dataset: any; opacity: any; useCluster: any }
  | { type: 'removeWfsLayer'; dataset: any }
  | { type: 'adjustWfsLayerColor'; dataset: any; opacity: any }
  // file layers
  | { type: 'addFileLayer'; dataset: any }
  | { type: 'adjustFileLayerOpacity'; dataset: any; opacity: any }
  | { type: 'adjustFileLayerColor'; dataset: any }
  | { type: 'removeFileLayer'; dataset: any }
  // reachability scenario
  | { type: 'replaceReachabilityScenario'; reachabilityScenario: any }
  | { type: 'removeReachabilityScenario' }
  // map UI
  | { type: 'showLoadingIcon' }
  | { type: 'hideLoadingIcon' }
  | { type: 'exportMap' }
  | { type: 'toggleExpertControls' }
  | { type: 'openLayerControl' }
  | { type: 'onGlobalFilterChange' };

/** Facts about the currently rendered indicator dataset, shown by legend + classification panel. */
export interface LegendDisplayUpdate {
  containsZeroValues: any;
  datasetContainsNegativeValues: any;
  containsNoDataValues: any;
  containsOutliers_high: any;
  containsOutliers_low: any;
  outliers_low: any;
  outliers_high: any;
  selectedDate: any;
}

/** Rendering context the sidebar diagrams need to rebuild themselves after a map render. */
export interface DiagramsUpdate {
  indicatorMetadataAndGeoJSON: any;
  spatialUnitLevel: any;
  spatialUnitId: any;
  date: any;
  brew: any;
  gtMeasureOfValueBrew: any;
  ltMeasureOfValueBrew: any;
  dynamicIncreaseBrew: any;
  dynamicDecreaseBrew: any;
  isMeasureOfValueChecked: any;
  measureOfValue: any;
  justRestyling: any;
}

/**
 * Typed event emitted by the main map (map refactoring plan — replaces the
 * former untyped BroadcastService messages the map component sent). Consumers:
 * legend + classification panel (legendDisplayUpdated), the sidebar diagrams
 * (diagramsUpdate, featureHovered/Unhovered).
 */
export type MapEvent =
  | { type: 'legendDisplayUpdated'; update: LegendDisplayUpdate }
  | { type: 'diagramsUpdate'; update: DiagramsUpdate }
  | { type: 'featureHovered'; properties: any }
  | { type: 'featureUnhovered'; properties: any };

export interface MapRecenterObject {
  resize: boolean;
  recenter: boolean;
}

export interface DateSliderObject {
  data: Date[] | undefined;
  selected: Date | undefined;
  disabled: boolean | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private mapRefreshStateSubject = new BehaviorSubject<MapRefreshObject>({
    values: {
      indicator: undefined,
      spatialUnit: undefined,
      date: undefined,
    },
    error: false,
  });
  mapRefreshState$ = this.mapRefreshStateSubject.asObservable();

  // ReplaySubject(1) so the map component still receives the latest render
  // request even if it subscribes after the request was emitted (matches the
  // replay behavior of the former BehaviorSubject-based refresh state).
  private indicatorRenderRequestSubject = new ReplaySubject<IndicatorRenderRequest>(1);
  indicatorRenderRequest$ = this.indicatorRenderRequestSubject.asObservable();

  private mapCommandSubject = new Subject<MapCommand>();
  mapCommand$ = this.mapCommandSubject.asObservable();

  private mapEventSubject = new Subject<MapEvent>();
  mapEvent$ = this.mapEventSubject.asObservable();

  private mapRecenterSubject = new BehaviorSubject<MapRecenterObject>({
    resize: false,
    recenter: false,
  });
  mapRecenter$ = this.mapRecenterSubject.asObservable();

  private dateSliderSubject = new BehaviorSubject<DateSliderObject>({
    data: undefined,
    selected: undefined,
    disabled: undefined,
  });
  dateSlider$ = this.dateSliderSubject.asObservable();

  setDateSliderValues(patch: Partial<DateSliderObject>) {
    this.dateSliderSubject.next({
      ...this.dateSliderSubject.value,
      ...patch,
    });
  }

  setMapRecenterState(patch: Partial<MapRecenterObject>) {
    this.mapRecenterSubject.next({
      ...this.mapRecenterSubject.value,
      ...patch,
    });
  }

  setMapRefreshValues(values: MapRefreshValues) {
    this.mapRefreshStateSubject.next({
      ...this.mapRefreshStateSubject.value,
      values: values,
    });

    if (this.readyForRefresh()) {
      this.indicatorRenderRequestSubject.next({
        indicator: values.indicator,
        spatialUnitName: values.spatialUnit,
        date: values.date,
        justRestyling: !!values.justRestyling,
        isCustomComputation: !!values.customComputation,
        source: 'selection',
      });
    }
  }

  readyForRefresh(): boolean {
    if (
      this.mapRefreshStateSubject.value.values.indicator !== undefined &&
      this.mapRefreshStateSubject.value.values.spatialUnit !== undefined &&
      this.mapRefreshStateSubject.value.values.date !== undefined
    )
      return true;

    return false;
  }

  resetMapRefreshState() {
    this.mapRefreshStateSubject.next({
      values: {
        indicator: undefined,
        spatialUnit: undefined,
        date: undefined,
        justRestyling: false,
        customComputation: false,
      },
      error: false,
    });
  }

  replaceIndicatorGeoJSON(
    indicatorMetadataAndGeoJSON,
    spatialUnitName,
    date,
    justRestyling,
    isCustomComputation = false
  ) {
    this.indicatorRenderRequestSubject.next({
      indicator: indicatorMetadataAndGeoJSON,
      spatialUnitName,
      date,
      justRestyling: !!justRestyling,
      isCustomComputation,
      source: 'dataset-replacement',
    });
  }

  command(command: MapCommand) {
    this.mapCommandSubject.next(command);
  }

  // --- events emitted by the map component ---

  notifyLegendDisplayUpdated(update: LegendDisplayUpdate) {
    this.mapEventSubject.next({ type: 'legendDisplayUpdated', update });
  }

  notifyDiagramsUpdate(update: DiagramsUpdate) {
    this.mapEventSubject.next({ type: 'diagramsUpdate', update });
  }

  notifyFeatureHovered(properties) {
    this.mapEventSubject.next({ type: 'featureHovered', properties });
  }

  notifyFeatureUnhovered(properties) {
    this.mapEventSubject.next({ type: 'featureUnhovered', properties });
  }

  // --- indicator classification controls ---

  changeClassifyMethod(method) {
    this.command({ type: 'changeClassifyMethod', method });
  }

  changeNumClasses(numClasses) {
    this.command({ type: 'changeNumClasses', numClasses });
  }

  changeColorScheme(colorSchemeName) {
    this.command({ type: 'changeColorScheme', colorSchemeName });
  }

  changeBreaks(breaks) {
    this.command({ type: 'changeBreaks', breaks });
  }

  changeDynamicBreaks(breaks) {
    this.command({ type: 'changeDynamicBreaks', breaks });
  }

  restyleCurrentLayer(skipDiagramRefresh = false) {
    this.command({ type: 'restyleCurrentLayer', skipDiagramRefresh });
  }

  changeSpatialUnit() {
    this.command({ type: 'changeSpatialUnit' });
  }

  beginIndicatorTimeSetup() {
    this.command({ type: 'beginIndicatorTimeSetup' });
  }

  // --- feature highlighting ---

  highlightFeature(featureName) {
    this.command({ type: 'highlightFeature', featureName });
  }

  unhighlightFeature(featureName) {
    this.command({ type: 'unhighlightFeature', featureName });
  }

  switchHighlightFeature(featureName) {
    this.command({ type: 'switchHighlightFeature', featureName });
  }

  preserveHighlightedFeatures() {
    this.command({ type: 'preserveHighlightedFeatures' });
  }

  unselectAllFeatures() {
    this.command({ type: 'unselectAllFeatures' });
  }

  // --- georesource layers ---

  addPoiGeoresourceGeoJSON(poiGeoresource, date, useCluster) {
    this.command({ type: 'addPoiGeoresource', georesource: poiGeoresource, date, useCluster });
  }

  removePoiGeoresource(reference) {
    this.command({ type: 'removePoiGeoresource', georesource: reference });
  }

  addLoiGeoresourceGeoJSON(loiGeoresource, date) {
    this.command({ type: 'addLoiGeoresource', georesource: loiGeoresource, date });
  }

  removeLoiGeoresource(loiGeoresource) {
    this.command({ type: 'removeLoiGeoresource', georesource: loiGeoresource });
  }

  addAoiGeoresourceGeoJSON(aoiGeoresource, date) {
    this.command({ type: 'addAoiGeoresource', georesource: aoiGeoresource, date });
  }

  removeAoiGeoresource(aoiGeoresource) {
    this.command({ type: 'removeAoiGeoresource', georesource: aoiGeoresource });
  }

  // --- OGC layers ---

  addWmsLayerToMap(dataset, opacity) {
    this.command({ type: 'addWmsLayer', dataset, opacity });
  }

  removeWmsLayerFromMap(dataset) {
    this.command({ type: 'removeWmsLayer', dataset });
  }

  addWfsLayerToMap(wfs, opacity, useCluster) {
    this.command({ type: 'addWfsLayer', dataset: wfs, opacity, useCluster });
  }

  removeWfsLayerFromMap(wfs) {
    this.command({ type: 'removeWfsLayer', dataset: wfs });
  }

  adjustColorForWfsLayer(dataset, opacity) {
    this.command({ type: 'adjustWfsLayerColor', dataset, opacity });
  }

  // --- file layers ---

  addFileLayerToMap(dataset, _opacity) {
    // NOTE: the opacity argument was never delivered in the legacy broadcast
    // either — the file layer is added with its default opacity
    this.command({ type: 'addFileLayer', dataset });
  }

  removeFileLayerFromMap(dataset) {
    this.command({ type: 'removeFileLayer', dataset });
  }

  adjustOpacityForFileLayer(dataset, opacity) {
    this.command({ type: 'adjustFileLayerOpacity', dataset, opacity });
  }

  adjustColorForFileLayer(dataset) {
    this.command({ type: 'adjustFileLayerColor', dataset });
  }

  // --- reachability scenario ---

  replaceReachabilityScenarioOnMainMap(reachabilityScenario) {
    this.command({ type: 'replaceReachabilityScenario', reachabilityScenario });
  }

  removeReachabilityScenarioFromMainMap() {
    this.command({ type: 'removeReachabilityScenario' });
  }

  // --- map UI ---

  showLoadingIcon() {
    this.command({ type: 'showLoadingIcon' });
  }

  hideLoadingIcon() {
    this.command({ type: 'hideLoadingIcon' });
  }

  exportMap() {
    this.command({ type: 'exportMap' });
  }

  toggleExpertControls() {
    this.command({ type: 'toggleExpertControls' });
  }

  openLayerControl() {
    this.command({ type: 'openLayerControl' });
  }

  onGlobalFilterChange() {
    this.command({ type: 'onGlobalFilterChange' });
  }
}
