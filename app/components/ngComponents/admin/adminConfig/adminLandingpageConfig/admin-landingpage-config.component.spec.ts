import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLandingpageConfigComponent } from './admin-landingpage-config.component';

describe('AdminLandingpageConfigComponent', () => {
  let component: AdminLandingpageConfigComponent;
  let fixture: ComponentFixture<AdminLandingpageConfigComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminLandingpageConfigComponent]
    });
    fixture = TestBed.createComponent(AdminLandingpageConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
