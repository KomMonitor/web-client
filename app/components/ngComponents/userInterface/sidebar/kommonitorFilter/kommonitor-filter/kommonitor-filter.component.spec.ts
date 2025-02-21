import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KommonitorFilterComponent } from './kommonitor-filter.component';

describe('KommonitorFilterComponent', () => {
  let component: KommonitorFilterComponent;
  let fixture: ComponentFixture<KommonitorFilterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KommonitorFilterComponent]
    });
    fixture = TestBed.createComponent(KommonitorFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
