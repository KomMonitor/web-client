import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';

import { DatasetPermissionsWizardStateService } from './dataset-permissions-wizard-state.service';
import {
  georesourceSource,
  indicatorSource,
  spatialUnitSource,
} from './dataset-permissions.fixture';
import { WizardStateTestBed, wizardStateTestBed } from './dataset-permissions-wizard-state.testing';

/**
 * The wizard's state on its own: the rules underneath are tested in
 * `dataset-permissions.model.spec`, so these specs check the wiring — what is
 * selected, how decisions are stored, and what a save sends and reloads.
 *
 * `start()` reloads once in `beforeEach`; each save reloads once before and
 * once after the request.
 */

const OWNER = 'owner';

/** Tenant of each unit: `x` belongs to another tenant and is never offered. */
const TENANT_OF: Record<string, string> = { owner: 'm', a: 'm', b: 'm', x: 'n' };

let georesources: WizardStateTestBed['georesources'];
let adminRoleManagement: WizardStateTestBed['adminRoleManagement'];
let bootstrap: WizardStateTestBed['bootstrap'];

let state: DatasetPermissionsWizardStateService;

beforeEach(() => {
  const testBed = wizardStateTestBed(
    {
      indicators: [indicatorSource('i', OWNER, [], { s1: [], s2: ['a-viewer'] })],
      georesources: [
        georesourceSource('g1', OWNER, []),
        georesourceSource('g2', OWNER, ['a-viewer']),
        georesourceSource('foreign', 'x', []),
      ],
      spatialUnits: [spatialUnitSource('s1', OWNER, [])],
    },
    TENANT_OF
  );
  ({ georesources, adminRoleManagement, bootstrap } = testBed);

  TestBed.configureTestingModule({
    providers: [DatasetPermissionsWizardStateService, ...testBed.providers],
  });
  state = TestBed.inject(DatasetPermissionsWizardStateService);
  void state.start(OWNER);
});

/** What another admin stores meanwhile: `b` gets read access to `g1`. */
function grantBReadOnG1(): void {
  georesources.update((list) =>
    list.map((g) => (g.georesourceId === 'g1' ? { ...g, permissions: ['b-viewer'] } : g))
  );
}

afterEach(() => jest.restoreAllMocks());

describe('DatasetPermissionsWizardStateService', () => {
  it('knows nothing before a run is started', () => {
    const fresh = TestBed.runInInjectionContext(() => new DatasetPermissionsWizardStateService());
    expect(fresh.groups()).toEqual([]);
    expect(fresh.datasets()).toEqual([]);
  });

  it("offers the groups of the owner's tenant, without the owner", () => {
    expect(state.groups().map((g) => g.organizationalUnitId)).toEqual(['a', 'b']);
    expect(state.tenantUnknown()).toBe(false);
  });

  it('offers no group when the tenant of the owner is unknown', () => {
    void state.start('x-unknown');
    expect(state.tenantUnknown()).toBe(true);
    expect(state.groups()).toEqual([]);
  });

  it('keeps both dropdowns consistent when a coupled level is set back', () => {
    state.setAction('a', 'editor', 'grant');
    state.setAction('a', 'viewer', 'keep');
    expect(state.decisions()['a']).toEqual({ viewer: 'keep', editor: 'keep' });

    state.setAction('a', 'viewer', 'revoke');
    state.setAction('a', 'editor', 'keep');
    expect(state.decisions()['a']).toEqual({ viewer: 'keep', editor: 'keep' });
    expect(state.hasChanges()).toBe(false);
  });

  describe('selection', () => {
    it("selects every dataset of the owner by default, and only the owner's", () => {
      expect(state.selectedDatasets().map((d) => `${d.kind}:${d.id}`)).toEqual([
        'indicator:i',
        'georesource:g1',
        'georesource:g2',
        'spatialUnit:s1',
      ]);
      expect(state.selectionCount()).toEqual({ selected: 4, total: 4 });
    });

    it('deselects single datasets and whole kinds', () => {
      state.setSelected('georesource:g1', false);
      expect(state.isSelected('georesource:g1')).toBe(false);
      expect(state.selectionState('georesource')).toBe('some');

      state.setKindSelected('georesource', false);
      expect(state.selectionState('georesource')).toBe('none');

      state.setKindSelected('georesource', true);
      expect(state.selectionState('georesource')).toBe('all');
      expect(state.selectionCount()).toEqual({ selected: 4, total: 4 });
    });

    it('selects a dataset that only arrives after the start', () => {
      georesources.update((list) => [...list, georesourceSource('late', OWNER, [])]);
      expect(state.isSelected('georesource:late')).toBe(true);
      expect(state.selectionCount()).toEqual({ selected: 5, total: 5 });
    });

    it('starts a new run with everything selected and nothing decided', () => {
      state.setKindSelected('indicator', false);
      state.setAction('a', 'viewer', 'grant');

      state.start(OWNER);

      expect(state.selectionCount()).toEqual({ selected: 4, total: 4 });
      expect(state.decisions()).toEqual({});
    });
  });

  describe('decisions', () => {
    it('couples the dropdowns: granting edit grants read', () => {
      state.setAction('a', 'editor', 'grant');
      expect(state.decisions()['a']).toEqual({ viewer: 'grant', editor: 'grant' });
    });

    it('reports coverage on the selected datasets', () => {
      // `a` reads g2 only; the indicator lacks it on s1, so it does not count.
      expect(state.coverageOf('a', 'viewer')).toEqual({
        before: 1,
        after: 1,
        total: 4,
        changed: false,
      });

      state.setSelected('georesource:g2', false);
      state.setAction('a', 'viewer', 'grant');
      expect(state.coverageOf('a', 'viewer')).toEqual({
        before: 0,
        after: 3,
        total: 3,
        changed: true,
      });
    });

    it('opens the per-dataset dialog with the current target rights', () => {
      state.setAction('b', 'viewer', 'grant');
      const draft = state.draftFor('b');
      expect(Object.keys(draft)).toHaveLength(5);
      expect(Object.values(draft).every((r) => r.viewer && !r.editor)).toBe(true);
    });

    it('turns a returned draft into dropdown values', () => {
      const draft = state.draftFor('b');
      state.applyDraft('b', { ...draft, 'georesources:g1': { viewer: true, editor: false } });
      expect(state.decisions()['b']).toMatchObject({ viewer: 'custom', editor: 'keep' });

      const all = Object.fromEntries(
        Object.keys(draft).map((key) => [key, { viewer: true, editor: true }])
      );
      state.applyDraft('b', all);
      expect(state.decisions()['b']).toEqual({ viewer: 'grant', editor: 'grant' });
    });

    it('ignores a draft for a group it does not offer', () => {
      state.applyDraft('x', {});
      expect(state.decisions()).toEqual({});
      expect(state.draftFor('x')).toEqual({});
    });

    it('summarizes and patches the selected datasets only', () => {
      state.setKindSelected('indicator', false);
      state.setKindSelected('spatialUnit', false);
      state.setSelected('georesource:g2', false);
      state.setAction('b', 'viewer', 'grant');

      expect(state.summary().map((l) => [l.groupName, l.change, l.count])).toEqual([
        ['b', 'add', 1],
      ]);
      expect(state.changedCount()).toBe(1);
      expect(state.patch()).toEqual([
        {
          organizationalUnitId: 'b',
          permissions: { georesources: [{ id: 'g1', permissions: ['b-viewer'] }] },
        },
      ]);
    });

    it('forgets the decisions but keeps the selection on reset', () => {
      state.setSelected('georesource:g1', false);
      state.setAction('a', 'viewer', 'grant');

      state.resetDecisions();

      expect(state.decisions()).toEqual({});
      expect(state.isSelected('georesource:g1')).toBe(false);
      expect(state.hasChanges()).toBe(false);
    });
  });

  describe('reload', () => {
    it('reloads the stored rights when a run starts', async () => {
      expect(bootstrap.reloadDatasetMetadata).toHaveBeenCalledTimes(1);

      let finish!: () => void;
      bootstrap.reloadDatasetMetadata.mockReturnValueOnce(
        new Promise<void>((resolve) => (finish = resolve))
      );
      const started = state.start(OWNER);
      expect(state.reloading()).toBe(true);

      finish();
      await expect(started).resolves.toBe(true);
      expect(state.reloading()).toBe(false);
      expect(state.loadFailed()).toBe(false);
    });

    it('flags a failed reload until one succeeds, keeping selection and decisions', async () => {
      bootstrap.reloadDatasetMetadata.mockRejectedValueOnce(new Error('offline'));
      state.setSelected('georesource:g1', false);
      state.setAction('a', 'viewer', 'grant');

      await expect(state.reload()).resolves.toBe(false);
      expect(state.loadFailed()).toBe(true);

      await expect(state.reload()).resolves.toBe(true);
      expect(state.loadFailed()).toBe(false);
      expect(state.isSelected('georesource:g1')).toBe(false);
      expect(state.decisions()['a']).toEqual({ viewer: 'grant', editor: 'keep' });
    });
  });

  describe('save', () => {
    it('sends nothing when nothing changes', async () => {
      state.setAction('a', 'viewer', 'keep');

      await expect(state.save()).resolves.toEqual({ status: 'nothing' });
      expect(adminRoleManagement.patchDatasetPermissions).not.toHaveBeenCalled();
      expect(bootstrap.reloadDatasetMetadata).toHaveBeenCalledTimes(1);
    });

    it('reloads, sends the reviewed patch, then reloads the datasets again', async () => {
      const response = new Subject<void>();
      const order: string[] = [];
      bootstrap.reloadDatasetMetadata.mockImplementation(async () => {
        order.push('reload');
        if (adminRoleManagement.patchDatasetPermissions.mock.calls.length > 0) {
          grantBReadOnG1();
        }
      });
      adminRoleManagement.patchDatasetPermissions.mockImplementation(() => {
        order.push('patch');
        return response;
      });
      state.setAction('b', 'viewer', 'grant');
      const body = state.patch();

      const saving = state.save();
      expect(state.saving()).toBe(true);
      await new Promise((resolve) => setTimeout(resolve));
      response.next();
      response.complete();

      await expect(saving).resolves.toEqual({ status: 'saved', datasetCount: 4, reloaded: true });
      expect(adminRoleManagement.patchDatasetPermissions).toHaveBeenCalledWith(body);
      expect(order).toEqual(['reload', 'patch', 'reload']);
      expect(state.saving()).toBe(false);
      expect(state.decisions()).toEqual({});
      // The reloaded rights are the new current state.
      expect(state.coverageOf('b', 'viewer')?.before).toBe(1);
    });

    it('sends nothing when the stored rights changed since the review', async () => {
      bootstrap.reloadDatasetMetadata.mockImplementationOnce(async () => grantBReadOnG1());
      state.setAction('b', 'viewer', 'grant');
      const reviewed = state.patch();

      await expect(state.save()).resolves.toEqual({ status: 'changed' });
      expect(adminRoleManagement.patchDatasetPermissions).not.toHaveBeenCalled();
      expect(state.decisions()['b']).toEqual({ viewer: 'grant', editor: 'keep' });
      // The summary now shows what would be written on the reloaded rights.
      expect(state.patch()).not.toEqual(reviewed);
      expect(state.coverageOf('b', 'viewer')?.before).toBe(1);
    });

    it('still sends when the reload only returns the lists in another order', async () => {
      bootstrap.reloadDatasetMetadata.mockImplementationOnce(async () =>
        georesources.update((list) => [...list].reverse())
      );
      state.setAction('b', 'viewer', 'grant');

      await expect(state.save()).resolves.toEqual({
        status: 'saved',
        datasetCount: 4,
        reloaded: true,
      });
      expect(adminRoleManagement.patchDatasetPermissions).toHaveBeenCalledTimes(1);
    });

    it('sends nothing when the stored rights cannot be loaded before sending', async () => {
      bootstrap.reloadDatasetMetadata.mockRejectedValueOnce(new Error('offline'));
      state.setAction('a', 'viewer', 'grant');

      await expect(state.save()).resolves.toEqual({ status: 'unverified' });
      expect(adminRoleManagement.patchDatasetPermissions).not.toHaveBeenCalled();
      expect(state.loadFailed()).toBe(true);
      expect(state.decisions()['a']).toEqual({ viewer: 'grant', editor: 'keep' });
      expect(state.saving()).toBe(false);
    });

    it('ignores a second save while one is under way', async () => {
      state.setAction('a', 'viewer', 'grant');

      const first = state.save();
      await expect(state.save()).resolves.toEqual({ status: 'nothing' });
      await first;

      expect(adminRoleManagement.patchDatasetPermissions).toHaveBeenCalledTimes(1);
    });

    it('keeps the decisions and reports the message when the request fails', async () => {
      adminRoleManagement.patchDatasetPermissions.mockReturnValue(
        throwError(() => ({ status: 400, error: { message: 'unknown permission' } }))
      );
      state.setAction('a', 'viewer', 'grant');

      await expect(state.save()).resolves.toEqual({
        status: 'failed',
        message: 'unknown permission',
      });
      expect(state.decisions()['a']).toEqual({ viewer: 'grant', editor: 'keep' });
      expect(state.saving()).toBe(false);
      // Reloaded on start and before sending, not after.
      expect(bootstrap.reloadDatasetMetadata).toHaveBeenCalledTimes(2);
    });

    it('falls back to the HTTP message when the backend sends none', async () => {
      adminRoleManagement.patchDatasetPermissions.mockReturnValue(
        throwError(() => ({ status: 0, message: 'Http failure response' }))
      );
      state.setAction('a', 'viewer', 'grant');

      await expect(state.save()).resolves.toEqual({
        status: 'failed',
        message: 'Http failure response',
      });
    });

    it('reports a stored save whose reload failed', async () => {
      bootstrap.reloadDatasetMetadata
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('offline'));
      state.setAction('a', 'viewer', 'grant');

      await expect(state.save()).resolves.toEqual({
        status: 'saved',
        datasetCount: 3,
        reloaded: false,
      });
      expect(state.decisions()).toEqual({});
      expect(state.loadFailed()).toBe(true);
    });
  });
});
