import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { MOCK_PLATFORM_LOCATION_CONFIG, MockPlatformLocation } from '@angular/common/testing';

import { ShareHelperService } from './share-helper.service';

describe('ShareHelperService', () => {
  let service: ShareHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(ShareHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setShareLinkParam_currentHierarchyId', () => {
    it('adds the hierarchy param when a hierarchy id is given', () => {
      service.setShareLinkParam_currentHierarchyId('some-hierarchy-id');

      expect(service.queryParamMap.get(service.paramName_hierarchyId)).toBe('some-hierarchy-id');
    });

    it('removes a previously set hierarchy param when no hierarchy is selected', () => {
      service.setShareLinkParam_currentHierarchyId('some-hierarchy-id');
      service.setShareLinkParam_currentHierarchyId(undefined);

      expect(service.queryParamMap.has(service.paramName_hierarchyId)).toBe(false);
    });
  });
});

// Regression: the link used to be built as origin + '/' + route, which drops the
// sub-path the app is deployed under (e.g. /v6/ui/), so shared links led nowhere.
describe('ShareHelperService under a sub-path', () => {
  it('keeps the base href in the share link', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_BASE_HREF, useValue: '/v6/ui/' },
        { provide: PlatformLocation, useClass: MockPlatformLocation },
        {
          provide: MOCK_PLATFORM_LOCATION_CONFIG,
          useValue: { startUrl: 'http://localhost/v6/ui/', appBaseHref: '/v6/ui/' },
        },
      ],
    });
    const service = TestBed.inject(ShareHelperService);
    jest.spyOn(service, 'setShareLinkParam_mapExtent').mockImplementation(() => undefined);
    jest.spyOn(service, 'setShareLinkParam_currentIndicatorId').mockImplementation(() => undefined);
    jest
      .spyOn(service, 'setShareLinkParam_currentSpatialUnitName')
      .mockImplementation(() => undefined);
    service.setShareLinkParam('ind', 'abc');

    service.generateCurrentShareLink();

    expect(service.currentShareLink).toBe(`${window.location.origin}/v6/ui/?share=true&ind=abc`);
  });
});
