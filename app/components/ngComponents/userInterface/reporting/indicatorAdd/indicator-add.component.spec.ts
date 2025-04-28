import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndicatorAddComponent } from './indicator-add.component';

describe('IndicatorAddComponent', () => {
  let component: IndicatorAddComponent;
  let fixture: ComponentFixture<IndicatorAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IndicatorAddComponent]
    });
    fixture = TestBed.createComponent(IndicatorAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
