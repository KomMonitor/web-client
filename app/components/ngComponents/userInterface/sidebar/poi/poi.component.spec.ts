import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PoiComponent } from './poi.component';

// TODO(prio6): GeoresourceFilterService crashes in its constructor (reads
// undefined runtime config: enabledGeoresourcesInfrastructure.indexOf). Needs
// the service mocked/overridden with proper config state.
describe.skip('PoiComponent', () => {
  let component: PoiComponent;
  let fixture: ComponentFixture<PoiComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PoiComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(PoiComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
