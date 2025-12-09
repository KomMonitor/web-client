import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminFilterEditModalComponent } from './admin-filter-edit-modal.component';

describe('AdminFilterEditModalComponent', () => {
  let component: AdminFilterEditModalComponent;
  let fixture: ComponentFixture<AdminFilterEditModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminFilterEditModalComponent]
    });
    fixture = TestBed.createComponent(AdminFilterEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
