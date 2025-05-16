import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KommonitorReachabilityComponent } from './kommonitor-reachability.component';

describe('KommonitorReachabilityComponent', () => {
  let component: KommonitorReachabilityComponent;
  let fixture: ComponentFixture<KommonitorReachabilityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KommonitorReachabilityComponent]
    });
    fixture = TestBed.createComponent(KommonitorReachabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
