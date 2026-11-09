import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

import {
  GroupDecision,
  KEEP_DECISION,
  PermissionDataset,
  actionsFromDraft,
  buildPermissionsPatch,
  candidateGroups,
  changedDatasetCount,
  countDeviations,
  coupleAction,
  coupleRights,
  coverage,
  currentDraft,
  currentRights,
  datasetKey,
  datasetsOfOwner,
  draftDeviates,
  draftState,
  initialDraft,
  resourcePermissionIds,
  setDraftLevel,
  summarize,
  targetRights,
  timeseriesCount,
  triState,
} from './dataset-permissions.model';
import {
  georesourceSource,
  group,
  indicatorSource,
  orgUnit,
  sources,
  spatialUnitSource,
} from './dataset-permissions.fixture';

const OWNER = 'owner';
const a = group('a');
const b = group('b');

function datasets(partial: Parameters<typeof sources>[0]): PermissionDataset[] {
  return datasetsOfOwner(OWNER, sources(partial));
}

function only<T>(items: readonly T[]): T {
  expect(items).toHaveLength(1);
  return items[0];
}

const grantViewer: GroupDecision = { viewer: 'grant', editor: 'keep' };
const revokeViewer: GroupDecision = { viewer: 'revoke', editor: 'revoke' };

describe('dataset-permissions.model', () => {
  describe('resourcePermissionIds', () => {
    it('resolves the resource viewer/editor ids and keeps all ids of the unit', () => {
      expect(resourcePermissionIds([orgUnit('a')])).toEqual([
        {
          organizationalUnitId: 'a',
          name: 'a',
          viewerId: 'a-viewer',
          editorId: 'a-editor',
          ownIds: ['a-viewer', 'a-editor', 'a-creator', 'a-themes', 'a-users'],
        },
      ]);
    });

    it('skips permissions of another type even when their level matches', () => {
      const unit: AccessControlMetadata = {
        organizationalUnitId: 'a',
        name: 'a',
        permissions: [
          { permissionId: 'theme-viewer', permissionLevel: 'viewer', permissioneType: 'themes' },
          ...orgUnit('a').permissions,
        ],
      };
      expect(only(resourcePermissionIds([unit])).viewerId).toBe('a-viewer');
    });

    it('reads permissions without a type as resource permissions', () => {
      const unit: AccessControlMetadata = {
        organizationalUnitId: 'a',
        name: 'a',
        permissions: [
          { permissionId: 'v', permissionLevel: 'viewer' },
          { permissionId: 'e', permissionLevel: 'editor' },
        ],
      };
      const resolved = only(resourcePermissionIds([unit]));
      expect([resolved.viewerId, resolved.editorId]).toEqual(['v', 'e']);
    });

    it('leaves out units lacking a viewer or an editor permission', () => {
      const unit: AccessControlMetadata = {
        organizationalUnitId: 'a',
        name: 'a',
        permissions: [
          { permissionId: 'v', permissionLevel: 'viewer', permissioneType: 'resources' },
        ],
      };
      expect(resourcePermissionIds([unit])).toEqual([]);
    });
  });

  describe('candidateGroups', () => {
    const accessControl = [
      orgUnit('m', { name: 'Mandant', mandant: true, children: ['b', 'a'] }),
      orgUnit('b', { name: 'Beta', parentId: 'm', children: ['c'] }),
      orgUnit('a', { name: 'Alpha', parentId: 'm' }),
      orgUnit('c', { name: 'Gamma', parentId: 'b' }),
      orgUnit('x', { name: 'Other', mandant: true, children: ['y'] }),
      orgUnit('y', { name: 'Other child', parentId: 'x' }),
    ];
    const mandantOf: Record<string, string> = { m: 'm', a: 'm', b: 'm', c: 'm', x: 'x', y: 'x' };
    const mandantIdOf = (id: string): string => mandantOf[id] ?? '';
    const names = (ownerId: string): string[] =>
      candidateGroups(accessControl, ownerId, mandantIdOf).map((g) => g.name);

    it('offers every unit of the owner tenant on all levels, without the owner, by name', () => {
      expect(names('m')).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    it('includes the tenant unit itself for an owner below it', () => {
      expect(names('b')).toEqual(['Alpha', 'Gamma', 'Mandant']);
    });

    it('offers all units except the owner when the owner has no tenant', () => {
      expect(candidateGroups(accessControl, 'm', () => '')).toHaveLength(5);
    });
  });

  describe('datasetsOfOwner', () => {
    const all = datasets({
      indicators: [
        indicatorSource('i2', OWNER, ['a-viewer'], { s1: ['a-viewer'], s2: [] }, 'Zebra'),
        indicatorSource('i1', OWNER, ['b-viewer'], {}, 'Alpha'),
        indicatorSource('foreign', 'someone-else', [], {}),
      ],
      georesources: [georesourceSource('g1', OWNER, ['a-editor'], 'Schools')],
      spatialUnits: [spatialUnitSource('su1', OWNER, [], 'Districts')],
    });

    it('keeps only the owner datasets: indicators, georesources, spatial units, each by name', () => {
      expect(all.map((d) => [d.kind, d.name])).toEqual([
        ['indicator', 'Alpha'],
        ['indicator', 'Zebra'],
        ['georesource', 'Schools'],
        ['spatialUnit', 'Districts'],
      ]);
    });

    it('gives an indicator one slot per timeseries and keeps the indicator ids apart', () => {
      const indicator = all[1];
      expect(indicator.indicatorPermissions).toEqual(['a-viewer']);
      expect(indicator.slots).toEqual([
        {
          key: 'indicatorspatialunits:i2:s1',
          target: { section: 'indicatorspatialunits', id: 'i2', spatialUnitId: 's1' },
          label: 'level s1',
          permissions: ['a-viewer'],
        },
        {
          key: 'indicatorspatialunits:i2:s2',
          target: { section: 'indicatorspatialunits', id: 'i2', spatialUnitId: 's2' },
          label: 'level s2',
          permissions: [],
        },
      ]);
    });

    it('gives an indicator without timeseries a single slot on the indicator itself', () => {
      const indicator = all[0];
      expect(indicator.indicatorPermissions).toBeUndefined();
      expect(indicator.slots).toEqual([
        {
          key: 'indicators:i1',
          target: { section: 'indicators', id: 'i1' },
          permissions: ['b-viewer'],
        },
      ]);
    });

    it('gives georesources and spatial units one slot each', () => {
      expect(all[2].slots.map((s) => s.key)).toEqual(['georesources:g1']);
      expect(all[3].slots.map((s) => s.key)).toEqual(['spatialunits:su1']);
    });
  });

  describe('rights and coupling', () => {
    it('counts an editor id alone as read access', () => {
      expect(currentRights(a, ['a-editor'])).toEqual({ viewer: true, editor: true });
      expect(currentRights(a, ['a-viewer', 'b-editor'])).toEqual({ viewer: true, editor: false });
    });

    it('grants read along with edit and revokes edit along with read', () => {
      expect(coupleAction(KEEP_DECISION, 'editor', 'grant')).toEqual({
        viewer: 'grant',
        editor: 'grant',
      });
      expect(coupleAction(KEEP_DECISION, 'viewer', 'revoke')).toEqual({
        viewer: 'revoke',
        editor: 'revoke',
      });
      expect(coupleAction(KEEP_DECISION, 'viewer', 'grant')).toEqual(grantViewer);
      expect(coupleAction(KEEP_DECISION, 'editor', 'revoke')).toEqual({
        viewer: 'keep',
        editor: 'revoke',
      });
    });

    it('applies the same coupling to single checkboxes', () => {
      const none = { viewer: false, editor: false };
      const both = { viewer: true, editor: true };
      expect(coupleRights(none, 'editor', true)).toEqual(both);
      expect(coupleRights(both, 'viewer', false)).toEqual(none);
      expect(coupleRights(both, 'editor', false)).toEqual({ viewer: true, editor: false });
    });
  });

  describe('targetRights', () => {
    const [slot] = datasets({ georesources: [georesourceSource('g', OWNER, ['a-viewer'])] })[0]
      .slots;

    it('resolves keep, grant and revoke', () => {
      expect(targetRights(a, slot)).toEqual({ viewer: true, editor: false });
      expect(targetRights(a, slot, { viewer: 'keep', editor: 'grant' })).toEqual({
        viewer: true,
        editor: true,
      });
      expect(targetRights(a, slot, revokeViewer)).toEqual({ viewer: false, editor: false });
    });

    it('reads custom levels from the draft and falls back to the current rights', () => {
      const custom: GroupDecision = {
        viewer: 'custom',
        editor: 'custom',
        custom: { [slot.key]: { viewer: false, editor: false } },
      };
      expect(targetRights(a, slot, custom)).toEqual({ viewer: false, editor: false });
      expect(targetRights(a, slot, { ...custom, custom: {} })).toEqual({
        viewer: true,
        editor: false,
      });
    });

    it('never ends with edit but without read', () => {
      expect(targetRights(a, slot, { viewer: 'revoke', editor: 'grant' })).toEqual({
        viewer: true,
        editor: true,
      });
    });
  });

  describe('coverage', () => {
    it('counts a dataset only when every slot has the right', () => {
      const selected = datasets({
        indicators: [indicatorSource('i', OWNER, [], { s1: ['a-viewer'], s2: [] })],
        georesources: [georesourceSource('g', OWNER, ['a-viewer'])],
      });
      expect(coverage(a, selected, undefined, 'viewer')).toEqual({
        before: 1,
        after: 1,
        total: 2,
        changed: false,
      });
      expect(coverage(a, selected, grantViewer, 'viewer')).toEqual({
        before: 1,
        after: 2,
        total: 2,
        changed: true,
      });
    });

    it('reports a change even when the count stays the same', () => {
      const selected = datasets({
        georesources: [
          georesourceSource('g1', OWNER, ['a-viewer']),
          georesourceSource('g2', OWNER, []),
        ],
      });
      const swap: GroupDecision = {
        viewer: 'custom',
        editor: 'keep',
        custom: {
          'georesources:g1': { viewer: false, editor: false },
          'georesources:g2': { viewer: true, editor: false },
        },
      };
      expect(coverage(a, selected, swap, 'viewer')).toEqual({
        before: 1,
        after: 1,
        total: 2,
        changed: true,
      });
    });
  });

  describe('triState', () => {
    it('maps counts to all/some/none', () => {
      expect(triState(0, 3)).toBe('none');
      expect(triState(2, 3)).toBe('some');
      expect(triState(3, 3)).toBe('all');
      expect(triState(0, 0)).toBe('none');
    });
  });

  describe('per-dataset dialog', () => {
    const selected = datasets({
      georesources: [
        georesourceSource('g1', OWNER, ['a-viewer']),
        georesourceSource('g2', OWNER, []),
      ],
    });
    const slots = selected.flatMap((d) => d.slots);

    it('opens with the current target rights of each slot', () => {
      expect(initialDraft(a, slots, grantViewer)).toEqual({
        'georesources:g1': { viewer: true, editor: false },
        'georesources:g2': { viewer: true, editor: false },
      });
    });

    it('turns a draft equal to the current rights into keep', () => {
      expect(actionsFromDraft(a, slots, initialDraft(a, slots, undefined))).toEqual(KEEP_DECISION);
    });

    it('turns a uniform draft into grant or revoke, without a custom draft', () => {
      const allOn = {
        'georesources:g1': { viewer: true, editor: true },
        'georesources:g2': { viewer: true, editor: true },
      };
      expect(actionsFromDraft(a, slots, allOn)).toEqual({ viewer: 'grant', editor: 'grant' });
      const allOff = {
        'georesources:g1': { viewer: false, editor: false },
        'georesources:g2': { viewer: false, editor: false },
      };
      expect(actionsFromDraft(a, slots, allOff)).toEqual({ viewer: 'revoke', editor: 'keep' });
    });

    it('turns a mixed draft into custom and keeps the draft', () => {
      const mixed = {
        'georesources:g1': { viewer: false, editor: false },
        'georesources:g2': { viewer: true, editor: false },
      };
      expect(actionsFromDraft(a, slots, mixed)).toEqual({
        viewer: 'custom',
        editor: 'keep',
        custom: mixed,
      });
    });

    it('counts the (slot, level) pairs that differ from the current rights', () => {
      const draft = {
        'georesources:g1': { viewer: true, editor: true },
        'georesources:g2': { viewer: true, editor: true },
      };
      expect(countDeviations(a, slots, draft)).toBe(3);
    });

    it('resets to the current rights, reading an editor id as read access', () => {
      const [g3] = datasets({ georesources: [georesourceSource('g3', OWNER, ['a-editor'])] });
      expect(currentDraft(a, [...g3.slots, ...slots])).toEqual({
        'georesources:g3': { viewer: true, editor: true },
        'georesources:g1': { viewer: true, editor: false },
        'georesources:g2': { viewer: false, editor: false },
      });
    });

    it('sets a level on the given slots only, coupled like a single checkbox', () => {
      const [g1, g2] = slots;
      const edit = setDraftLevel(a, [g2], {}, 'editor', true);
      expect(edit).toEqual({ 'georesources:g2': { viewer: true, editor: true } });

      // A slot missing from the draft starts from its current rights.
      const noRead = setDraftLevel(a, [g1, g2], edit, 'viewer', false);
      expect(noRead).toEqual({
        'georesources:g1': { viewer: false, editor: false },
        'georesources:g2': { viewer: false, editor: false },
      });
    });

    it('tells the state of a collective checkbox over the draft', () => {
      const draft = currentDraft(a, slots);
      expect(draftState(a, slots, draft, 'viewer')).toBe('some');
      expect(draftState(a, slots, draft, 'editor')).toBe('none');
      expect(draftState(a, slots, setDraftLevel(a, slots, draft, 'editor', true), 'viewer')).toBe(
        'all'
      );
    });

    it('marks a level that differs from the current rights on any slot', () => {
      const [g1, g2] = slots;
      const draft = setDraftLevel(a, [g2], currentDraft(a, slots), 'viewer', true);
      expect(draftDeviates(a, slots, draft, 'viewer')).toBe(true);
      expect(draftDeviates(a, [g1], draft, 'viewer')).toBe(false);
      expect(draftDeviates(a, slots, draft, 'editor')).toBe(false);

      // An editor id alone already is read access, so read and edit there is no deviation.
      const [onlyEditor] = datasets({
        georesources: [georesourceSource('g3', OWNER, ['a-editor'])],
      });
      const same = { 'georesources:g3': { viewer: true, editor: true } };
      expect(draftDeviates(a, onlyEditor.slots, same, 'viewer')).toBe(false);
    });
  });

  describe('summarize', () => {
    it('counts datasets, not slots, and skips groups and levels without change', () => {
      const selected = datasets({
        indicators: [indicatorSource('i', OWNER, [], { s1: [], s2: [] })],
        georesources: [georesourceSource('g', OWNER, ['a-viewer'])],
      });
      expect(summarize([a, b], selected, { a: grantViewer, b: KEEP_DECISION })).toEqual([
        {
          organizationalUnitId: 'a',
          groupName: 'a',
          level: 'viewer',
          change: 'add',
          count: 1,
          custom: false,
        },
      ]);
    });

    it('lets one dataset gain and lose at once and flags custom levels', () => {
      const selected = datasets({
        indicators: [indicatorSource('i', OWNER, ['a-viewer'], { s1: ['a-viewer'], s2: [] })],
      });
      const swap: GroupDecision = {
        viewer: 'custom',
        editor: 'keep',
        custom: {
          'indicatorspatialunits:i:s1': { viewer: false, editor: false },
          'indicatorspatialunits:i:s2': { viewer: true, editor: false },
        },
      };
      expect(
        summarize([a], selected, { a: swap }).map((l) => [l.change, l.count, l.custom])
      ).toEqual([
        ['add', 1, true],
        ['remove', 1, true],
      ]);
    });

    it('orders by group, then read before edit, then add before remove', () => {
      const selected = datasets({
        georesources: [
          georesourceSource('g1', OWNER, ['a-editor', 'b-editor']),
          georesourceSource('g2', OWNER, []),
        ],
      });
      const grantAll: GroupDecision = { viewer: 'grant', editor: 'grant' };
      const lines = summarize([b, a], selected, { a: revokeViewer, b: grantAll });
      expect(lines.map((l) => `${l.groupName}:${l.level}:${l.change}`)).toEqual([
        'b:viewer:add',
        'b:editor:add',
        'a:viewer:remove',
        'a:editor:remove',
      ]);
    });
  });

  describe('timeseriesCount', () => {
    it('counts the timeseries of an indicator and nothing for the other kinds', () => {
      const [withSeries, withoutSeries, georesource] = datasets({
        indicators: [
          indicatorSource('a', OWNER, [], { s1: [], s2: [] }),
          indicatorSource('b', OWNER, []),
        ],
        georesources: [georesourceSource('g', OWNER, [])],
      });
      expect([withSeries, withoutSeries, georesource].map(timeseriesCount)).toEqual([2, 0, 0]);
    });
  });

  describe('datasetKey', () => {
    it('keeps datasets of different kinds with the same id apart', () => {
      const [indicator, georesource] = datasets({
        indicators: [indicatorSource('x', OWNER, [])],
        georesources: [georesourceSource('x', OWNER, [])],
      });
      expect(datasetKey(indicator)).toBe('indicator:x');
      expect(datasetKey(georesource)).toBe('georesource:x');
    });
  });

  describe('changedDatasetCount', () => {
    it('counts an indicator once however many groups and timeseries change', () => {
      const selected = datasets({
        indicators: [indicatorSource('i', OWNER, [], { s1: [], s2: [] })],
        georesources: [georesourceSource('g', OWNER, ['a-viewer', 'b-viewer'])],
      });
      expect(changedDatasetCount([a, b], selected, { a: grantViewer, b: grantViewer })).toBe(1);
    });

    it('ignores groups without a decision and decisions that change nothing', () => {
      const selected = datasets({ georesources: [georesourceSource('g', OWNER, ['a-viewer'])] });
      expect(changedDatasetCount([a, b], selected, { a: grantViewer })).toBe(0);
      expect(changedDatasetCount([a], selected, {})).toBe(0);
    });

    it('counts a dataset that one group gains and another loses once', () => {
      const selected = datasets({
        georesources: [
          georesourceSource('g1', OWNER, ['b-viewer']),
          georesourceSource('g2', OWNER, ['b-viewer']),
        ],
      });
      expect(changedDatasetCount([a, b], selected, { a: grantViewer, b: revokeViewer })).toBe(2);
    });
  });

  describe('buildPermissionsPatch', () => {
    it('lists nothing for groups without a decision and for slots that do not change', () => {
      const selected = datasets({
        georesources: [
          georesourceSource('g1', OWNER, ['a-viewer']),
          georesourceSource('g2', OWNER, []),
        ],
      });
      expect(buildPermissionsPatch([a, b], selected, { a: grantViewer })).toEqual([
        {
          organizationalUnitId: 'a',
          permissions: { georesources: [{ id: 'g2', permissions: ['a-viewer'] }] },
        },
      ]);
      expect(buildPermissionsPatch([a, b], selected, { b: KEEP_DECISION })).toEqual([]);
    });

    it('sends back the group own other ids and never ids of another group', () => {
      const selected = datasets({
        spatialUnits: [
          spatialUnitSource('su', OWNER, ['a-creator', 'a-themes', 'a-viewer', 'b-editor']),
        ],
      });
      expect(
        buildPermissionsPatch([a], selected, { a: { viewer: 'keep', editor: 'grant' } })
      ).toEqual([
        {
          organizationalUnitId: 'a',
          permissions: {
            spatialunits: [
              { id: 'su', permissions: ['a-creator', 'a-themes', 'a-viewer', 'a-editor'] },
            ],
          },
        },
      ]);
    });

    it('revokes to the creator id alone, or to an empty list without one', () => {
      const selected = datasets({
        georesources: [
          georesourceSource('g1', OWNER, ['a-creator', 'a-editor', 'a-viewer']),
          georesourceSource('g2', OWNER, ['a-viewer']),
        ],
      });
      expect(buildPermissionsPatch([a], selected, { a: revokeViewer })).toEqual([
        {
          organizationalUnitId: 'a',
          permissions: {
            georesources: [
              { id: 'g1', permissions: ['a-creator'] },
              { id: 'g2', permissions: [] },
            ],
          },
        },
      ]);
    });

    it('lists an indicator without timeseries under indicators', () => {
      const selected = datasets({ indicators: [indicatorSource('i', OWNER, [])] });
      expect(buildPermissionsPatch([a], selected, { a: grantViewer })).toEqual([
        {
          organizationalUnitId: 'a',
          permissions: { indicators: [{ id: 'i', permissions: ['a-viewer'] }] },
        },
      ]);
    });

    describe('indicator level', () => {
      function patchFor(
        indicatorIds: string[],
        timeseries: Record<string, string[]>,
        decision: GroupDecision
      ) {
        const selected = datasets({
          indicators: [indicatorSource('i', OWNER, indicatorIds, timeseries)],
        });
        return only(buildPermissionsPatch([a], selected, { a: decision })).permissions;
      }

      it('grants the indicator a right that a timeseries receives', () => {
        expect(patchFor([], { s1: [], s2: [] }, grantViewer)).toEqual({
          indicatorspatialunits: [
            { id: 'i', spatialUnitId: 's1', permissions: ['a-viewer'] },
            { id: 'i', spatialUnitId: 's2', permissions: ['a-viewer'] },
          ],
          indicators: [{ id: 'i', permissions: ['a-viewer'] }],
        });
      });

      it('revokes it from the indicator once no timeseries keeps it', () => {
        expect(
          patchFor(['a-viewer', 'a-creator'], { s1: ['a-viewer'], s2: ['a-viewer'] }, revokeViewer)
        ).toEqual({
          indicatorspatialunits: [
            { id: 'i', spatialUnitId: 's1', permissions: [] },
            { id: 'i', spatialUnitId: 's2', permissions: [] },
          ],
          indicators: [{ id: 'i', permissions: ['a-creator'] }],
        });
      });

      it('leaves the indicator alone while one timeseries keeps the right', () => {
        const revokeOnS1: GroupDecision = {
          viewer: 'custom',
          editor: 'keep',
          custom: {
            'indicatorspatialunits:i:s1': { viewer: false, editor: false },
            'indicatorspatialunits:i:s2': { viewer: true, editor: false },
          },
        };
        expect(patchFor(['a-viewer'], { s1: ['a-viewer'], s2: ['a-viewer'] }, revokeOnS1)).toEqual({
          indicatorspatialunits: [{ id: 'i', spatialUnitId: 's1', permissions: [] }],
        });
      });

      it('derives only the levels that change on a timeseries', () => {
        // The indicator grants edit, its timeseries only read. Withdrawing read on
        // the timeseries changes no edit right there, so the indicator keeps edit
        // — and with it read — and is not listed.
        expect(patchFor(['a-viewer', 'a-editor'], { s1: ['a-viewer'] }, revokeViewer)).toEqual({
          indicatorspatialunits: [{ id: 'i', spatialUnitId: 's1', permissions: [] }],
        });
      });

      it('does not touch the indicator when no timeseries changes', () => {
        const selected = datasets({
          indicators: [indicatorSource('i', OWNER, [], { s1: ['a-viewer'] })],
        });
        expect(buildPermissionsPatch([a], selected, { a: grantViewer })).toEqual([]);
      });
    });
  });
});
