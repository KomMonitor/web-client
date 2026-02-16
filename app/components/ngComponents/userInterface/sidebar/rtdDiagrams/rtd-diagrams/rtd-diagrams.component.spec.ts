import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RtdDiagramsComponent } from './rtd-diagrams.component';

describe('RtdDiagramsComponent', () => {
  let component: RtdDiagramsComponent;
  let fixture: ComponentFixture<RtdDiagramsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RtdDiagramsComponent]
    });
    fixture = TestBed.createComponent(RtdDiagramsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
