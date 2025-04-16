import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpatialUnitNotificationModalComponent } from './spatial-unit-notification-modal.component';

describe('SpatialUnitNotificationModalComponent', () => {
  let component: SpatialUnitNotificationModalComponent;
  let fixture: ComponentFixture<SpatialUnitNotificationModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SpatialUnitNotificationModalComponent]
    });
    fixture = TestBed.createComponent(SpatialUnitNotificationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
