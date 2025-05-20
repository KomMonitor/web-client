import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleFeatureEditComponent } from './single-feature-edit.component';

describe('SingleFeatureEditComponent', () => {
  let component: SingleFeatureEditComponent;
  let fixture: ComponentFixture<SingleFeatureEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SingleFeatureEditComponent]
    });
    fixture = TestBed.createComponent(SingleFeatureEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
