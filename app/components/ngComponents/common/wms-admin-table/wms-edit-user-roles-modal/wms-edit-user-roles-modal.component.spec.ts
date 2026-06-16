import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { WmsEditUserRolesModalComponent } from './wms-edit-user-roles-modal.component';

describe('WmsEditUserRolesModalComponent', () => {
  let component: WmsEditUserRolesModalComponent;
  let fixture: ComponentFixture<WmsEditUserRolesModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WmsEditUserRolesModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(WmsEditUserRolesModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
