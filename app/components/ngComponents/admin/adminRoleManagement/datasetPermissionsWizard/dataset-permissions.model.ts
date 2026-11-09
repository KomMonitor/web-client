import {
  IndicatorOverviewType,
  IndicatorSpatialUnitJoinItem,
  SpatialUnitOverviewType,
} from 'models/data-management-api';
import {
  AccessControlMetadata,
  AccessControlPermission,
} from 'components/ngComponents/models/permissions.models';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { ownersOfMandant } from 'components/ngComponents/admin/adminShared/roleManagementPanel/role-management-panel.model';

/**
 * Pure logic of the dataset-permissions wizard: an admin grants or revokes
 * read and edit rights of several groups on many datasets of one owner at
 * once, and the result is stored with a single
 * `PATCH /organizationalUnits/permissions`.
 *
 * Vocabulary:
 * - A **group** is an organizational unit that receives rights.
 * - A **slot** is one thing permissions are stored on: a georesource, a spatial
 *   unit, one timeseries of an indicator (indicator × spatial unit), or — for
 *   an indicator without any timeseries — the indicator itself.
 * - A **dataset** is what the user selects; it carries one or more slots.
 *
 * Nothing in here touches Angular, HTTP or the stores.
 */

export type RightLevel = 'viewer' | 'editor';
export const RIGHT_LEVELS: readonly RightLevel[] = ['viewer', 'editor'];

export interface Rights {
  viewer: boolean;
  editor: boolean;
}

/**
 * What the wizard does with one right of one group on all selected datasets.
 * `custom` is never picked directly: it results from per-dataset edits whose
 * values are not uniform (see `actionsFromDraft`).
 */
export type RightAction = 'keep' | 'grant' | 'revoke' | 'custom';

export type DatasetKind = 'indicator' | 'georesource' | 'spatialUnit';
export const DATASET_KINDS: readonly DatasetKind[] = ['indicator', 'georesource', 'spatialUnit'];

/** The resource permission ids of one group, resolved from the access-control list. */
export interface GroupPermissionIds {
  organizationalUnitId: string;
  name: string;
  viewerId: string;
  editorId: string;
  /**
   * Every permission id of the group, of any level and type. A slot entry may
   * only list ids of its own group (the endpoint answers 400 otherwise), and
   * the ids that are neither viewer nor editor — creator above all — must be
   * sent back unchanged, because the endpoint replaces the group's whole list.
   */
  ownIds: readonly string[];
}

/** The four lists of the PATCH body, named as the endpoint names them. */
export type PermissionSection =
  | 'georesources'
  | 'spatialunits'
  | 'indicators'
  | 'indicatorspatialunits';

export type SlotTarget =
  | { section: 'georesources' | 'spatialunits' | 'indicators'; id: string }
  | { section: 'indicatorspatialunits'; id: string; spatialUnitId: string };

export interface PermissionSlot {
  /** Stable key, used for per-slot drafts; derived from the target. */
  key: string;
  target: SlotTarget;
  /** Spatial unit name of an indicator timeseries; unset for the other slots. */
  label?: string;
  /** Current permission ids on this slot, of all groups. */
  permissions: readonly string[];
}

export interface PermissionDataset {
  kind: DatasetKind;
  id: string;
  name: string;
  /** Never empty. */
  slots: readonly PermissionSlot[];
  /**
   * Current permission ids on the indicator itself — set only for an indicator
   * with timeseries, whose slots are the timeseries. Its rights are derived
   * from them (see `buildPermissionsPatch`).
   */
  indicatorPermissions?: readonly string[];
}

export interface GroupDecision {
  viewer: RightAction;
  editor: RightAction;
  /** Per-slot values from the per-dataset dialog, read for the `custom` levels only. */
  custom?: Readonly<Record<string, Rights>>;
}

/** Decisions per organizational unit id; a group without an entry is left as it is. */
export type Decisions = Readonly<Record<string, GroupDecision>>;

export const KEEP_DECISION: GroupDecision = { viewer: 'keep', editor: 'keep' };

/** Per-slot rights of one group, keyed by slot key. */
export type RightsDraft = Readonly<Record<string, Rights>>;

export interface Coverage {
  /** Selected datasets on which the group currently has the right on every slot. */
  before: number;
  /** The same after applying the decision. */
  after: number;
  total: number;
  /** True when any slot changes, even if the counts stay equal. */
  changed: boolean;
}

export type TriState = 'all' | 'some' | 'none';

export interface SummaryLine {
  organizationalUnitId: string;
  groupName: string;
  level: RightLevel;
  change: 'add' | 'remove';
  /** Number of datasets, not slots: an indicator counts once. */
  count: number;
  /** The level's action is `custom`, i.e. it comes from per-dataset edits. */
  custom: boolean;
}

// The request body of PATCH /organizationalUnits/permissions, mirroring the
// backend's OrganizationalUnitPermissionInputType. Defined here until the
// endpoint is part of the vendored API spec; replace with the generated types
// then.
export interface PermissionPatchElement {
  id: string;
  permissions: string[];
}

export interface PermissionPatchSpatialUnitElement extends PermissionPatchElement {
  spatialUnitId: string;
}

export interface OrganizationalUnitPermissionPatch {
  organizationalUnitId: string;
  permissions: {
    georesources?: PermissionPatchElement[];
    spatialunits?: PermissionPatchElement[];
    indicators?: PermissionPatchElement[];
    indicatorspatialunits?: PermissionPatchSpatialUnitElement[];
  };
}

/** The store data `datasetsOfOwner` reads, narrowed to the fields it needs. */
export interface OwnerDatasetSources {
  indicators: readonly (Pick<
    IndicatorOverviewType,
    'indicatorId' | 'indicatorName' | 'ownerId' | 'permissions'
  > & {
    applicableSpatialUnits: readonly Pick<
      IndicatorSpatialUnitJoinItem,
      'spatialUnitId' | 'spatialUnitName' | 'permissions'
    >[];
  })[];
  georesources: readonly Pick<
    GeoresourcesDataset,
    'georesourceId' | 'datasetName' | 'ownerId' | 'permissions'
  >[];
  spatialUnits: readonly Pick<
    SpatialUnitOverviewType,
    'spatialUnitId' | 'spatialUnitLevel' | 'ownerId' | 'permissions'
  >[];
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/**
 * A group holds five permissions: viewer, editor and creator on resources, and
 * one creator each on themes and users. The type field really is spelled
 * `permissioneType` in the API. A missing type is read as resources, so the
 * viewer/editor lookup still works on data without it.
 */
function isResourcePermission(permission: AccessControlPermission): boolean {
  return permission.permissioneType === 'resources' || permission.permissioneType == null;
}

/** Resolves each group's resource viewer/editor ids; groups lacking either are left out. */
export function resourcePermissionIds(
  accessControl: readonly AccessControlMetadata[]
): GroupPermissionIds[] {
  const groups: GroupPermissionIds[] = [];
  for (const unit of accessControl ?? []) {
    const permissions = unit.permissions ?? [];
    const resource = permissions.filter(isResourcePermission);
    const viewerId = resource.find((p) => p.permissionLevel === 'viewer')?.permissionId;
    const editorId = resource.find((p) => p.permissionLevel === 'editor')?.permissionId;
    if (!viewerId || !editorId) {
      continue;
    }
    groups.push({
      organizationalUnitId: unit.organizationalUnitId,
      name: unit.name,
      viewerId,
      editorId,
      ownIds: permissions.map((p) => p.permissionId),
    });
  }
  return groups;
}

/**
 * The groups the wizard offers for an owner: every unit of the owner's tenant,
 * on all levels, except the owner itself — so for an owner below the tenant,
 * the tenant unit is among them. Sorted by name.
 */
export function candidateGroups(
  accessControl: readonly AccessControlMetadata[],
  ownerId: string,
  mandantIdOf: (organizationalUnitId: string) => string
): GroupPermissionIds[] {
  const units = ownersOfMandant(accessControl, mandantIdOf(ownerId), mandantIdOf).filter(
    (unit) => unit.organizationalUnitId !== ownerId
  );
  return resourcePermissionIds(units).sort(byName);
}

/**
 * The owner's datasets as the wizard works on them: indicators, then
 * georesources, then spatial units, each sorted by name.
 */
export function datasetsOfOwner(
  ownerId: string,
  sources: OwnerDatasetSources
): PermissionDataset[] {
  const indicators = sources.indicators
    .filter((indicator) => indicator.ownerId === ownerId)
    .map(indicatorDataset);
  const georesources = sources.georesources
    .filter((georesource) => georesource.ownerId === ownerId)
    .map(
      (georesource): PermissionDataset => ({
        kind: 'georesource',
        id: georesource.georesourceId,
        name: georesource.datasetName,
        slots: [
          makeSlot(
            { section: 'georesources', id: georesource.georesourceId },
            georesource.permissions
          ),
        ],
      })
    );
  const spatialUnits = sources.spatialUnits
    .filter((spatialUnit) => spatialUnit.ownerId === ownerId)
    .map(
      (spatialUnit): PermissionDataset => ({
        kind: 'spatialUnit',
        id: spatialUnit.spatialUnitId,
        name: spatialUnit.spatialUnitLevel,
        slots: [
          makeSlot(
            { section: 'spatialunits', id: spatialUnit.spatialUnitId },
            spatialUnit.permissions
          ),
        ],
      })
    );
  return [...indicators.sort(byName), ...georesources.sort(byName), ...spatialUnits.sort(byName)];
}

function indicatorDataset(indicator: OwnerDatasetSources['indicators'][number]): PermissionDataset {
  const id = indicator.indicatorId;
  const units = indicator.applicableSpatialUnits ?? [];
  if (units.length === 0) {
    // Without timeseries the indicator itself is the only thing to grant on.
    return {
      kind: 'indicator',
      id,
      name: indicator.indicatorName,
      slots: [makeSlot({ section: 'indicators', id }, indicator.permissions)],
    };
  }
  return {
    kind: 'indicator',
    id,
    name: indicator.indicatorName,
    indicatorPermissions: [...(indicator.permissions ?? [])],
    slots: units.map((unit) =>
      makeSlot(
        { section: 'indicatorspatialunits', id, spatialUnitId: unit.spatialUnitId },
        unit.permissions,
        unit.spatialUnitName
      )
    ),
  };
}

function makeSlot(
  target: SlotTarget,
  permissions: readonly string[] | null | undefined,
  label?: string
): PermissionSlot {
  return {
    key: slotKey(target),
    target,
    ...(label === undefined ? {} : { label }),
    permissions: [...(permissions ?? [])],
  };
}

/** Number of timeseries (spatial units) of an indicator; zero for every other dataset. */
export function timeseriesCount(dataset: PermissionDataset): number {
  return dataset.indicatorPermissions ? dataset.slots.length : 0;
}

/** Stable key of a dataset, unique across the three kinds; used for the selection. */
export function datasetKey(dataset: Pick<PermissionDataset, 'kind' | 'id'>): string {
  return `${dataset.kind}:${dataset.id}`;
}

export function slotKey(target: SlotTarget): string {
  return target.section === 'indicatorspatialunits'
    ? `${target.section}:${target.id}:${target.spatialUnitId}`
    : `${target.section}:${target.id}`;
}

function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name);
}

// ---------------------------------------------------------------------------
// Rights and coupling
// ---------------------------------------------------------------------------

/**
 * The rights a group holds by the given permission ids. Editing implies
 * reading, so an editor id alone already counts as read access — otherwise
 * data holding only the editor id would show a change nobody made.
 */
export function currentRights(group: GroupPermissionIds, ids: readonly string[]): Rights {
  const editor = ids.includes(group.editorId);
  return { viewer: editor || ids.includes(group.viewerId), editor };
}

/** Granting edit grants read; revoking read revokes edit. */
export function coupleAction(
  decision: GroupDecision,
  level: RightLevel,
  action: RightAction
): GroupDecision {
  const next: GroupDecision = { ...decision, [level]: action };
  if (level === 'editor' && action === 'grant') {
    next.viewer = 'grant';
  }
  if (level === 'viewer' && action === 'revoke') {
    next.editor = 'revoke';
  }
  return next;
}

/** The same coupling for a single checkbox: edit on sets read, read off clears edit. */
export function coupleRights(rights: Rights, level: RightLevel, value: boolean): Rights {
  const next: Rights = { ...rights, [level]: value };
  if (level === 'editor' && value) {
    next.viewer = true;
  }
  if (level === 'viewer' && !value) {
    next.editor = false;
  }
  return next;
}

/** The rights a group ends up with on a slot when the decision is applied. */
export function targetRights(
  group: GroupPermissionIds,
  slot: PermissionSlot,
  decision: GroupDecision = KEEP_DECISION
): Rights {
  const current = currentRights(group, slot.permissions);
  const resolve = (level: RightLevel): boolean => {
    switch (decision[level]) {
      case 'grant':
        return true;
      case 'revoke':
        return false;
      case 'custom':
        return decision.custom?.[slot.key]?.[level] ?? current[level];
      default:
        return current[level];
    }
  };
  const editor = resolve('editor');
  return { viewer: editor || resolve('viewer'), editor };
}

function sameRights(a: Rights, b: Rights): boolean {
  return a.viewer === b.viewer && a.editor === b.editor;
}

// ---------------------------------------------------------------------------
// Display values
// ---------------------------------------------------------------------------

/**
 * How many selected datasets the group has a right on, now and after the
 * decision. A dataset counts only when every one of its slots has the right.
 */
export function coverage(
  group: GroupPermissionIds,
  datasets: readonly PermissionDataset[],
  decision: GroupDecision | undefined,
  level: RightLevel
): Coverage {
  let before = 0;
  let after = 0;
  let changed = false;
  for (const dataset of datasets) {
    const current = dataset.slots.map((s) => currentRights(group, s.permissions)[level]);
    const target = dataset.slots.map((s) => targetRights(group, s, decision)[level]);
    if (current.every(Boolean)) {
      before++;
    }
    if (target.every(Boolean)) {
      after++;
    }
    if (current.some((value, index) => value !== target[index])) {
      changed = true;
    }
  }
  return { before, after, total: datasets.length, changed };
}

/** State of a collective checkbox over `total` items of which `count` are set. */
export function triState(count: number, total: number): TriState {
  if (count <= 0) {
    return 'none';
  }
  return count >= total ? 'all' : 'some';
}

/** The values the per-dataset dialog of one group opens with: the current target rights. */
export function initialDraft(
  group: GroupPermissionIds,
  slots: readonly PermissionSlot[],
  decision: GroupDecision | undefined
): RightsDraft {
  return Object.fromEntries(slots.map((s) => [s.key, targetRights(group, s, decision)]));
}

/**
 * The decision the per-dataset dialog hands back to the group table, per
 * level: nothing differs from now → keep; set everywhere → grant; cleared
 * everywhere → revoke; anything else → custom, which then reads the draft.
 */
export function actionsFromDraft(
  group: GroupPermissionIds,
  slots: readonly PermissionSlot[],
  draft: RightsDraft
): GroupDecision {
  const actionFor = (level: RightLevel): RightAction => {
    const values = slots.map((s) => draftValue(group, s, draft)[level]);
    if (slots.every((s, i) => values[i] === currentRights(group, s.permissions)[level])) {
      return 'keep';
    }
    if (values.every(Boolean)) {
      return 'grant';
    }
    return values.some(Boolean) ? 'custom' : 'revoke';
  };
  const viewer = actionFor('viewer');
  const editor = actionFor('editor');
  return viewer === 'custom' || editor === 'custom'
    ? { viewer, editor, custom: { ...draft } }
    : { viewer, editor };
}

/** Number of (slot, level) pairs in the draft that differ from the current rights. */
export function countDeviations(
  group: GroupPermissionIds,
  slots: readonly PermissionSlot[],
  draft: RightsDraft
): number {
  let deviations = 0;
  for (const s of slots) {
    const current = currentRights(group, s.permissions);
    const value = draftValue(group, s, draft);
    for (const level of RIGHT_LEVELS) {
      if (value[level] !== current[level]) {
        deviations++;
      }
    }
  }
  return deviations;
}

function draftValue(group: GroupPermissionIds, s: PermissionSlot, draft: RightsDraft): Rights {
  return draft[s.key] ?? currentRights(group, s.permissions);
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

/**
 * The review step's lines: per group and level, on how many datasets the
 * right is added and on how many it is removed. A dataset counts once even if
 * several of its slots change, and may count on both sides.
 */
export function summarize(
  groups: readonly GroupPermissionIds[],
  datasets: readonly PermissionDataset[],
  decisions: Decisions
): SummaryLine[] {
  const lines: SummaryLine[] = [];
  for (const group of groups) {
    const decision = decisions[group.organizationalUnitId];
    if (!decision) {
      continue;
    }
    for (const level of RIGHT_LEVELS) {
      let added = 0;
      let removed = 0;
      for (const dataset of datasets) {
        let gains = false;
        let loses = false;
        for (const s of dataset.slots) {
          const current = currentRights(group, s.permissions)[level];
          const target = targetRights(group, s, decision)[level];
          gains ||= target && !current;
          loses ||= !target && current;
        }
        added += gains ? 1 : 0;
        removed += loses ? 1 : 0;
      }
      const base = {
        organizationalUnitId: group.organizationalUnitId,
        groupName: group.name,
        level,
        custom: decision[level] === 'custom',
      };
      if (added > 0) {
        lines.push({ ...base, change: 'add', count: added });
      }
      if (removed > 0) {
        lines.push({ ...base, change: 'remove', count: removed });
      }
    }
  }
  return lines;
}

/**
 * On how many datasets any right of any group changes — the review step's
 * "affects n datasets". A dataset counts once however many groups, levels and
 * slots change on it; the indicator itself never changes on its own, so its
 * timeseries decide.
 */
export function changedDatasetCount(
  groups: readonly GroupPermissionIds[],
  datasets: readonly PermissionDataset[],
  decisions: Decisions
): number {
  const deciding = groups.filter((g) => decisions[g.organizationalUnitId]);
  return datasets.filter((dataset) =>
    deciding.some((group) =>
      dataset.slots.some(
        (s) =>
          !sameRights(
            currentRights(group, s.permissions),
            targetRights(group, s, decisions[group.organizationalUnitId])
          )
      )
    )
  ).length;
}

/**
 * The PATCH body. Only slots whose rights change are listed. Each lists the
 * group's complete wanted ids there: the group's other ids on the slot
 * (creator and the like) plus the target viewer/editor ids.
 *
 * The indicator itself is derived from its timeseries, per level and only
 * for a level that changes on at least one of them: it then has the right if
 * any timeseries has it afterwards. A level no timeseries changes keeps the
 * indicator's current value, so withdrawing read access on a timeseries never
 * withdraws edit access on the indicator as a side effect. The indicator is
 * listed only if its derived rights differ from its current ones.
 */
export function buildPermissionsPatch(
  groups: readonly GroupPermissionIds[],
  datasets: readonly PermissionDataset[],
  decisions: Decisions
): OrganizationalUnitPermissionPatch[] {
  const patch: OrganizationalUnitPermissionPatch[] = [];
  for (const group of groups) {
    const decision = decisions[group.organizationalUnitId];
    if (!decision) {
      continue;
    }
    const sections: OrganizationalUnitPermissionPatch['permissions'] = {};
    for (const dataset of datasets) {
      const changedLevels = new Set<RightLevel>();
      const targets: Rights[] = [];
      for (const s of dataset.slots) {
        const current = currentRights(group, s.permissions);
        const target = targetRights(group, s, decision);
        targets.push(target);
        if (sameRights(current, target)) {
          continue;
        }
        RIGHT_LEVELS.filter((level) => current[level] !== target[level]).forEach((level) =>
          changedLevels.add(level)
        );
        addElement(sections, s.target, wantedIds(group, s.permissions, target));
      }
      if (dataset.indicatorPermissions && changedLevels.size > 0) {
        const current = currentRights(group, dataset.indicatorPermissions);
        const derive = (level: RightLevel): boolean =>
          changedLevels.has(level) ? targets.some((t) => t[level]) : current[level];
        const editor = derive('editor');
        const derived: Rights = { viewer: editor || derive('viewer'), editor };
        if (!sameRights(current, derived)) {
          addElement(
            sections,
            { section: 'indicators', id: dataset.id },
            wantedIds(group, dataset.indicatorPermissions, derived)
          );
        }
      }
    }
    if (Object.keys(sections).length > 0) {
      patch.push({ organizationalUnitId: group.organizationalUnitId, permissions: sections });
    }
  }
  return patch;
}

function wantedIds(
  group: GroupPermissionIds,
  currentIds: readonly string[],
  target: Rights
): string[] {
  const ids = new Set(
    currentIds.filter(
      (id) => group.ownIds.includes(id) && id !== group.viewerId && id !== group.editorId
    )
  );
  if (target.viewer) {
    ids.add(group.viewerId);
  }
  if (target.editor) {
    ids.add(group.editorId);
  }
  return [...ids];
}

function addElement(
  sections: OrganizationalUnitPermissionPatch['permissions'],
  target: SlotTarget,
  permissions: string[]
): void {
  if (target.section === 'indicatorspatialunits') {
    (sections.indicatorspatialunits ??= []).push({
      id: target.id,
      spatialUnitId: target.spatialUnitId,
      permissions,
    });
  } else {
    (sections[target.section] ??= []).push({ id: target.id, permissions });
  }
}
