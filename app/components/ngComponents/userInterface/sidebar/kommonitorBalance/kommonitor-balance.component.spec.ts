import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { KommonitorBalanceComponent } from './kommonitor-balance.component';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';

describe('KommonitorBalanceComponent', () => {
  let component: KommonitorBalanceComponent;
  let fixture: ComponentFixture<KommonitorBalanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KommonitorBalanceComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(KommonitorBalanceComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('builds its slider on the element from its own template', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#rangeSlider').noUiSlider).toBeDefined();
  });

  it('stops listening to broadcasts once destroyed', () => {
    fixture.detectChanges();
    const broadcastService = TestBed.inject(BroadcastService);
    const disableBalance = jest
      .spyOn(component, 'disableBalance')
      .mockImplementation(() => undefined);

    broadcastService.broadcast(BroadcastMessage.DisableBalance);
    expect(disableBalance).toHaveBeenCalledTimes(1);

    fixture.destroy();
    broadcastService.broadcast(BroadcastMessage.DisableBalance);
    expect(disableBalance).toHaveBeenCalledTimes(1);
  });
});
