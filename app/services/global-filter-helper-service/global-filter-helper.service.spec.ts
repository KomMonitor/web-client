import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';

import { GlobalFilterHelperService } from './global-filter-helper.service';

@Component({ selector: 'app-dummy', template: '', standalone: true })
class DummyComponent {}

describe('GlobalFilterHelperService', () => {
  let service: GlobalFilterHelperService;
  let router: Router;

  const filterConfig = [
    {
      name: 'klima',
      indicatorTopics: ['topic-1'],
      indicators: [],
      georesourceTopics: [],
      georesources: [],
    },
  ];

  beforeEach(() => {
    (window as any).__env = { ...(window as any).__env, filterConfig };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'app/:filterId', component: DummyComponent },
          { path: '**', component: DummyComponent },
        ]),
      ],
    });
    service = TestBed.inject(GlobalFilterHelperService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('leaves the global filter inactive when no filterId route param is present', async () => {
    await router.navigateByUrl('/');

    service.init();

    expect(service.isFilterParamSet()).toBe(false);
    expect(service.globalFilterApplied()).toBe(false);
    expect(service.applicationFilter).toBeUndefined();
  });

  it('activates the matching global filter from the /app/:filterId route param', async () => {
    await router.navigateByUrl('/app/klima');

    service.init();

    expect(service.isFilterParamSet()).toBe(true);
    expect(service.globalFilterApplied()).toBe(true);
    expect(service.applicationFilterId).toBe('klima');
    expect(service.applicationFilter).toEqual(filterConfig[0]);
  });

  it('shows an error toast and leaves the filter inactive when the filterId is unknown', async () => {
    const notificationService = TestBed.inject(NotificationService);
    const showErrorSpy = jest.spyOn(notificationService, 'showError');

    await router.navigateByUrl('/app/does-not-exist');

    service.init();

    expect(service.isFilterParamSet()).toBe(false);
    expect(service.globalFilterApplied()).toBe(false);
    expect(service.applicationFilter).toBeUndefined();
    expect(showErrorSpy).toHaveBeenCalledWith('Räuml. Filter konnte nicht gefunden werden', {
      autohide: false,
    });
  });

  it('reset() navigates back to / and clears the applied filter', async () => {
    await router.navigateByUrl('/app/klima');
    service.init();

    service.reset();

    expect(service.isFilterParamSet()).toBe(false);
    expect(service.applicationFilter).toBeUndefined();
    expect(service.globalFilterApplied()).toBe(false);
  });
});
