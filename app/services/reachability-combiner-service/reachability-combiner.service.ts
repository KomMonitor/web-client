import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';
import * as L from 'leaflet';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MetadataLoadingState } from 'services/data-exchange-service/data-exchange.constants';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { HttpClient } from '@angular/common/http';

export interface ReachabiltySettings {
  ranges: number[];
  focus: ReachbilityFocusTypes;
  focusUnit: string;
  transitMode: ReachabilityTransitModeTypes;
}

export type ReachabilityTransitModeTypes = 'buffer' | 'foot-walking' | 'cycling-regular' | 'driving-car' | 'wheelchair';

export type ReachbilityFocusTypes = 'distance' | 'time';

export interface ReachbilityModel {
  features?: GeoJSONFeature[];
  isochronesGeoJson?: any;
  selectedStartPointLayer?: any;
  selectedStartDate?: string;
  loadingState: boolean;
}

export interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  },
  properties?: {
    [key: string]: any;
  };
  id?: string | number;
  bbox?: number[];
  label?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReachabilityCombinerService {

  private readonly destroyRef = inject(DestroyRef);
  
  // mode to select a point on the map, for quick reachability calc
  manualMapSelectionMode = false;

  defaults = {
    distanceRanges: [100,200,300,400,500],
    timeRanges: [5,10,15]
  }

  settings:ReachabiltySettings = {
    ranges: this.defaults.distanceRanges,
    focus: 'distance',
    focusUnit: 'm',
    transitMode: 'foot-walking'
  }

  private reachabilityMapSubject = new BehaviorSubject<ReachbilityModel>({
    features: [],
    isochronesGeoJson: null,
    loadingState: false
  });

  reachabilityMapSubject$ = this.reachabilityMapSubject.asObservable();

  filteredDisplayableGeoresources:any[] = [];
  filteredAvailablePeriodsOfValidity:any = [];

  startPointLayer!: GeoresourcesDataset;

  constructor(
    private reachabilityHelperService: ReachabilityHelperService,
    private dataExchangeService: DataExchangeService,
    private http: HttpClient
  ) {

    this.dataExchangeService.metadataLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if(value==MetadataLoadingState.COMPLETE)  
          this.filteredDisplayableGeoresources = this.dataExchangeService.displayableGeoresources.filter(e => e.isPOI);
      });
  }

  get locations():GeoJSONFeature[] {
    if(this.reachabilityMapSubject.value.features)
      return this.reachabilityMapSubject.value.features;
    else
      return [];
  }

  get selectedStartDate():any {
    return this.reachabilityMapSubject.value.selectedStartDate; 
  }

  set selectedStartDate(layer: any) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      selectedStartDate: layer
    });
  }

  get selectedStartPointLayer():any {
    return this.reachabilityMapSubject.value.selectedStartPointLayer; 
  }
  
  get loadingState():boolean {
    return this.reachabilityMapSubject.value.loadingState; 
  }

  set selectedStartPointLayer(layer: any) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      selectedStartPointLayer: layer
    });
  }

  async addLocation(location: GeoJSONFeature, manualSel:boolean = false) {

    let current = this.reachabilityMapSubject.value.features;
    current?.push(location);

    if(current) {

      if(manualSel) {
        let label = await this.locationLookup(location);
        location.label = label;
      }

      this.reachabilityMapSubject.next({
        ...this.reachabilityMapSubject.value,
        features: current
      });
    }
  }

  resetLocations() {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      features: [],
      isochronesGeoJson: null
    });
  }

  deleteLocation(location: GeoJSONFeature) {
    
    const current = this.reachabilityMapSubject.value.features?.filter(loc => loc !== location);

    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      features: current
    });

    this.startQuickCalculation();
  }
  
  setIsochronesGeoJson(isochronesGeoJson: any) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      isochronesGeoJson
    });
  }

  setLoadingState(state:boolean) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      loadingState: state
    });
  }

  async startQuickCalculation() {

    if(this.reachabilityMapSubject.value.features && this.reachabilityMapSubject.value.features.length > 0) {

      this.setLoadingState(true);

      const coordinatesArray: any = this.reachabilityMapSubject.value.features.map(location => [location.geometry.coordinates[0], location.geometry.coordinates[1]]);

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
    return `${data.address.road} ${data.address.house_number}, ${data.address.postcode} ${data.address.city || data.address.city_district || data.address.town || data.address.village}`  || 'Unbekannt'; 
  }

  prepAvailablePeriods() {

    let tempDates:any[] = [];
    this.filteredAvailablePeriodsOfValidity = this.selectedStartPointLayer.availablePeriodsOfValidity?.filter(e => {
      
      if(!tempDates.includes(e.startDate)) {
        tempDates.push(e.startDate);
        return true;
      }

      return false;
    }).sort((a,b) => { 
      if(a>b)
        return -1;
      else  
        return 1;
    });
  }

  onChangePoiResource() {
    this.prepAvailablePeriods(); 
  }

  fetchPoiResourceGeoJSON() {
    var dateComps = this.selectedStartDate.split("-");

    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    // fetch from management API
    let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + this.selectedStartPointLayer.georesourceId + "/" + year + "/" + month + "/" + day;
    this.http.get(url).subscribe({
      next: (response:any) => {

        this.reachabilityMapSubject.next({
          ...this.reachabilityMapSubject.value,
          features: response.features
        });
        /* this.reachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability = response;
        this.reachabilityHelperService.settings.selectedStartPointLayer.geoJSON = response; */
      },
      error: error => {
        console.log(error)
      }
    });
  }

  setTransitMode(mode:ReachabilityTransitModeTypes) {
    this.settings.transitMode = mode;
    this.startQuickCalculation();
  }
  

  setFocusMode(mode:ReachbilityFocusTypes) {
    this.settings.focus = mode;

    if(mode == 'distance') {
      this.settings.ranges = this.defaults.distanceRanges;
      this.settings.focusUnit = 'm';
    } else {
      this.settings.ranges = this.defaults.timeRanges;
      this.settings.focusUnit = 'min';
    }

    this.startQuickCalculation();
  }
}
