import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WmsAddModalComponent } from './wms-add-modal.component';

describe('WmsAddModalComponent', () => {
  let component: WmsAddModalComponent;
  let fixture: ComponentFixture<WmsAddModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WmsAddModalComponent]
    });
    fixture = TestBed.createComponent(WmsAddModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
