import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KommonitorBalanceComponent } from './kommonitor-balance.component';

describe('KommonitorBalanceComponent', () => {
  let component: KommonitorBalanceComponent;
  let fixture: ComponentFixture<KommonitorBalanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KommonitorBalanceComponent]
    });
    fixture = TestBed.createComponent(KommonitorBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
