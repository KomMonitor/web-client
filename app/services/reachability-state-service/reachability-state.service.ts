import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import * as turf from '@turf/turf';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import uuidv4 from '../../../customizedExternalLibs/uuidv4.js';

export interface ReachabilitySettings {
  ranges: number[];
  focus: ReachabilityFocusTypes;
  focusUnit: string;
  transitMode: ReachabilityTransitModeTypes;
  startPointsSource: string;
}

export type ReachabilityTransitModeTypes =
  | 'buffer'
  | 'foot-walking'
  | 'cycling-regular'
  | 'driving-car'
  | 'wheelchair';

export type ReachabilityFocusTypes = 'distance' | 'time';

export interface ReachabilityModel {
  scenarioTitle?: string;
  features?: GeoJSONFeature[];
  isochronesGeoJson?: any;
  selectedStartPointLayer?: any;
  selectedStartDate?: string;
  loadingState: boolean;
  scenarioState?: boolean;
  showOnMainMap: boolean;
}

export interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties?: {
    [key: string]: any;
  };
  id?: string | number;
  bbox?: number[];
  label?: string;
}

export interface PoiDataset {
  poiId: string;
  poiName: string;
  poiDate: string;
}

/** A serializable copy of the live session, used to persist/restore a named scenario. */
export interface ReachabilitySessionSnapshot {
  reachabilitySettings: any;
  scenarioName: string;
  indicatorStatistics: any[];
  isochrones_dissolved: any;
  isochrones_perPoint: any;
  poiDataset: PoiDataset;
  [key: string]: any;
}

/**
 * Single source of truth for reachability/isochrone calculation, shared by both entry
 * points: the quick-calc UI on the main map and the step-by-step scenario wizard. Merges
 * what used to be two separately-instantiated services (ReachabilityCombinerService,
 * ReachabilityHelperService) so both paths read/write the same live state instead of
 * copying data back and forth between service instances.
 */
@Injectable({
  providedIn: 'root',
})
export class ReachabilityStateService {
  private metadataBootstrap = inject(MetadataBootstrapService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);
  private broadcastService = inject(BroadcastService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private selectionState = inject(SelectionStateService);

  private readonly destroyRef = inject(DestroyRef);

  // mode to select a point on the map, for quick reachability calc
  manualMapSelectionMode = false;

  defaults = {
    distanceRanges: [100, 200, 300, 400, 500],
    timeRanges: [5, 10, 15],
    distanceMax: 10000,
    timeMax: 30,
  };

  // simplified settings driving the quick-calc sidebar UI (slider, transit mode buttons)
  quickCalcSettings: ReachabilitySettings = {
    ranges: this.defaults.distanceRanges,
    focus: 'distance',
    focusUnit: 'm',
    transitMode: 'foot-walking',
    startPointsSource: 'manual',
  };

  // detailed calculation/config settings driving the scenario wizard and ORS request building
  settings: any = {};

  currentIsochronesGeoJSON: any = undefined;
  original_nonDissolved_isochrones: any = undefined;

  // working data for the scenario wizard's indicator-statistics step, and the POI
  // dataset descriptor attached to a scenario when it's saved
  indicatorStatistics: any[] = [];
  poiDataset: PoiDataset = { poiId: '', poiName: '', poiDate: '' };

  error = undefined;

  private reachabilityMapSubject = new BehaviorSubject<ReachabilityModel>({
    features: [],
    isochronesGeoJson: null,
    loadingState: false,
    showOnMainMap: false,
  });

  reachabilityMapSubject$ = this.reachabilityMapSubject.asObservable();

  readonly loadingState$ = this.reachabilityMapSubject.asObservable().pipe(
    map((x) => x.loadingState),
    distinctUntilChanged()
  );

  filteredDisplayableGeoresources: any[] = [];
  filteredAvailablePeriodsOfValidity: any = [];

  startPointLayer!: GeoresourcesDataset;

  emptyDatasetName = '-- leerer neuer Datensatz --';

  constructor() {
    this.metadataBootstrap.metadataLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value == MetadataLoadingState.COMPLETE) {
          this.filteredDisplayableGeoresources =
            this.georesourceStore.displayableGeoresources.filter((e) => e.isPOI);
          this.initEmptyDataset();
        }
      });

    this.settings.pointSourceConfigured = false;
    this.settings.useMultipleStartPoints = false;
    this.settings.unit = 'Meter';

    this.settings.locationsArray = [];
    this.settings.locationsArrayIdArray = [];

    this.settings.dateSelectionType_valueIndicator = 'date_indicator';
    this.settings.dateSelectionType_valueManual = 'date_manual';
    this.settings.dateSelectionType_valuePerDataset = 'date_perDataset';
    this.settings.dateSelectionType = {
      selectedDateType: this.settings.dateSelectionType_valuePerDataset,
    };

    this.settings.selectedDate_manual = undefined;

    this.settings.isochroneConfig = {};
    this.settings.isochroneConfig.dateSelectionType_valueIndicator = 'date_indicator';
    this.settings.isochroneConfig.dateSelectionType_valueManual = 'date_manual';
    this.settings.isochroneConfig.dateSelectionType_valuePerDataset = 'date_perDataset';
    this.settings.isochroneConfig.dateSelectionType = {
      selectedDateType: this.settings.isochroneConfig.dateSelectionType_valuePerDataset,
    };

    this.settings.isochroneConfig.selectedDate_manual = undefined;

    this.settings.dissolveIsochrones = true;

    this.settings.routingStartPointInput = undefined;
    this.settings.routingEndPointInput = undefined;

    /**
     * The current time-or-distance value of the
     * analysis. The unit of the stored value can be
     * found in the variable 'unit'. This value
     * represents value of the slider in the GUI and
     * handed to the routing API.
     */
    this.settings.currentTODValue = 1;

    /**
     * Specifies the route preference.
     *
     * Allowed values are:
     * - "fastest"
     * - "shortest"
     * - "recommended"
     */
    this.settings.preference = 'fastest';

    this.settings.isochroneInput = undefined;

    /**
     * Variable to save the keywords used by the
     * routing API. Valid values are:
     * driving-car
     * driving-hgv // LKW
     * cycling-regular
     * cycling-road
     * cycling-safe
     * cycling-mountain
     * cycling-tour
     * cycling-electric
     * foot-walking
     * foot-hiking
     * wheelchair
     */
    this.settings.transitMode = 'buffer';

    /**
     * The focus of the analysis. Valid values are:
     * 'distance' and 'time'.
     */
    this.settings.focus = 'distance';

    /**
     * config of starting points source (layer or manual draw) for isochrones
     */
    this.settings.startPointsSource = 'fromLayer';

    /**
     * selected start point layer for isochrone computation
     * GeoJSON within property .geoJSON
     */
    this.settings.selectedStartPointLayer = undefined;
  }

  initEmptyDataset() {
    // add empty dataset to displayableGeoresources
    // ensure to remove it again, if modal gets closed

    // create empty georesource dataset and geoJSON
    const emptyDataset = {
      georesourceId: uuidv4(),
      datasetName: this.emptyDatasetName,
      isNewReachabilityDataSource: true,
      isPOI: true,
      availablePeriodsOfValidity: [
        {
          startDate: undefined,
          endDate: undefined,
        },
      ],
      poiMarkerColor: 'orange',
      poiSymbolBootstrap3Name: 'pushpin',
      poiSymbolColor: 'white',
      geoJSON_reachability: {
        type: 'FeatureCollection',
        features: [],
      },
    };

    this.filteredDisplayableGeoresources.splice(0, 0, emptyDataset);
  }

  set showOnMainMap(state: boolean) {
    this.reachabilityMapSubject.value.showOnMainMap = state;
  }

  get showOnMainMap(): boolean {
    return this.reachabilityMapSubject.value.showOnMainMap;
  }

  set startPointsSource(type: string) {
    this.quickCalcSettings.startPointsSource = type;
  }

  get startPointsSource() {
    return this.quickCalcSettings.startPointsSource;
  }

  get scenarioTitle(): string {
    return this.reachabilityMapSubject.value.scenarioTitle!;
  }

  set scenarioTitle(title: string) {
    this.reachabilityMapSubject.value.scenarioTitle = title;
  }

  get isochronesGeoJson() {
    return this.reachabilityMapSubject.value.isochronesGeoJson;
  }

  get features(): GeoJSONFeature[] {
    return this.reachabilityMapSubject.value.features!;
  }

  set setScenarioState(state: boolean) {
    this.reachabilityMapSubject.value.scenarioState = state;
  }

  get locations(): GeoJSONFeature[] {
    if (this.reachabilityMapSubject.value.features)
      return this.reachabilityMapSubject.value.features;
    else return [];
  }

  get selectedStartDate(): any {
    return this.reachabilityMapSubject.value.selectedStartDate;
  }

  set selectedStartDate(date: any) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      selectedStartDate: date,
    });
  }

  get selectedStartPointLayer(): any {
    return this.reachabilityMapSubject.value.selectedStartPointLayer;
  }

  set selectedStartPointLayer(layer: any) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      selectedStartPointLayer: layer,
    });
  }

  get loadingState(): boolean {
    return this.reachabilityMapSubject.value.loadingState;
  }

  get isValidCalculation(): boolean {
    return (
      (this.reachabilityMapSubject.value.features &&
        this.reachabilityMapSubject.value.features.length > 0 &&
        this.reachabilityMapSubject.value.isochronesGeoJson &&
        !this.reachabilityMapSubject.value.loadingState) ||
      false
    );
  }

  get featureSelected(): boolean {
    return (
      (this.reachabilityMapSubject.value.features &&
        this.reachabilityMapSubject.value.features.length > 0) ||
      false
    );
  }

  reset() {
    this.reachabilityMapSubject.value.scenarioTitle = undefined;
    this.reachabilityMapSubject.value.features = undefined;
    this.reachabilityMapSubject.value.isochronesGeoJson = undefined;
    this.reachabilityMapSubject.value.selectedStartPointLayer = undefined;
    this.reachabilityMapSubject.value.selectedStartDate = undefined;
    this.reachabilityMapSubject.value.loadingState = false;
    this.reachabilityMapSubject.value.scenarioState = false;
    this.indicatorStatistics = [];
    this.poiDataset = { poiId: '', poiName: '', poiDate: '' };
  }

  /**
   * Full reset for the scenario modal's "Zurücksetzen" button: clears the wizard's own
   * working data (title, calculation results, indicator statistics, POI-source
   * metadata, the detailed `settings`) AND the quick-calc session (locations,
   * isochrones, layer selection) shown independently on the main map, so nothing from
   * either flow lingers once the user asks to start over.
   */
  resetScenarioSession() {
    this.reachabilityMapSubject.value.scenarioTitle = undefined;
    this.reachabilityMapSubject.value.scenarioState = false;
    this.currentIsochronesGeoJSON = undefined;
    this.original_nonDissolved_isochrones = undefined;
    this.indicatorStatistics = [];
    this.poiDataset = { poiId: '', poiName: '', poiDate: '' };
    this.resetSettings();

    // clear the quick-calc session while showOnMainMap is still whatever it was, so the
    // emitted empty features/isochrones actually get removed from the main map, then
    // hide the (now empty) quick-calc overlay and leave point-selection mode
    this.resetLocations();
    this.showOnMainMap = false;
    this.manualMapSelectionMode = false;
    this.startPointsSource = 'manual';
  }

  setPoiDataset(poiDataset: any) {
    const poiDatasetClone = JSON.parse(JSON.stringify(poiDataset));
    this.poiDataset = {
      poiId: poiDatasetClone.georesourceId,
      poiName: poiDatasetClone.datasetName,
      poiDate: this.settings.isochroneConfig.selectedDate?.startDate || 'tmpDataset',
    };
  }

  /** Deep-clones the current session into a serializable snapshot, e.g. to persist a scenario. */
  getSnapshot(): ReachabilitySessionSnapshot {
    this.setPoiDataset(this.settings.selectedStartPointLayer);

    return JSON.parse(
      JSON.stringify({
        reachabilitySettings: this.settings,
        scenarioName: this.scenarioTitle,
        indicatorStatistics: this.indicatorStatistics,
        isochrones_dissolved: this.currentIsochronesGeoJSON,
        isochrones_perPoint: this.original_nonDissolved_isochrones,
        poiDataset: this.poiDataset,
      })
    );
  }

  /** Replaces the live session with a clone of a previously captured snapshot, e.g. to load a scenario. */
  restoreSnapshot(snapshot: ReachabilitySessionSnapshot) {
    this.scenarioTitle = snapshot.scenarioName;
    this.selectedStartPointLayer = snapshot.reachabilitySettings.selectedStartPointLayer;
    this.selectedStartDate = snapshot.reachabilitySettings.isochroneConfig.selectedDate;

    this.settings = JSON.parse(JSON.stringify(snapshot.reachabilitySettings));
    this.currentIsochronesGeoJSON = JSON.parse(JSON.stringify(snapshot.isochrones_dissolved));
    this.original_nonDissolved_isochrones = JSON.parse(
      JSON.stringify(snapshot.isochrones_perPoint)
    );
    this.indicatorStatistics = JSON.parse(JSON.stringify(snapshot.indicatorStatistics || []));
    this.poiDataset = JSON.parse(JSON.stringify(snapshot.poiDataset));
  }

  async addLocation(location: GeoJSONFeature, manualSel: boolean = false) {
    location.properties = {
      [this.envConfigService.FEATURE_ID_PROPERTY_NAME]: uuidv4(),
      [this.envConfigService.FEATURE_NAME_PROPERTY_NAME]: location.label,
      [this.envConfigService.VALID_START_DATE_PROPERTY_NAME]: '2026-01-01',
      [this.envConfigService.VALID_END_DATE_PROPERTY_NAME]: undefined,
    };

    const current = this.reachabilityMapSubject.value.features;
    current?.push(location);

    if (current) {
      if (manualSel) {
        const label = await this.locationLookup(location);
        location.label = label;
      }

      this.reachabilityMapSubject.next({
        ...this.reachabilityMapSubject.value,
        features: current,
      });
    }
  }

  resetLocations() {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      features: [],
      isochronesGeoJson: null,
      selectedStartDate: undefined,
      selectedStartPointLayer: undefined,
      scenarioState: false,
    });
  }

  deleteLocation(location: GeoJSONFeature) {
    const current = this.reachabilityMapSubject.value.features?.filter((loc) => loc !== location);

    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      features: current,
    });

    this.startQuickCalculation();
  }

  setIsochronesGeoJson(isochronesGeoJson: any) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      isochronesGeoJson,
    });
  }

  setLoadingState(state: boolean) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      loadingState: state,
    });
  }

  async startQuickCalculation() {
    if (
      this.reachabilityMapSubject.value.features &&
      this.reachabilityMapSubject.value.features.length > 0
    ) {
      this.setLoadingState(true);

      const coordinatesArray: any = this.reachabilityMapSubject.value.features.map((location) => [
        location.geometry.coordinates[0],
        location.geometry.coordinates[1],
      ]);

      await this.startIsochroneCalculationForPoints(
        coordinatesArray,
        this.quickCalcSettings.ranges,
        this.quickCalcSettings.focus,
        this.quickCalcSettings.transitMode
      );

      this.setLoadingState(false);
    }
  }

  async locationLookup(e: GeoJSONFeature) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${e.geometry.coordinates[1]}&lon=${e.geometry.coordinates[0]}&format=json`
    );
    const data = await res.json();
    // NOTE: the trailing `|| 'Unbekannt'` was dead (a template literal is always truthy),
    // so it never acted as a fallback. Behaviour is unchanged by dropping it.
    return `${data.address.road} ${data.address.house_number}, ${data.address.postcode} ${data.address.city || data.address.city_district || data.address.town || data.address.village}`;
  }

  prepAvailablePeriods() {
    const tempDates: any[] = [];
    this.filteredAvailablePeriodsOfValidity =
      this.selectedStartPointLayer.availablePeriodsOfValidity
        ?.filter((e) => {
          if (!tempDates.includes(e.startDate)) {
            tempDates.push(e.startDate);
            return true;
          }

          return false;
        })
        .sort((a, b) => {
          if (a > b) return -1;
          else return 1;
        });

    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      selectedStartDate: this.filteredAvailablePeriodsOfValidity[0].startDate,
    });

    this.fetchPoiResourceGeoJSON();
  }

  onChangePoiResource() {
    this.prepAvailablePeriods();
  }

  private buildGeoresourceGeoJSONUrl(georesourceId: string, date: string): string {
    const dateComps = date.split('-');
    const year = dateComps[0];
    const month = dateComps[1];
    const day = dateComps[2];

    return (
      this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
      '/georesources/' +
      georesourceId +
      '/' +
      year +
      '/' +
      month +
      '/' +
      day
    );
  }

  fetchPoiResourceGeoJSON(globalModel = true) {
    const url = this.buildGeoresourceGeoJSONUrl(
      this.selectedStartPointLayer.georesourceId,
      this.selectedStartDate
    );

    this.http.get(url).subscribe({
      next: (response: any) => {
        if (globalModel)
          this.reachabilityMapSubject.next({
            ...this.reachabilityMapSubject.value,
            features: response.features,
          });
        else {
          this.settings.selectedStartPointLayer.geoJSON_reachability = response;
          this.settings.selectedStartPointLayer.geoJSON = response;
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  setTransitMode(mode: ReachabilityTransitModeTypes) {
    this.quickCalcSettings.transitMode = mode;
    this.startQuickCalculation();
  }

  setFocusMode(mode: ReachabilityFocusTypes) {
    this.quickCalcSettings.focus = mode;

    if (mode == 'distance') {
      this.quickCalcSettings.ranges = this.defaults.distanceRanges;
      this.quickCalcSettings.focusUnit = 'm';
    } else {
      this.quickCalcSettings.ranges = this.defaults.timeRanges;
      this.quickCalcSettings.focusUnit = 'min';
    }

    this.startQuickCalculation();
  }

  // ---------------------------------------------------------------------------------
  // Calculation engine (formerly ReachabilityHelperService) — operates on `settings`,
  // the detailed configuration bag used by the scenario wizard and quick-calc alike.
  // ---------------------------------------------------------------------------------

  resetSettings() {
    this.settings = {};

    this.settings.pointSourceConfigured = false;
    this.settings.useMultipleStartPoints = false;
    this.settings.unit = 'Meter';

    this.settings.locationsArray = [];

    this.settings.dateSelectionType_valueIndicator = 'date_indicator';
    this.settings.dateSelectionType_valueManual = 'date_manual';
    this.settings.dateSelectionType_valuePerDataset = 'date_perDataset';
    this.settings.dateSelectionType = {
      selectedDateType: this.settings.dateSelectionType_valuePerDataset,
    };

    this.settings.selectedDate_manual = undefined;

    this.settings.isochroneConfig = {};
    this.settings.isochroneConfig.dateSelectionType_valueIndicator = 'date_indicator';
    this.settings.isochroneConfig.dateSelectionType_valueManual = 'date_manual';
    this.settings.isochroneConfig.dateSelectionType_valuePerDataset = 'date_perDataset';
    this.settings.isochroneConfig.dateSelectionType = {
      selectedDateType: this.settings.isochroneConfig.dateSelectionType_valuePerDataset,
    };

    this.settings.isochroneConfig.selectedDate_manual = undefined;

    this.settings.dissolveIsochrones = true;
    this.settings.transitMode = 'buffer';
    document.getElementById('optBuffer')?.click();
    this.settings.focus = 'distance';
    document.getElementById('focus_distance')?.click();
    this.settings.startPointsSource = 'fromLayer';

    this.settings.selectedStartPointLayer = undefined;

    this.settings.loadingData = false;

    this.settings.currentTODValue = 1;

    this.settings.preference = 'fastest';

    this.settings.routingStartPointInput = undefined;
    this.settings.routingEndPointInput = undefined;
  }

  createRoutingRequest(transitMode, preference, routingStartPointInput, routingEndPointInput) {
    // if user never clicked transit mode set standard
    if (transitMode === 'buffer') {
      transitMode = 'foot-walking';
    }

    const getRequest =
      this.envConfigService.targetUrlToReachabilityService_ORS +
      '/v2/directions/' +
      transitMode +
      '?' +
      'start=' +
      routingStartPointInput +
      '&end=' +
      routingEndPointInput;

    return getRequest;
  }

  fetchGeoJSONForIsochrones() {
    if (!this.settings.selectedStartPointLayer) {
      this.settings.loadingData = false;
      return;
    }

    // clear any previous results
    this.settings.selectedStartPointLayer.geoJSON_reachability = undefined;

    let date;

    if (
      this.settings.isochroneConfig.dateSelectionType.selectedDateType ===
      this.settings.isochroneConfig.dateSelectionType_valuePerDataset
    ) {
      date = this.settings.isochroneConfig.selectedDate.startDate;
    } else if (
      this.settings.isochroneConfig.dateSelectionType.selectedDateType ===
      this.settings.isochroneConfig.dateSelectionType_valueManual
    ) {
      date = this.settings.isochroneConfig.selectedDate_manual;
    } else {
      date = this.selectionState.selectedDate;
    }

    if (!date) {
      this.settings.loadingData = false;
      return;
    }

    this.settings.loadingData = true;
    const id = this.settings.selectedStartPointLayer.georesourceId;

    const url = this.buildGeoresourceGeoJSONUrl(id, date);

    this.http.get(url).subscribe({
      next: (response) => {
        // this callback will be called asynchronously
        // when the response is available
        const geoJSON = response;

        this.settings.selectedStartPointLayer.geoJSON_reachability = geoJSON;
        this.settings.selectedStartPointLayer.geoJSON = geoJSON;

        this.settings.loadingData = false;
        this.settings.pointSourceConfigured = true;
      },
      error: (error) => {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        this.settings.pointSourceConfigured = false;
        this.settings.loadingData = false;
        console.error(error.statusText);
        this.mapErrorNotificationService.displayMapApplicationError(error);
        this.error = error.statusText;
      },
    });
  }

  /**
   * Starts an isochrone calculation for a single point.
   * @param {number[]} coordinates - An array containing longitude and latitude of the starting point, e.g., [8.123, 51.456].
   * @param {number[]} ranges - An array of numbers representing the isochrone ranges (in meters or minutes, depending on focus).
   * @param {'distance' | 'time'} focus - The focus of the analysis, either 'distance' or 'time'.
   * @param {string} transitMode - The mode of transit, e.g., 'foot-walking', 'driving-car'.
   */
  public async startIsochroneCalculationForPoints(
    coordinates: number[][],
    ranges: number[],
    focus: 'distance' | 'time',
    transitMode: string
  ) {
    // Set required settings for a manual, single-point isochrone calculation
    this.settings.startPointsSource = 'manual';
    this.settings.rangeArray = ranges;
    this.settings.isochroneInput = ranges.join(',');
    this.settings.focus = focus;
    this.settings.transitMode = transitMode;

    const features = coordinates.map((coord, index) => ({
      type: 'Feature',
      properties: { [this.envConfigService.FEATURE_ID_PROPERTY_NAME]: index + 1 },
      geometry: { type: 'Point', coordinates: coord },
    }));

    // Create a GeoJSON FeatureCollection for the starting points
    this.settings.manualStartPoints = {
      type: 'FeatureCollection',
      features: features,
    };

    await this.startIsochroneCalculation(false);
    this.setIsochronesGeoJson(this.currentIsochronesGeoJSON);
  }

  async startIsochroneCalculation(isUsedInReporting) {
    if (!isUsedInReporting) {
      // reporting uses it's own loading overlay, which is controlled there
      this.settings.loadingData = true;
    } else {
      this.broadcastService.broadcast(BroadcastMessage.ReportingIsochronesCalculationStarted);
    }

    this.checkArrayInput();

    this.settings.locationsArray = this.makeLocationsArrayFromStartPoints();

    // SWITCH THE VALUE DEPENDING ON THE LENGTH
    // OF THE LOCATIONS ARRAY
    if (this.settings.locationsArray.length > 1) this.settings.useMultipleStartPoints = true;
    else this.settings.useMultipleStartPoints = false;

    let resultIsochrones;

    if (this.settings.transitMode === 'buffer') {
      resultIsochrones = this.createBuffers();
    } else {
      resultIsochrones = await this.createIsochrones();
    }

    if (isUsedInReporting) {
      // No need to add isochrones to main map.
      // Instead they are returned to reporting modal
      this.broadcastService.broadcast(BroadcastMessage.ReportingIsochronesCalculationFinished, [
        resultIsochrones,
      ]);
      return;
    }

    this.currentIsochronesGeoJSON = resultIsochrones;

    this.broadcastService.broadcast(BroadcastMessage.IsochronesCalculationFinished);

    this.settings.loadingData = false;
  }

  checkArrayInput() {
    this.settings.rangeArray = [];
    const split = this.settings.isochroneInput.split(',');
    let actVal;
    if (split.length > 0) {
      for (const part of split) {
        if (!isNaN(part)) {
          actVal = parseFloat(part);
          if (!isNaN(actVal)) this.settings.rangeArray.push(actVal);
        }
      }
    }

    this.settings.rangeArray.sort(function (a, b) {
      return a - b;
    });
  }

  createBuffers() {
    let resultIsochrones;

    let startingPoints_geoJSON;
    // create Buffers for each input and range definition
    if (this.settings.startPointsSource === 'manual') {
      // establish from drawn points
      startingPoints_geoJSON = jQuery.extend(true, {}, this.settings.manualStartPoints);
    } else {
      // establish from chosen layer
      startingPoints_geoJSON = jQuery.extend(
        true,
        {},
        this.settings.selectedStartPointLayer.geoJSON_reachability
      );
    }

    // range in meters
    for (const range of this.settings.rangeArray) {
      let geoJSON_buffered: any = turf.buffer(
        jQuery.extend(true, {}, startingPoints_geoJSON),
        Number(range) / 1000,
        { units: 'kilometers', steps: 12 }
      );

      if (!geoJSON_buffered?.features) {
        // transform single feature to featureCollection
        geoJSON_buffered = turf.featureCollection([geoJSON_buffered]);
      }

      // add property: value --> range
      if (geoJSON_buffered.features && geoJSON_buffered.features.length > 0) {
        for (const feature of geoJSON_buffered.features) {
          feature.properties.value = range;
        }
      }

      if (!resultIsochrones) {
        resultIsochrones = jQuery.extend(true, {}, geoJSON_buffered);
      } else {
        resultIsochrones.features = resultIsochrones.features.concat(
          jQuery.extend(true, {}, geoJSON_buffered).features
        );
      }
    }

    this.original_nonDissolved_isochrones = jQuery.extend(true, {}, resultIsochrones);
    // sort buffered isochrones before attaching featureIDs as that expects a certain order of the point buffers
    // each point must have consecutive indices and increasing range!
    this.original_nonDissolved_isochrones.features =
      this.original_nonDissolved_isochrones.features.sort((a, b) => this.sortBuffers(a, b));

    // attach metadata/query/range property for feature collection which is used by spatial data processor in indicator statistics computation
    this.original_nonDissolved_isochrones.metadata = {
      query: {
        range: this.settings.rangeArray,
      },
    };

    this.original_nonDissolved_isochrones = this.attachPoiFeatureIDsToIsochrones();

    if (this.settings.dissolveIsochrones) {
      try {
        resultIsochrones = turf.dissolve(resultIsochrones, { propertyName: 'value' });
      } catch (e) {
        console.error('Dissolving Isochrones failed with error: ' + e);
        console.error('Will return undissolved isochrones');
      }
    }

    return resultIsochrones;
  }

  sortBuffers(a, b) {
    if (
      a.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME] ==
      b.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
    ) {
      // sort by ascending range
      if (a.properties['value'] < b.properties['value']) {
        return -1;
      } else if (a.properties['value'] > b.properties['value']) {
        return 1;
      } else {
        return 0;
      }
    }
    if (
      a.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME] <
      b.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
    ) {
      return -1;
    } else if (
      a.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME] >
      b.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
    ) {
      return 1;
    }
    // a must be equal to b
    return 0;
  }

  makeLocationsArrayFromStartPoints() {
    // array of arrays of lon,lat
    this.settings.locationsArray = [];
    this.settings.locationsArrayIdArray = [];

    if (this.settings.startPointsSource === 'manual') {
      // establish from drawn points
      this.settings.manualStartPoints.features.forEach((feature) => {
        this.settings.locationsArray.push(feature.geometry.coordinates);
        this.settings.locationsArrayIdArray.push(
          feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
        );
      });
    } else {
      // establish from chosen layer
      this.settings.selectedStartPointLayer.geoJSON_reachability.features.forEach((feature) => {
        this.settings.locationsArray.push(feature.geometry.coordinates);
        this.settings.locationsArrayIdArray.push(
          feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
        );
      });
    }

    return this.settings.locationsArray;
  }

  async createIsochrones() {
    let resultIsochrones;

    console.log(
      'Calculating isochrones for ' + this.settings.locationsArray.length + ' start points.'
    );

    const maxLocationsForORSRequest = 150;

    let featureIndex = 0;
    // log progress for each 10% of features
    const logProgressIndexSeparator = Math.round((this.settings.locationsArray.length / 100) * 10);

    let countFeatures = 0;
    let tempStartPointsArray: any[] = [];
    for (let pointIndex = 0; pointIndex < this.settings.locationsArray.length; pointIndex++) {
      tempStartPointsArray.push(this.settings.locationsArray[pointIndex]);
      countFeatures++;

      // if maxNumber of locations is reached or the last starting point is reached
      if (
        countFeatures === maxLocationsForORSRequest ||
        pointIndex === this.settings.locationsArray.length - 1
      ) {
        // make request, collect results

        // responses will be GeoJSON FeatureCollections
        let tempIsochrones: any;
        await this.fetchIsochrones(tempStartPointsArray).then((value) => {
          tempIsochrones = value;
        });

        if (!resultIsochrones) {
          resultIsochrones = tempIsochrones;
        } else {
          // apend results of tempIsochrones to resultIsochrones
          resultIsochrones.features = resultIsochrones.features.concat(tempIsochrones.features);
        }
        // increment featureIndex
        featureIndex++;
        if (featureIndex % logProgressIndexSeparator === 0) {
          console.log(
            "PROGRESS: Computed isochrones for '" +
              featureIndex +
              "' of total '" +
              this.settings.locationsArray.length +
              "' starting points."
          );
        }

        // reset temp vars
        tempStartPointsArray = [];
        countFeatures = 0;
      } // end if
    } // end for

    this.original_nonDissolved_isochrones = resultIsochrones;
    this.original_nonDissolved_isochrones = this.attachPoiFeatureIDsToIsochrones();

    if (this.settings.dissolveIsochrones) {
      try {
        const dissolved = turf.dissolve(resultIsochrones, { propertyName: 'value' });

        return dissolved;
      } catch (e) {
        console.error('Dissolving Isochrones failed with error: ' + e);
        console.error('Will return undissolved isochrones');
        //return response.data;
      }
    }

    return resultIsochrones;
  }

  fetchIsochrones(tempStartPointsArray) {
    const body = this.createORSIsochroneRequestBody(tempStartPointsArray, this.settings.rangeArray);

    const url =
      this.envConfigService.targetUrlToReachabilityService_ORS +
      '/v2/isochrones/' +
      this.settings.transitMode;

    const req = {
      method: 'POST',
      url: url,
      data: body,
      headers: {
        // 'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    return new Promise((resolve, reject) => {
      this.http.post(url, req.data, { headers: req.headers }).subscribe({
        next: (response) => {
          resolve(response);
        },
        error: (error) => {
          console.error(error.data.error.message);
          this.error = error.data.error.message;
          this.settings.loadingData = false;
          this.mapErrorNotificationService.displayMapApplicationError(error);
          reject();
        },
      });
    });
  }

  createORSIsochroneRequestBody(locationsArray, rangeArray) {
    const body: any = {
      locations: [],
      range: [],
      attributes: ['reachfactor', 'area'],
      location_type: 'start',
      range_type: this.settings.focus,
      smoothing: 0,
      area_units: 'km',
      units: 'm',
    };

    for (const location of locationsArray) {
      // element looks like
      // [longitude,latitude]
      const point = [location[0], location[1]];
      body.locations.push(point);
    }

    for (let cValue of rangeArray) {
      // CALCULATE SECONDS FROM MINUTE VALUES IF TIME-ANALYSIS IS WANTED
      if (this.settings.focus == 'time') {
        cValue = cValue * 60;
      }

      body.range.push(cValue);
    }

    return body;
  }

  /*
    attaches the featureID of starting points to corresponding result isochrones
    using
    featureID_rangeValue
    i.e.
    1_300 --> may stand for featureID = 1 and rangeValue = 300
  */
  attachPoiFeatureIDsToIsochrones() {
    // the order of isochrone features following rules:
    // for two starting points an three ranges
    // the first starting point is on index 0,1,2 with increasing range value
    // then index 3,4,5 will represent the second point for each increasing range
    let locationsArrayIdIndex = 0;
    for (
      let isochroneIndex = 0;
      isochroneIndex < this.original_nonDissolved_isochrones.features.length;
      isochroneIndex++
    ) {
      for (let rangeIndex = 0; rangeIndex < this.settings.rangeArray.length; rangeIndex++) {
        const rangeValue = this.settings.rangeArray[rangeIndex];

        const resultIsochrone = this.original_nonDissolved_isochrones.features[isochroneIndex];
        resultIsochrone.properties.ID =
          this.settings.locationsArrayIdArray[locationsArrayIdIndex] + '_' + rangeValue;
        this.original_nonDissolved_isochrones.features[isochroneIndex] = resultIsochrone;

        // for multiple ranges we must increment the isochrone index in this inner loop
        // but not if the last range value has been processed
        if (rangeIndex != this.settings.rangeArray.length - 1) {
          isochroneIndex++;
        }
      }
      // now increment locationArrayIDIndex as now the point for each range has been processed
      locationsArrayIdIndex++;
    }

    return this.original_nonDissolved_isochrones;
  }
}
