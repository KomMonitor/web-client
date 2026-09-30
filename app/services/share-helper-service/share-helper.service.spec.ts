import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

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
