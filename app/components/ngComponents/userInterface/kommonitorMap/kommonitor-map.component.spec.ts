import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KommonitorMapComponent } from './kommonitor-map.component';

describe('KommonitorMapComponent', () => {
  let component: KommonitorMapComponent;
  let fixture: ComponentFixture<KommonitorMapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KommonitorMapComponent]
    });
    fixture = TestBed.createComponent(KommonitorMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
