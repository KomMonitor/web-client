import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegressionDiagramComponent } from './regression-diagram.component';

describe('RegressionDiagramComponent', () => {
  let component: RegressionDiagramComponent;
  let fixture: ComponentFixture<RegressionDiagramComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegressionDiagramComponent]
    });
    fixture = TestBed.createComponent(RegressionDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
