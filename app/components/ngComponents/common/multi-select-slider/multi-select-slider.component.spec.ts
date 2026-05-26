import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiSelectSliderComponent } from './multi-select-slider.component';

describe('MultiSelectSliderComponent', () => {
  let component: MultiSelectSliderComponent;
  let fixture: ComponentFixture<MultiSelectSliderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MultiSelectSliderComponent]
    });
    fixture = TestBed.createComponent(MultiSelectSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
