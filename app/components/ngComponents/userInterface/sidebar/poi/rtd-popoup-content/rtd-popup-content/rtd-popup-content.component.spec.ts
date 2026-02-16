import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RtdPopupContentComponent } from './rtd-popup-content.component';

describe('RtdPopupContentComponent', () => {
  let component: RtdPopupContentComponent;
  let fixture: ComponentFixture<RtdPopupContentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RtdPopupContentComponent]
    });
    fixture = TestBed.createComponent(RtdPopupContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
