import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndicatorMetadataTooltipComponent } from './indicator-metadata-tooltip.component';

describe('IndicatorMetadataTooltipComponent', () => {
  let component: IndicatorMetadataTooltipComponent;
  let fixture: ComponentFixture<IndicatorMetadataTooltipComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IndicatorMetadataTooltipComponent]
    });
    fixture = TestBed.createComponent(IndicatorMetadataTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
