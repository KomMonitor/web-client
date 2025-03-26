import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndicatorRadarComponent } from './indicator-radar.component';

describe('IndicatorRadarComponent', () => {
  let component: IndicatorRadarComponent;
  let fixture: ComponentFixture<IndicatorRadarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IndicatorRadarComponent]
    });
    fixture = TestBed.createComponent(IndicatorRadarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
