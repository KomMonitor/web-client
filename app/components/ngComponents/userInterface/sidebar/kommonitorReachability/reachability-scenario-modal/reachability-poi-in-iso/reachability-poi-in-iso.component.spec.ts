import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReachabilityPoiInIsoComponent } from './reachability-poi-in-iso.component';

describe('ReachabilityPoiInIsoComponent', () => {
  let component: ReachabilityPoiInIsoComponent;
  let fixture: ComponentFixture<ReachabilityPoiInIsoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReachabilityPoiInIsoComponent]
    });
    fixture = TestBed.createComponent(ReachabilityPoiInIsoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
