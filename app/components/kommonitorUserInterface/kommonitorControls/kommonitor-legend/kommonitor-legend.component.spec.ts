import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KommonitorLegendComponent } from './kommonitor-legend.component';

describe('KommonitorLegendComponent', () => {
  let component: KommonitorLegendComponent;
  let fixture: ComponentFixture<KommonitorLegendComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KommonitorLegendComponent]
    });
    fixture = TestBed.createComponent(KommonitorLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
