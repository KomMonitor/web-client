import { TestBed } from '@angular/core/testing';
import { driver } from 'driver.js';
import { TranslateService } from '@ngx-translate/core';
import { GuidedTourService } from './guided-tour.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

jest.mock('driver.js', () => ({
  driver: jest.fn(),
}));

describe('GuidedTourService', () => {
  let service: GuidedTourService;
  const driverMock = driver as jest.Mock;
  let fakeDriverObj: { drive: jest.Mock; destroy: jest.Mock };

  beforeEach(() => {
    localStorage.clear();
    driverMock.mockReset();
    fakeDriverObj = { drive: jest.fn(), destroy: jest.fn() };
    driverMock.mockReturnValue(fakeDriverObj);

    TestBed.configureTestingModule({
      providers: [
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
        { provide: EnvConfigService, useValue: { localStoragePrefix: 'spec' } },
      ],
    });
    service = TestBed.inject(GuidedTourService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('start() builds all 12 steps with translated title/description and drives the tour', () => {
    service.start();

    expect(driverMock).toHaveBeenCalledTimes(1);
    const config = driverMock.mock.calls[0][0];
    expect(config.steps).toHaveLength(12);
    expect(config.steps[0]).toMatchObject({
      data: { id: 'welcome' },
      popover: {
        title: 'GUIDED_TOUR_STEPS.WELCOME.TITLE',
        description: 'GUIDED_TOUR_STEPS.WELCOME.CONTENT_HTML',
      },
    });
    expect(config.steps[1]).toMatchObject({ element: '#header', data: { id: 'header' } });
    expect(config.steps[3]).toMatchObject({
      element: '#sideBarButtons',
      data: { id: 'sidebar' },
      popover: {
        title: 'GUIDED_TOUR_STEPS.SIDEBAR.TITLE',
        description: 'GUIDED_TOUR_STEPS.SIDEBAR.CONTENT_HTML',
      },
    });
    expect(config.steps[4]).toMatchObject({
      element: '#mapUtilButtons',
      data: { id: 'map-toolbar' },
      popover: {
        title: 'GUIDED_TOUR_STEPS.MAP_TOOLBAR.TITLE',
        description: 'GUIDED_TOUR_STEPS.MAP_TOOLBAR.CONTENT_HTML',
      },
    });
    expect(fakeDriverObj.drive).toHaveBeenCalled();
    expect(service.isActive()).toBe(true);
  });

  it('onHighlightStarted updates activeStepId as steps change', () => {
    service.start();
    const config = driverMock.mock.calls[0][0];

    config.onHighlightStarted(undefined, { data: { id: 'map' } });
    expect(service.activeStepId()).toBe('map');

    config.onHighlightStarted(undefined, { data: { id: 'legend-export' } });
    expect(service.activeStepId()).toBe('legend-export');
  });

  it('onDestroyed resets state and marks the tour as seen', () => {
    expect(service.hasSeenTour()).toBe(false);

    service.start();
    const config = driverMock.mock.calls[0][0];
    config.onHighlightStarted(undefined, { data: { id: 'map' } });

    config.onDestroyed();

    expect(service.isActive()).toBe(false);
    expect(service.activeStepId()).toBeNull();
    expect(service.hasSeenTour()).toBe(true);
  });

  it('end() destroys the underlying driver instance', () => {
    service.start();
    service.end();
    expect(fakeDriverObj.destroy).toHaveBeenCalled();
  });

  it('markTourSeen()/hasSeenTour() round-trip through localStorage with the env prefix', () => {
    expect(service.hasSeenTour()).toBe(false);
    service.markTourSeen();
    expect(service.hasSeenTour()).toBe(true);
    expect(localStorage.getItem('spec_guidedTourSeen')).toBe('true');
  });
});
