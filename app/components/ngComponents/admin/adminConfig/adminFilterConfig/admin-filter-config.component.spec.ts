import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminFilterConfigComponent } from './admin-filter-config.component';

describe('AdminFilterConfigComponent', () => {
  let component: AdminFilterConfigComponent;
  let fixture: ComponentFixture<AdminFilterConfigComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminFilterConfigComponent]
    });
    fixture = TestBed.createComponent(AdminFilterConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
