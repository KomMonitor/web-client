import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';
import * as L from 'leaflet';

export interface ReachabiltySettings {
  ranges: number[];
  focus: ReachbilityFocusTypes;
  transitMode: ReachabilityTransitModeTypes;
}

export type ReachabilityTransitModeTypes = 'buffer' | 'foot-walking' | 'cycling-regular' | 'driving-car' | 'wheelchair';

export type ReachbilityFocusTypes = 'distance' | 'time';

export interface ReachbilityModel {
  locations?: ReachabilityLocation[];
  isochronesGeoJson?: any;
}

export interface ReachabilityLocation {
  coordinates: {
    lat: number;
    lng: number;
  },
  label?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReachabilityCombinerService {

  // mode to select a point on the map, for quick reachability calc
  manualMapSelectionMode = false;

  settings:ReachabiltySettings = {
    ranges: [100,200,300,400,500],
    focus: 'distance',
    transitMode: 'buffer'
  }

  private reachabilityMapSubject = new BehaviorSubject<ReachbilityModel>({
    locations: [],
    isochronesGeoJson: null
  });

  reachabilityMapSubject$ = this.reachabilityMapSubject.asObservable();

  constructor(
    private reachabilityHelperService: ReachabilityHelperService
  ) {}

  get locations():ReachabilityLocation[] {
    if(this.reachabilityMapSubject.value.locations)
      return this.reachabilityMapSubject.value.locations;
    else
      return [];
  }

  async addLocation(location: ReachabilityLocation, manualSel:boolean = false) {

    let current = this.reachabilityMapSubject.value.locations;
    current?.push(location);

    if(current) {

      if(manualSel) {
        let label = await this.locationLookup(location);
        location.label = label;
      }

      this.reachabilityMapSubject.next({
        ...this.reachabilityMapSubject.value,
        locations: current
      });
    }
  }

  resetLocations() {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      locations: [],
      isochronesGeoJson: null
    });
  }

  deleteLocation(location: ReachabilityLocation) {
    
    const current = this.reachabilityMapSubject.value.locations?.filter(loc => loc !== location);

    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      locations: current
    });

    this.startQuickCalculation();
  }
  
  setIsochronesGeoJson(isochronesGeoJson: any) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      isochronesGeoJson
    });
  }

  startQuickCalculation() {

    if(this.reachabilityMapSubject.value.locations && this.reachabilityMapSubject.value.locations.length > 0) {
      const coordinatesArray: number[][] = this.reachabilityMapSubject.value.locations.map(location => [location.coordinates.lng, location.coordinates.lat]);

      this.reachabilityHelperService.startIsochroneCalculationForPoints(
        coordinatesArray,
        this.settings.ranges,
        this.settings.focus,
        this.settings.transitMode
      );
    }
  }

  async locationLookup(e: ReachabilityLocation) {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${e.coordinates.lat}&lon=${e.coordinates.lng}&format=json`
      );
    const data = await res.json();
    return `${data.address.road} ${data.address.house_number}, ${data.address.postcode} ${data.address.city || data.address.city_district || data.address.town || data.address.village}`  || 'Unbekannt'; 
  }
}
