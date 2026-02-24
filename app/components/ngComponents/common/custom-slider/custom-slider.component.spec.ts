import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomSliderComponent } from './custom-slider/custom-slider.component';

describe('CustomSliderComponent', () => {
  let component: CustomSliderComponent;
  let fixture: ComponentFixture<CustomSliderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomSliderComponent]
    });
    fixture = TestBed.createComponent(CustomSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
