import { TestBed } from '@angular/core/testing';

import { MapErrorNotificationService } from './map-error-notification.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

describe('MapErrorNotificationService', () => {
  let service: MapErrorNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: IndicatorValueService, useValue: { syntaxHighlightJSON: (v: any) => v } },
        { provide: BroadcastService, useValue: { broadcast: jest.fn() } },
      ],
    });
    service = TestBed.inject(MapErrorNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
