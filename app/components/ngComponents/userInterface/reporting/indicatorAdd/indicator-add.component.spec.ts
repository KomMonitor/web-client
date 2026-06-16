import { ComponentFixture, TestBed } from '@angular/core/testing';

// TODO(prio6): module-load fails in jsdom - canvas getContext not implemented and ESM
// parse error from a transitive dependency. Import the component as a type only so the
// failing module is never evaluated.
import type { IndicatorAddComponent } from './indicator-add.component';

describe.skip('IndicatorAddComponent', () => {
  let component: IndicatorAddComponent;
  let fixture: ComponentFixture<IndicatorAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent<IndicatorAddComponent>(null as any);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
