import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WmsAdminTableComponent } from './wms-admin-table.component';

describe('WmsAdminTableComponent', () => {
  let component: WmsAdminTableComponent;
  let fixture: ComponentFixture<WmsAdminTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WmsAdminTableComponent]
    });
    fixture = TestBed.createComponent(WmsAdminTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
