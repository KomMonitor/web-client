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
  datasetTargets,
  datasetsOfOwner,
  draftDeviates,
  draftState,
  initialDraft,
  levelSlots,
  resourcePermissionIds,
  samePatch,
  setDraftLevel,
  summarize,
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

    it('offers no unit when the owner has no tenant, rather than every unit of the instance', () => {
      expect(candidateGroups(accessControl, 'm', () => '')).toEqual([]);
      expect(candidateGroups(accessControl, 'unknown', mandantIdOf)).toEqual([]);
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

    it('gives an indicator one slot per timeseries and one for the indicator itself', () => {
      const indicator = all[1];
      expect(indicator.indicatorSlot).toEqual({
        key: 'indicators:i2',
        target: { section: 'indicators', id: 'i2' },
        permissions: ['a-viewer'],
      });
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
      expect(indicator.indicatorSlot).toBeUndefined();
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

    describe('releasing one side of a coupled pair', () => {
      const grantBoth: GroupDecision = { viewer: 'grant', editor: 'grant' };
      const revokeBoth: GroupDecision = { viewer: 'revoke', editor: 'revoke' };

      it('sets edit back to keep when read leaves grant', () => {
        expect(coupleAction(grantBoth, 'viewer', 'keep')).toEqual(KEEP_DECISION);
        expect(coupleAction(grantBoth, 'viewer', 'revoke')).toEqual(revokeBoth);
      });

      it('sets read back to keep when edit leaves revoke', () => {
        expect(coupleAction(revokeBoth, 'editor', 'keep')).toEqual(KEEP_DECISION);
        expect(coupleAction(revokeBoth, 'editor', 'grant')).toEqual(grantBoth);
      });

      it('leaves the other side alone when it was not coupled', () => {
        expect(coupleAction(grantViewer, 'viewer', 'keep')).toEqual(KEEP_DECISION);
        expect(coupleAction({ viewer: 'grant', editor: 'revoke' }, 'editor', 'keep')).toEqual(
          grantViewer
        );
        expect(coupleAction(grantBoth, 'editor', 'keep')).toEqual(grantViewer);
        expect(coupleAction(revokeBoth, 'viewer', 'keep')).toEqual({
          viewer: 'keep',
          editor: 'revoke',
        });
      });

      it('never leaves a dropdown showing an action the other one overrides', () => {
        const actions = ['keep', 'grant', 'revoke'] as const;
        for (const viewer of actions) {
          for (const editor of actions) {
            for (const level of ['viewer', 'editor'] as const) {
              for (const action of actions) {
                const next = coupleAction(
                  coupleAction(coupleAction(KEEP_DECISION, 'viewer', viewer), 'editor', editor),
                  level,
                  action
                );
                expect(next[level]).toBe(action);
                if (next.editor === 'grant') expect(next.viewer).toBe('grant');
                if (next.viewer === 'revoke') expect(next.editor).toBe('revoke');
              }
            }
          }
        }
      });

      it('drops the per-slot values once no level is custom', () => {
        const custom: GroupDecision = {
          viewer: 'custom',
          editor: 'keep',
          custom: { 'georesources:g1': { viewer: true, editor: false } },
        };
        expect(coupleAction(custom, 'viewer', 'grant')).toEqual(grantViewer);
        expect(coupleAction(custom, 'editor', 'revoke')).toEqual({
          viewer: 'custom',
          editor: 'revoke',
          custom: custom.custom,
        });
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

  describe('datasetTargets', () => {
    const [georesource] = datasets({ georesources: [georesourceSource('g', OWNER, ['a-viewer'])] });
    const targetOf = (decision?: GroupDecision) =>
      datasetTargets(a, georesource, decision).get('georesources:g');

    it('resolves keep, grant and revoke', () => {
      expect(targetOf()).toEqual({ viewer: true, editor: false });
      expect(targetOf({ viewer: 'keep', editor: 'grant' })).toEqual({ viewer: true, editor: true });
      expect(targetOf(revokeViewer)).toEqual({ viewer: false, editor: false });
    });

    it('reads custom levels from the draft and falls back to the current rights', () => {
      const custom: GroupDecision = {
        viewer: 'custom',
        editor: 'custom',
        custom: { 'georesources:g': { viewer: false, editor: false } },
      };
      expect(targetOf(custom)).toEqual({ viewer: false, editor: false });
      expect(targetOf({ ...custom, custom: {} })).toEqual({ viewer: true, editor: false });
    });

    it('never ends with edit but without read', () => {
      expect(targetOf({ viewer: 'revoke', editor: 'grant' })).toEqual({
        viewer: true,
        editor: true,
      });
    });

    describe('indicator with timeseries', () => {
      /** Target rights as `indicator | s1 | s2`, each `-`, `r` (read) or `e` (edit). */
      function targets(
        indicatorIds: string[],
        timeseries: Record<string, string[]>,
        decision?: GroupDecision
      ): string {
        const [indicator] = datasets({
          indicators: [indicatorSource('i', OWNER, indicatorIds, timeseries)],
        });
        const result = datasetTargets(a, indicator, decision);
        return ['indicators:i', ...indicator.slots.map((s) => s.key)]
          .map((key) => result.get(key)!)
          .map((r) => (r.editor ? 'e' : r.viewer ? 'r' : '-'))
          .join(' | ');
      }

      it('changes nothing under keep, however uneven the current rights are', () => {
        expect(targets(['a-editor'], { s1: ['a-viewer'], s2: [] })).toBe('e | r | -');
        expect(targets([], { s1: ['a-editor'], s2: [] })).toBe('- | e | -');
      });

      it('grants edit on the indicator and every timeseries, with read', () => {
        expect(
          targets([], { s1: [], s2: ['a-viewer'] }, { viewer: 'grant', editor: 'grant' })
        ).toBe('e | e | e');
      });

      it('revokes read and edit everywhere, the indicator itself included', () => {
        // P2 of the review: the indicator held read and edit, the timeseries only read.
        expect(targets(['a-viewer', 'a-editor'], { s1: ['a-viewer'] }, revokeViewer)).toBe('- | -');
        // P3: only the indicator itself was readable.
        expect(targets(['a-viewer'], { s1: [] }, revokeViewer)).toBe('- | -');
      });

      it('grants read on the indicator itself even where the timeseries had it already', () => {
        // P1 of the review.
        expect(targets([], { s1: ['a-viewer'] }, grantViewer)).toBe('r | r');
      });

      it('takes away edit only on the indicator when edit alone is revoked', () => {
        expect(
          targets(['a-editor'], { s1: ['a-editor'] }, { viewer: 'keep', editor: 'revoke' })
        ).toBe('r | r');
      });

      it('lets the indicator itself follow custom read only where read changes', () => {
        const readOnly = (s1: boolean, s2: boolean): GroupDecision => ({
          viewer: 'custom',
          editor: 'keep',
          custom: {
            'indicatorspatialunits:i:s1': { viewer: s1, editor: false },
            'indicatorspatialunits:i:s2': { viewer: s2, editor: false },
          },
        });
        expect(targets([], { s1: [], s2: [] }, readOnly(true, false))).toBe('r | r | -');
        expect(targets(['a-viewer'], { s1: ['a-viewer'], s2: [] }, readOnly(false, false))).toBe(
          '- | - | -'
        );
        // Nothing changes on the timeseries: the indicator keeps what it has.
        expect(targets(['a-viewer'], { s1: [], s2: [] }, readOnly(false, false))).toBe('r | - | -');
      });

      it('makes every timeseries readable where custom edit is newly given, not where it stays', () => {
        const edit = (value: boolean): GroupDecision => ({
          viewer: 'keep',
          editor: 'custom',
          custom: { 'indicators:i': { viewer: value, editor: value } },
        });
        expect(targets([], { s1: [], s2: [] }, edit(true))).toBe('e | e | e');
        expect(targets(['a-editor'], { s1: ['a-viewer'], s2: [] }, edit(true))).toBe('e | r | -');
      });

      it('drops edit on a timeseries whose read is taken away', () => {
        const noReadOnS1: GroupDecision = {
          viewer: 'custom',
          editor: 'keep',
          custom: { 'indicatorspatialunits:i:s1': { viewer: false, editor: false } },
        };
        expect(targets([], { s1: ['a-editor'], s2: ['a-viewer'] }, noReadOnS1)).toBe('r | - | r');
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

    it('counts an indicator as readable only on itself and every timeseries, editable on itself', () => {
      const selected = datasets({
        indicators: [
          indicatorSource('i1', OWNER, [], { s1: ['a-viewer'] }),
          indicatorSource('i2', OWNER, ['a-editor'], { s1: ['a-viewer'], s2: [] }),
          indicatorSource('i3', OWNER, ['a-viewer'], { s1: ['a-viewer'] }),
        ],
      });
      // P1 of the review: i1 only reads its timeseries, so it does not count as readable.
      expect(coverage(a, selected, undefined, 'viewer')).toMatchObject({ before: 1, after: 1 });
      expect(coverage(a, selected, grantViewer, 'viewer')).toMatchObject({
        before: 1,
        after: 3,
        changed: true,
      });
      expect(coverage(a, selected, undefined, 'editor')).toMatchObject({ before: 1, after: 1 });
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
      expect(initialDraft(a, selected, grantViewer)).toEqual({
        'georesources:g1': { viewer: true, editor: false },
        'georesources:g2': { viewer: true, editor: false },
      });
    });

    it('turns a draft equal to the current rights into keep', () => {
      expect(actionsFromDraft(a, selected, initialDraft(a, selected, undefined))).toEqual(
        KEEP_DECISION
      );
    });

    it('turns a uniform draft into grant or revoke, without a custom draft', () => {
      const allOn = {
        'georesources:g1': { viewer: true, editor: true },
        'georesources:g2': { viewer: true, editor: true },
      };
      expect(actionsFromDraft(a, selected, allOn)).toEqual({ viewer: 'grant', editor: 'grant' });
      const allOff = {
        'georesources:g1': { viewer: false, editor: false },
        'georesources:g2': { viewer: false, editor: false },
      };
      // Edit was off everywhere already, but revoking read revokes edit, too:
      // that way the decision also withdraws edit on datasets selected later.
      expect(actionsFromDraft(a, selected, allOff)).toEqual({
        viewer: 'revoke',
        editor: 'revoke',
      });
    });

    it('turns a mixed draft into custom and keeps the draft', () => {
      const mixed = {
        'georesources:g1': { viewer: false, editor: false },
        'georesources:g2': { viewer: true, editor: false },
      };
      expect(actionsFromDraft(a, selected, mixed)).toEqual({
        viewer: 'custom',
        editor: 'keep',
        custom: mixed,
      });
    });

    it('counts the checkboxes that differ from the current rights', () => {
      const draft = {
        'georesources:g1': { viewer: true, editor: true },
        'georesources:g2': { viewer: true, editor: true },
      };
      expect(countDeviations(a, selected, draft)).toBe(3);
    });

    it('resets to the current rights, reading an editor id as read access', () => {
      const [g3] = datasets({ georesources: [georesourceSource('g3', OWNER, ['a-editor'])] });
      expect(currentDraft(a, [g3, ...selected])).toEqual({
        'georesources:g3': { viewer: true, editor: true },
        'georesources:g1': { viewer: true, editor: false },
        'georesources:g2': { viewer: false, editor: false },
      });
    });

    it('sets a level on the given slots only, coupled like a single checkbox', () => {
      const [g1, g2] = slots;
      const edit = setDraftLevel(a, selected, [g2], {}, 'editor', true);
      expect(edit).toEqual({ 'georesources:g2': { viewer: true, editor: true } });

      // A slot missing from the draft starts from its current rights.
      const noRead = setDraftLevel(a, selected, [g1, g2], edit, 'viewer', false);
      expect(noRead).toEqual({
        'georesources:g1': { viewer: false, editor: false },
        'georesources:g2': { viewer: false, editor: false },
      });
    });

    it('tells the state of a collective checkbox over the draft', () => {
      const draft = currentDraft(a, selected);
      expect(draftState(a, slots, draft, 'viewer')).toBe('some');
      expect(draftState(a, slots, draft, 'editor')).toBe('none');
      expect(
        draftState(a, slots, setDraftLevel(a, selected, slots, draft, 'editor', true), 'viewer')
      ).toBe('all');
    });

    it('marks a level that differs from the current rights on any slot', () => {
      const [g1, g2] = slots;
      const draft = setDraftLevel(a, selected, [g2], currentDraft(a, selected), 'viewer', true);
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

    describe('on an indicator with timeseries', () => {
      const [indicator] = datasets({
        indicators: [indicatorSource('i', OWNER, [], { s1: ['a-viewer'], s2: [] })],
      });
      const [s1, s2] = indicator.slots;
      const self = indicator.indicatorSlot!;

      it('offers read per timeseries and edit on the indicator itself', () => {
        expect(levelSlots(indicator, 'viewer')).toEqual([s1, s2]);
        expect(levelSlots(indicator, 'editor')).toEqual([self]);
      });

      it('makes every timeseries readable along with edit on the indicator', () => {
        const draft = setDraftLevel(a, [indicator], [self], {}, 'editor', true);
        expect(draftState(a, [s1, s2], draft, 'viewer')).toBe('all');
        expect(draftState(a, [self], draft, 'editor')).toBe('all');
        expect(countDeviations(a, [indicator], draft)).toBe(2);
      });

      it('takes edit on the indicator away along with read on one timeseries', () => {
        const edit = setDraftLevel(a, [indicator], [self], {}, 'editor', true);
        const noRead = setDraftLevel(a, [indicator], [s2], edit, 'viewer', false);
        expect(draftState(a, [self], noRead, 'editor')).toBe('none');
        expect(draftState(a, [s1], noRead, 'viewer')).toBe('all');
      });

      it('turns the checkboxes into dropdown values', () => {
        const edit = setDraftLevel(a, [indicator], [self], {}, 'editor', true);
        expect(actionsFromDraft(a, [indicator], edit)).toEqual({
          viewer: 'grant',
          editor: 'grant',
        });
        const readS2 = setDraftLevel(a, [indicator], [s2], {}, 'viewer', true);
        expect(actionsFromDraft(a, [indicator], readS2)).toEqual({
          viewer: 'grant',
          editor: 'keep',
        });
      });
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

  describe('the cases of the review (appendix A) in summary and count', () => {
    const indicator = (ids: string[], s1: string[]) =>
      datasets({ indicators: [indicatorSource('i', OWNER, ids, { s1 })] });
    const lines = (selected: PermissionDataset[], decision: GroupDecision) =>
      summarize([a], selected, { a: decision }).map((l) => `${l.level}:${l.change}:${l.count}`);

    it('P2: reports read and edit lost, as the indicator loses both', () => {
      const selected = indicator(['a-viewer', 'a-editor'], ['a-viewer']);
      expect(lines(selected, revokeViewer)).toEqual(['viewer:remove:1', 'editor:remove:1']);
      expect(changedDatasetCount([a], selected, { a: revokeViewer })).toBe(1);
    });

    it('P3: reports read lost although no timeseries had it', () => {
      expect(lines(indicator(['a-viewer'], []), revokeViewer)).toEqual(['viewer:remove:1']);
    });

    it('P1: reports read gained on the indicator itself', () => {
      expect(lines(indicator([], ['a-viewer']), grantViewer)).toEqual(['viewer:add:1']);
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

      it('revokes read and edit on the indicator itself, too (P2 of the review)', () => {
        // Before: the timeseries lost read, the indicator kept read and edit.
        expect(patchFor(['a-viewer', 'a-editor'], { s1: ['a-viewer'] }, revokeViewer)).toEqual({
          indicators: [{ id: 'i', permissions: [] }],
          indicatorspatialunits: [{ id: 'i', spatialUnitId: 's1', permissions: [] }],
        });
      });

      it('revokes read that only the indicator itself has (P3 of the review)', () => {
        expect(patchFor(['a-viewer'], { s1: [] }, revokeViewer)).toEqual({
          indicators: [{ id: 'i', permissions: [] }],
        });
      });

      it('grants read on the indicator itself where the timeseries had it already (P1)', () => {
        expect(patchFor([], { s1: ['a-viewer'] }, grantViewer)).toEqual({
          indicators: [{ id: 'i', permissions: ['a-viewer'] }],
        });
      });

      it('grants edit on the indicator and on every timeseries', () => {
        expect(
          patchFor(
            ['a-creator'],
            { s1: [], s2: ['a-viewer'] },
            { viewer: 'grant', editor: 'grant' }
          )
        ).toEqual({
          indicators: [{ id: 'i', permissions: ['a-creator', 'a-viewer', 'a-editor'] }],
          indicatorspatialunits: [
            { id: 'i', spatialUnitId: 's1', permissions: ['a-viewer', 'a-editor'] },
            { id: 'i', spatialUnitId: 's2', permissions: ['a-viewer', 'a-editor'] },
          ],
        });
      });

      it('sends nothing for uneven current rights under keep', () => {
        const selected = datasets({
          indicators: [indicatorSource('i', OWNER, ['a-editor'], { s1: [], s2: ['a-editor'] })],
        });
        expect(buildPermissionsPatch([a], selected, { a: KEEP_DECISION })).toEqual([]);
      });
    });
  });
  describe('samePatch', () => {
    const patch = [
      {
        organizationalUnitId: 'a',
        permissions: {
          georesources: [
            { id: 'g1', permissions: ['a-viewer', 'a-creator'] },
            { id: 'g2', permissions: [] },
          ],
          indicatorspatialunits: [{ id: 'i', spatialUnitId: 's1', permissions: ['a-viewer'] }],
        },
      },
      { organizationalUnitId: 'b', permissions: { spatialunits: [{ id: 's1', permissions: [] }] } },
    ];

    it('ignores the order of groups, sections, elements and ids', () => {
      const reordered = [
        patch[1],
        {
          organizationalUnitId: 'a',
          permissions: {
            indicatorspatialunits: patch[0].permissions.indicatorspatialunits,
            georesources: [
              { id: 'g2', permissions: [] },
              { id: 'g1', permissions: ['a-creator', 'a-viewer'] },
            ],
          },
        },
      ];
      expect(samePatch(patch, reordered)).toBe(true);
      expect(samePatch([], [])).toBe(true);
    });

    it('tells apart a different id, element, timeseries or group', () => {
      const withIds = (ids: string[]) => [
        {
          ...patch[0],
          permissions: {
            ...patch[0].permissions,
            georesources: [
              { id: 'g1', permissions: ids },
              { id: 'g2', permissions: [] },
            ],
          },
        },
        patch[1],
      ];
      expect(samePatch(patch, withIds(['a-viewer']))).toBe(false);
      expect(samePatch(patch, [patch[0]])).toBe(false);
      expect(
        samePatch(patch, [
          {
            ...patch[0],
            permissions: {
              ...patch[0].permissions,
              indicatorspatialunits: [{ id: 'i', spatialUnitId: 's2', permissions: ['a-viewer'] }],
            },
          },
          patch[1],
        ])
      ).toBe(false);
      expect(samePatch(patch, [patch[0], { ...patch[1], organizationalUnitId: 'c' }])).toBe(false);
    });
  });
});
