import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsocDemoComponent } from './gsoc-demo.component';

describe('GsocDemoComponent', () => {
  let component: GsocDemoComponent;
  let fixture: ComponentFixture<GsocDemoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GsocDemoComponent]
    });
    fixture = TestBed.createComponent(GsocDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
