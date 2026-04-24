import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WmsEditModalComponent } from './wms-edit-modal.component';

describe('WmsEditModalComponent', () => {
  let component: WmsEditModalComponent;
  let fixture: ComponentFixture<WmsEditModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WmsEditModalComponent]
    });
    fixture = TestBed.createComponent(WmsEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
