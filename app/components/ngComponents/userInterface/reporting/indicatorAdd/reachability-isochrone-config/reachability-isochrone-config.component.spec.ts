import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ReachabilityIsochroneConfigComponent } from './reachability-isochrone-config.component';

describe('ReachabilityIsochroneConfigComponent', () => {
  let component: ReachabilityIsochroneConfigComponent;
  let fixture: ComponentFixture<ReachabilityIsochroneConfigComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReachabilityIsochroneConfigComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ReachabilityIsochroneConfigComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not recalculate before a POI layer is selected', () => {
    const spy = jest.spyOn(component['reachabilityStateService'], 'startIsochroneCalculation');

    component.changeType('driving-car');

    expect(spy).not.toHaveBeenCalled();
  });

  it('recalculates in reporting mode once a POI layer is selected', () => {
    component['reachabilityStateService'].settings.selectedStartPointLayer = {
      geoJSON_reachability: { type: 'FeatureCollection', features: [] },
    };
    const spy = jest
      .spyOn(component['reachabilityStateService'], 'startIsochroneCalculation')
      .mockResolvedValue();

    component.changeType('cycling-regular');

    expect(component['reachabilityStateService'].settings.transitMode).toBe('cycling-regular');
    expect(spy).toHaveBeenCalledWith(true);
  });
});
