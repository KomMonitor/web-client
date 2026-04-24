import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WmsDeleteModalComponent } from './wms-delete-modal.component';

describe('WmsDeleteModalComponent', () => {
  let component: WmsDeleteModalComponent;
  let fixture: ComponentFixture<WmsDeleteModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WmsDeleteModalComponent]
    });
    fixture = TestBed.createComponent(WmsDeleteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
