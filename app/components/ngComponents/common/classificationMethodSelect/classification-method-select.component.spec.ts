import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassificationMethodSelectComponent } from './classification-method-select.component';

describe('ClassificationMethodSelectComponent', () => {
  let component: ClassificationMethodSelectComponent;
  let fixture: ComponentFixture<ClassificationMethodSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ClassificationMethodSelectComponent]
    });
    fixture = TestBed.createComponent(ClassificationMethodSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
