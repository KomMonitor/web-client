import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KommonitorDataSetupComponent } from './kommonitor-data-setup.component';

describe('KommonitorDataSetupComponent', () => {
  let component: KommonitorDataSetupComponent;
  let fixture: ComponentFixture<KommonitorDataSetupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KommonitorDataSetupComponent]
    });
    fixture = TestBed.createComponent(KommonitorDataSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
