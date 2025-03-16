import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KommonitorDiagramsComponent } from './kommonitor-diagrams.component';

describe('KommonitorDiagramsComponent', () => {
  let component: KommonitorDiagramsComponent;
  let fixture: ComponentFixture<KommonitorDiagramsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KommonitorDiagramsComponent]
    });
    fixture = TestBed.createComponent(KommonitorDiagramsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
