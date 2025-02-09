import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KommonitorClassificationComponent } from './kommonitor-classification.component';

describe('KommonitorClassificationComponent', () => {
  let component: KommonitorClassificationComponent;
  let fixture: ComponentFixture<KommonitorClassificationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KommonitorClassificationComponent]
    });
    fixture = TestBed.createComponent(KommonitorClassificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
