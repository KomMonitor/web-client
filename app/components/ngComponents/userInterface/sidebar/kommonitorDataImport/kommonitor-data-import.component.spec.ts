import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KommonitorDataImportComponent } from './kommonitor-data-import.component';

describe('KommonitorDataImportComponent', () => {
  let component: KommonitorDataImportComponent;
  let fixture: ComponentFixture<KommonitorDataImportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KommonitorDataImportComponent]
    });
    fixture = TestBed.createComponent(KommonitorDataImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
