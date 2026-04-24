import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WmsEditUserRolesModalComponent } from './wms-edit-user-roles-modal.component';

describe('WmsEditUserRolesModalComponent', () => {
  let component: WmsEditUserRolesModalComponent;
  let fixture: ComponentFixture<WmsEditUserRolesModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WmsEditUserRolesModalComponent]
    });
    fixture = TestBed.createComponent(WmsEditUserRolesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
