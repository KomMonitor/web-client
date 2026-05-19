import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';

export interface ReachabiltySettings {
  ranges: number[];
  focus: ReachbilityFocusTypes;
  transitMode: ReachabilityTransitModeTypes;
}

export type ReachabilityTransitModeTypes = 'buffer' | 'foot-walking' | 'cycling-regular' | 'driving-car' | 'wheelchair';

export type ReachbilityFocusTypes = 'distance' | 'time';

export interface ReachbilityModel {
  location: ReachabilityLocation;
  isochronesGeoJson?: any;
}

export interface ReachabilityLocation {
  coordinates: {
    x: number;
    y: number;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReachabilityCombinerService {
    
  settings:ReachabiltySettings = {
    ranges: [100,200,300,400,500],
    focus: 'distance',
    transitMode: 'buffer'
  }

  private reachabilityMapSubject = new BehaviorSubject<ReachbilityModel>({
    location: {
      coordinates: {
        x: 0,
        y: 0
      }
    },
    isochronesGeoJson: null
  });

  reachabilityMapSubject$ = this.reachabilityMapSubject.asObservable();

  constructor(
    private reachabilityHelperService: ReachabilityHelperService
  ) {}

  setLocation(location: ReachabilityLocation) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      location
    });
  }
  
  setIsochronesGeoJson(isochronesGeoJson: any) {
    this.reachabilityMapSubject.next({
      ...this.reachabilityMapSubject.value,
      isochronesGeoJson
    });
  }

  startQuickCalculation() {

    if(this.reachabilityMapSubject.value?.location.coordinates.x && this.reachabilityMapSubject.value?.location.coordinates.y) {
      this.reachabilityHelperService.startIsochroneCalculationForSinglePoint(
        [this.reachabilityMapSubject.value?.location.coordinates.x, this.reachabilityMapSubject.value?.location.coordinates.y],
        this.settings.ranges,
        this.settings.focus,
        this.settings.transitMode
      );
    }
  }
}
