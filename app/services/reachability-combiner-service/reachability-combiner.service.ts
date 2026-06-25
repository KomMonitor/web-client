import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MetadataLoadingState } from 'services/data-exchange-service/data-exchange.constants';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { HttpClient } from '@angular/common/http';
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';
import uuidv4 from '../../../customizedExternalLibs/uuidv4.js';

export interface ReachabiltySettings {
  ranges: number[];
  focus: ReachbilityFocusTypes;
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

export type ReachbilityFocusTypes = 'distance' | 'time';

export interface ReachbilityModel {
  scenarioTitle?: string;
  features?: GeoJSONFeature[];
  isochronesGeoJson?: any;
  selectedStartPointLayer?: any;
  selectedStartDate?: string;
  loadingState: boolean;
  scenarioState?: boolean;
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

@Injectable({
  providedIn: 'root',
})
export class ReachabilityCombinerService {
  private reachabilityHelperService = inject(ReachabilityHelperService);
  private dataExchangeService = inject(DataExchangeService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private http = inject(HttpClient);
  private reachabilityScenarioHelperService = inject(ReachabilityScenarioHelperService);
  private envConfigService = inject(EnvConfigService);

  private readonly destroyRef = inject(DestroyRef);

  // mode to select a point on the map, for quick reachability calc
  manualMapSelectionMode = false;

  defaults = {
    distanceRanges: [100, 200, 300, 400, 500],
    timeRanges: [5, 10, 15],
  };

  settings: ReachabiltySettings = {
    ranges: this.defaults.distanceRanges,
    focus: 'distance',
    focusUnit: 'm',
    transitMode: 'foot-walking',
    startPointsSource: 'manual',
  };

  private reachabilityMapSubject = new BehaviorSubject<ReachbilityModel>({
    features: [],
    isochronesGeoJson: null,
    loadingState: false,
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

  set startPointsSource(type: string) {
    this.settings.startPointsSource = type;
  }

  get startPointsSource() {
    return this.settings.startPointsSource;
  }

  get scenarioTitle(): string {
    return this.reachabilityMapSubject.value.scenarioTitle!;
  }

  set scenarioTitle(title: string) {
    this.reachabilityMapSubject.value.scenarioTitle = title;
    this.reachabilityScenarioHelperService.tmpActiveScenario.scenarioName = title;
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

  set selectedStartDate(layer: any) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      selectedStartDate: layer,
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

  reset() {
    this.reachabilityMapSubject.value.scenarioTitle = undefined;
    this.reachabilityMapSubject.value.features = undefined;
    this.reachabilityMapSubject.value.isochronesGeoJson = undefined;
    this.reachabilityMapSubject.value.selectedStartPointLayer = undefined;
    this.reachabilityMapSubject.value.selectedStartDate = undefined;
    this.reachabilityMapSubject.value.loadingState = false;
    this.reachabilityMapSubject.value.scenarioState = false;
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

      await this.reachabilityHelperService.startIsochroneCalculationForPoints(
        coordinatesArray,
        this.settings.ranges,
        this.settings.focus,
        this.settings.transitMode
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

  fetchPoiResourceGeoJSON(globalModel = true) {
    const dateComps = this.selectedStartDate.split('-');

    const year = dateComps[0];
    const month = dateComps[1];
    const day = dateComps[2];

    // fetch from management API
    const url =
      this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
      '/georesources/' +
      this.selectedStartPointLayer.georesourceId +
      '/' +
      year +
      '/' +
      month +
      '/' +
      day;
    this.http.get(url).subscribe({
      next: (response: any) => {
        if (globalModel)
          this.reachabilityMapSubject.next({
            ...this.reachabilityMapSubject.value,
            features: response.features,
          });
        else {
          this.reachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability =
            response;
          this.reachabilityHelperService.settings.selectedStartPointLayer.geoJSON = response;
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  setTransitMode(mode: ReachabilityTransitModeTypes) {
    this.settings.transitMode = mode;
    this.startQuickCalculation();
  }

  setFocusMode(mode: ReachbilityFocusTypes) {
    this.settings.focus = mode;

    if (mode == 'distance') {
      this.settings.ranges = this.defaults.distanceRanges;
      this.settings.focusUnit = 'm';
    } else {
      this.settings.ranges = this.defaults.timeRanges;
      this.settings.focusUnit = 'min';
    }

    this.startQuickCalculation();
  }
}
