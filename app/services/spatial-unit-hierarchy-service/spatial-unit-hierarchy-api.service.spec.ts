import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

import {
  SpatialUnitHierarchyApiService,
  placementFor,
  toOrderedMembers,
} from './spatial-unit-hierarchy-api.service';

describe('SpatialUnitHierarchyApiService', () => {
  let service: SpatialUnitHierarchyApiService;
  let httpMock: HttpTestingController;

  const BASE = 'http://dm-api/management';
  const HIERARCHIES = `${BASE}/spatial-unit-hierarchies`;

  const hierarchy = {
    hierarchyId: 'h-1',
    name: 'Verwaltungsgliederung',
    mandantId: 'm-1',
    isPublic: false,
    members: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EnvConfigService, useValue: { baseUrlToKomMonitorDataAPI: BASE } },
      ],
    });
    service = TestBed.inject(SpatialUnitHierarchyApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('reads resolve empty rather than throwing', () => {
    it('lists the hierarchies', async () => {
      const pending = service.getHierarchies();
      httpMock.expectOne(HIERARCHIES).flush([hierarchy]);

      await expect(pending).resolves.toEqual([hierarchy]);
    });

    it('answers an empty list on error — a 401 must not take a page down', async () => {
      const pending = service.getHierarchies();
      httpMock.expectOne(HIERARCHIES).flush('nope', { status: 401, statusText: 'Unauthorized' });

      await expect(pending).resolves.toEqual([]);
    });

    it('answers an empty list when the body is null', async () => {
      const pending = service.getHierarchies();
      httpMock.expectOne(HIERARCHIES).flush(null);

      await expect(pending).resolves.toEqual([]);
    });

    it('reads a single hierarchy', async () => {
      const pending = service.getHierarchy('h-1');
      httpMock.expectOne(`${HIERARCHIES}/h-1`).flush(hierarchy);

      await expect(pending).resolves.toEqual(hierarchy);
    });

    it('answers null for a single hierarchy on error', async () => {
      const pending = service.getHierarchy('h-1');
      httpMock
        .expectOne(`${HIERARCHIES}/h-1`)
        .flush('nope', { status: 404, statusText: 'Not Found' });

      await expect(pending).resolves.toBeNull();
    });
  });

  describe('writes rethrow, so the caller can roll back', () => {
    it('creates a hierarchy and hands back the created record', async () => {
      const body = { name: 'Neu', mandantId: 'm-1', isPublic: false };
      const pending = service.createHierarchy(body);

      const request = httpMock.expectOne(HIERARCHIES);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(body);
      request.flush(hierarchy, { status: 201, statusText: 'Created' });

      await expect(pending).resolves.toEqual(hierarchy);
    });

    it('rethrows a failed create', async () => {
      const pending = service.createHierarchy({ name: 'Neu', mandantId: 'm-1' });
      httpMock
        .expectOne(HIERARCHIES)
        .flush({ message: 'existiert bereits' }, { status: 400, statusText: 'Bad Request' });

      await expect(pending).rejects.toBeTruthy();
    });

    it('replaces the metadata of a hierarchy', async () => {
      const body = { name: 'Umbenannt', mandantId: 'm-1', isPublic: true };
      const pending = service.updateHierarchy('h-1', body);

      const request = httpMock.expectOne(`${HIERARCHIES}/h-1`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual(body);
      request.flush({ ...hierarchy, ...body });

      await expect(pending).resolves.toEqual({ ...hierarchy, ...body });
    });

    it('deletes a hierarchy', async () => {
      const pending = service.deleteHierarchy('h-1');

      const request = httpMock.expectOne(`${HIERARCHIES}/h-1`);
      expect(request.request.method).toBe('DELETE');
      request.flush(null);

      await expect(pending).resolves.toBeUndefined();
    });

    it('rethrows a failed delete', async () => {
      const pending = service.deleteHierarchy('h-1');
      httpMock
        .expectOne(`${HIERARCHIES}/h-1`)
        .flush('nope', { status: 403, statusText: 'Forbidden' });

      await expect(pending).rejects.toBeTruthy();
    });

    it('replaces the whole member list', async () => {
      const members = toOrderedMembers(['su-a', 'su-b']);
      const pending = service.updateMembers('h-1', members);

      const request = httpMock.expectOne(`${HIERARCHIES}/h-1/members`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual([
        { spatialUnitId: 'su-a', hierarchyLevel: 0 },
        { spatialUnitId: 'su-b', hierarchyLevel: 1 },
      ]);
      request.flush(hierarchy);

      await expect(pending).resolves.toEqual(hierarchy);
    });

    it('replaces the memberships of one spatial unit', async () => {
      const pending = service.updateMemberships('su-a', [
        { hierarchyId: 'h-1', hierarchyLevel: 0 },
      ]);

      const request = httpMock.expectOne(`${BASE}/spatial-units/su-a/hierarchies`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual([{ hierarchyId: 'h-1', hierarchyLevel: 0 }]);
      request.flush({ spatialUnitId: 'su-a' });

      await expect(pending).resolves.toEqual({ spatialUnitId: 'su-a' });
    });

    it('rethrows a member list the backend rejects', async () => {
      const pending = service.updateMembers('h-1', toOrderedMembers(['su-foreign']));
      httpMock
        .expectOne(`${HIERARCHIES}/h-1/members`)
        .flush(
          { message: 'do not belong to the same mandant' },
          { status: 400, statusText: 'Bad Request' }
        );

      await expect(pending).rejects.toBeTruthy();
    });
  });
});

describe('toOrderedMembers', () => {
  it('writes the chain position into hierarchyLevel, coarsest first', () => {
    expect(toOrderedMembers(['su-city', 'su-district', 'su-block'])).toEqual([
      { spatialUnitId: 'su-city', hierarchyLevel: 0 },
      { spatialUnitId: 'su-district', hierarchyLevel: 1 },
      { spatialUnitId: 'su-block', hierarchyLevel: 2 },
    ]);
  });

  it('answers an empty list for an empty chain', () => {
    expect(toOrderedMembers([])).toEqual([]);
  });
});

describe('placementFor', () => {
  const hierarchies = [
    {
      hierarchyId: 'h-1',
      name: 'Verwaltung',
      mandantId: 'm-1',
      isPublic: false,
      members: [
        { spatialUnitId: 'su-a', hierarchyLevel: 0 },
        { spatialUnitId: 'su-b', hierarchyLevel: 1 },
      ],
    },
    { hierarchyId: 'h-2', name: 'Sozialraum', mandantId: 'm-1', isPublic: false, members: [] },
  ];

  it('clears the list when no hierarchy is picked', () => {
    expect(placementFor('', [{ hierarchyId: 'h-1', hierarchyLevel: 1 }], hierarchies)).toEqual([]);
  });

  it('keeps the level the dataset already holds in that hierarchy', () => {
    expect(placementFor('h-1', [{ hierarchyId: 'h-1', hierarchyLevel: 1 }], hierarchies)).toEqual([
      { hierarchyId: 'h-1', hierarchyLevel: 1 },
    ]);
  });

  it('appends as the finest level when switching to another hierarchy', () => {
    expect(placementFor('h-1', [{ hierarchyId: 'h-2', hierarchyLevel: 0 }], hierarchies)).toEqual([
      { hierarchyId: 'h-1', hierarchyLevel: 2 },
    ]);
  });

  it('starts at level 0 in an empty hierarchy', () => {
    expect(placementFor('h-2', [], hierarchies)).toEqual([
      { hierarchyId: 'h-2', hierarchyLevel: 0 },
    ]);
  });

  it('falls back to level 0 for a hierarchy it does not know', () => {
    expect(placementFor('h-unknown', [], hierarchies)).toEqual([
      { hierarchyId: 'h-unknown', hierarchyLevel: 0 },
    ]);
  });

  it('treats a membership without a level as the top one', () => {
    expect(placementFor('h-1', [{ hierarchyId: 'h-1' }], hierarchies)).toEqual([
      { hierarchyId: 'h-1', hierarchyLevel: 0 },
    ]);
  });
});
