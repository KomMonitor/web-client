import {
  IndicatorOverviewType,
  IndicatorSpatialUnitJoinItem,
  OrganizationalUnitPermissionInputType,
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
 *   unit, an indicator itself, or one timeseries of an indicator
 *   (indicator × spatial unit).
 * - A **dataset** is what the user selects; it carries one or more slots.
 *
 * Indicators with timeseries follow what the backend enforces: reading the
 * indicator itself decides whether it is listed at all, reading a timeseries
 * whether its values can be fetched, and editing the indicator itself allows
 * writing its metadata and the values of every timeseries. So read access is
 * set per timeseries, and edit access only for the whole indicator — on the
 * indicator and all its timeseries, where edit only allows deleting them.
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
export type PermissionSection = keyof OrganizationalUnitPermissionInputType['permissions'];

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
  /**
   * Set when anyone may read the slot (`isPublic`). Read rights of groups do
   * not matter there then, and the wizard cannot change it.
   */
  isPublic?: true;
}

export interface PermissionDataset {
  kind: DatasetKind;
  id: string;
  name: string;
  /** Never empty. For an indicator with timeseries, the timeseries. */
  slots: readonly PermissionSlot[];
  /**
   * The indicator itself — set only for an indicator with timeseries, next to
   * them in `slots`. It carries the edit right of the whole indicator; its
   * read right follows the timeseries (see `datasetTargets`).
   */
  indicatorSlot?: PermissionSlot;
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

/** The store data `datasetsOfOwner` reads, narrowed to the fields it needs. */
export interface OwnerDatasetSources {
  indicators: readonly (Pick<
    IndicatorOverviewType,
    'indicatorId' | 'indicatorName' | 'ownerId' | 'permissions'
  > &
    Partial<Pick<IndicatorOverviewType, 'isPublic'>> & {
      applicableSpatialUnits: readonly Pick<
        IndicatorSpatialUnitJoinItem,
        'spatialUnitId' | 'spatialUnitName' | 'permissions' | 'isPublic'
      >[];
    })[];
  georesources: readonly (Pick<
    GeoresourcesDataset,
    'georesourceId' | 'datasetName' | 'ownerId' | 'permissions'
  > &
    Partial<Pick<GeoresourcesDataset, 'isPublic'>>)[];
  spatialUnits: readonly (Pick<
    SpatialUnitOverviewType,
    'spatialUnitId' | 'spatialUnitLevel' | 'ownerId' | 'permissions'
  > &
    Partial<Pick<SpatialUnitOverviewType, 'isPublic'>>)[];
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
 *
 * None when the owner's tenant cannot be determined. `ownersOfMandant` would
 * then return every unit of the instance, and the endpoint does not check
 * tenant boundaries, so rights could go to groups of other tenants unnoticed.
 */
export function candidateGroups(
  accessControl: readonly AccessControlMetadata[],
  ownerId: string,
  mandantIdOf: (organizationalUnitId: string) => string
): GroupPermissionIds[] {
  const mandantId = mandantIdOf(ownerId);
  if (!mandantId) {
    return [];
  }
  const units = ownersOfMandant(accessControl, mandantId, mandantIdOf).filter(
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
            georesource.permissions,
            undefined,
            georesource.isPublic
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
            spatialUnit.permissions,
            undefined,
            spatialUnit.isPublic
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
      slots: [
        makeSlot(
          { section: 'indicators', id },
          indicator.permissions,
          undefined,
          indicator.isPublic
        ),
      ],
    };
  }
  return {
    kind: 'indicator',
    id,
    name: indicator.indicatorName,
    indicatorSlot: makeSlot(
      { section: 'indicators', id },
      indicator.permissions,
      undefined,
      indicator.isPublic
    ),
    slots: units.map((unit) =>
      makeSlot(
        { section: 'indicatorspatialunits', id, spatialUnitId: unit.spatialUnitId },
        unit.permissions,
        unit.spatialUnitName,
        unit.isPublic
      )
    ),
  };
}

function makeSlot(
  target: SlotTarget,
  permissions: readonly string[] | null | undefined,
  label?: string,
  isPublic?: boolean | null
): PermissionSlot {
  return {
    key: slotKey(target),
    target,
    ...(label === undefined ? {} : { label }),
    permissions: [...(permissions ?? [])],
    ...(isPublic ? { isPublic: true as const } : {}),
  };
}

/**
 * How much of the dataset anyone may read anyway: all, some or none of its
 * slots — for an indicator, the indicator itself and its timeseries.
 */
export function publicState(dataset: PermissionDataset): TriState {
  const slots = allSlots(dataset);
  return triState(slots.filter((s) => s.isPublic).length, slots.length);
}

/** Number of timeseries (spatial units) of an indicator; zero for every other dataset. */
export function timeseriesCount(dataset: PermissionDataset): number {
  return dataset.indicatorSlot ? dataset.slots.length : 0;
}

/** Every slot of the dataset that permissions are written to, the indicator itself first. */
export function allSlots(dataset: PermissionDataset): readonly PermissionSlot[] {
  return dataset.indicatorSlot ? [dataset.indicatorSlot, ...dataset.slots] : dataset.slots;
}

/**
 * The slots on which the user sets a level — the checkboxes of the
 * per-dataset dialog: read per timeseries, edit on the indicator itself.
 */
export function levelSlots(
  dataset: PermissionDataset,
  level: RightLevel
): readonly PermissionSlot[] {
  if (!dataset.indicatorSlot) {
    return dataset.slots;
  }
  return level === 'editor' ? [dataset.indicatorSlot] : dataset.slots;
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

/**
 * Sets one level's dropdown and keeps both in line with "editing includes
 * reading": granting edit grants read, revoking read revokes edit. Moving one
 * side of such a pair away releases the other side to keep — read set back
 * from grant while edit is granted, or edit set back from revoke while read
 * is revoked — so no dropdown shows an action the other one overrides.
 */
export function coupleAction(
  decision: GroupDecision,
  level: RightLevel,
  action: RightAction
): GroupDecision {
  const next: GroupDecision = { ...decision, [level]: action };
  if (level === 'viewer' && decision.editor === 'grant' && action !== 'grant') {
    next.editor = 'keep';
  }
  if (level === 'editor' && decision.viewer === 'revoke' && action !== 'revoke') {
    next.viewer = 'keep';
  }
  return withCustomOnlyIfUsed(coupleDecision(next));
}

/** Edit granted ⇒ read granted; read revoked ⇒ edit revoked. */
function coupleDecision(decision: GroupDecision): GroupDecision {
  let next = decision;
  if (next.editor === 'grant' && next.viewer !== 'grant') {
    next = { ...next, viewer: 'grant' };
  }
  if (next.viewer === 'revoke' && next.editor !== 'revoke') {
    next = { ...next, editor: 'revoke' };
  }
  return next;
}

/** Drops the per-slot values once no level reads them any more. */
function withCustomOnlyIfUsed(decision: GroupDecision): GroupDecision {
  if (decision.viewer === 'custom' || decision.editor === 'custom' || !decision.custom) {
    return decision;
  }
  return { viewer: decision.viewer, editor: decision.editor };
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

/**
 * The rights a group ends up with on every slot of the dataset when the
 * decision is applied, keyed by slot key. Everything shown and sent derives
 * from this, so display and PATCH cannot drift apart.
 *
 * An indicator with timeseries:
 * - Edit is one value for the whole indicator: the decision, or under
 *   `custom` the dialog's value on the indicator itself.
 * - Read is per timeseries. Where edit is newly given — or granted
 *   explicitly — every timeseries becomes readable, too: writing values one
 *   cannot read makes no sense.
 * - Edit on a timeseries follows the indicator once edit is decided for it.
 *   Otherwise it stays, except where read is taken away.
 * - The indicator itself is readable when read is granted, not when it is
 *   revoked; else as soon as any timeseries is readable, if read changes on
 *   any of them, and as it is when not. Edit implies it.
 */
export function datasetTargets(
  group: GroupPermissionIds,
  dataset: PermissionDataset,
  decision: GroupDecision = KEEP_DECISION
): ReadonlyMap<string, Rights> {
  const indicator = dataset.indicatorSlot;
  if (!indicator) {
    return new Map(
      dataset.slots.map((s) => {
        const current = currentRights(group, s.permissions);
        const custom = decision.custom?.[s.key];
        const editor = resolveAction(decision.editor, current.editor, custom?.editor);
        return [
          s.key,
          {
            viewer: editor || resolveAction(decision.viewer, current.viewer, custom?.viewer),
            editor,
          },
        ];
      })
    );
  }
  const currentIndicator = currentRights(group, indicator.permissions);
  const edit = resolveAction(
    decision.editor,
    currentIndicator.editor,
    decision.custom?.[indicator.key]?.editor
  );
  const editDecided =
    decision.editor === 'grant' || decision.editor === 'revoke' || edit !== currentIndicator.editor;
  const targets = new Map<string, Rights>();
  let readChanged = false;
  let anyRead = false;
  for (const s of dataset.slots) {
    const current = currentRights(group, s.permissions);
    const read =
      (editDecided && edit) ||
      resolveAction(decision.viewer, current.viewer, decision.custom?.[s.key]?.viewer);
    const editor = editDecided ? edit : current.editor && read;
    targets.set(s.key, { viewer: read || editor, editor });
    readChanged ||= read !== current.viewer;
    anyRead ||= read;
  }
  let indicatorRead: boolean;
  if (decision.viewer === 'grant') {
    indicatorRead = true;
  } else if (decision.viewer === 'revoke') {
    indicatorRead = false;
  } else {
    indicatorRead = readChanged ? anyRead : currentIndicator.viewer;
  }
  targets.set(indicator.key, { viewer: edit || indicatorRead, editor: edit });
  return targets;
}

function resolveAction(
  action: RightAction,
  current: boolean,
  custom: boolean | undefined
): boolean {
  switch (action) {
    case 'grant':
      return true;
    case 'revoke':
      return false;
    case 'custom':
      return custom ?? current;
    default:
      return current;
  }
}

function currentTargets(
  group: GroupPermissionIds,
  dataset: PermissionDataset
): ReadonlyMap<string, Rights> {
  return new Map(allSlots(dataset).map((s) => [s.key, currentRights(group, s.permissions)]));
}

/**
 * Whether the group has the level on the dataset: on every slot, but for an
 * indicator with timeseries edit only on the indicator itself — the only edit
 * that the backend checks for writing.
 */
function hasLevel(
  dataset: PermissionDataset,
  rights: ReadonlyMap<string, Rights>,
  level: RightLevel
): boolean {
  const slots =
    level === 'editor' && dataset.indicatorSlot ? [dataset.indicatorSlot] : allSlots(dataset);
  return slots.every((s) => rights.get(s.key)![level]);
}

function sameRights(a: Rights, b: Rights): boolean {
  return a.viewer === b.viewer && a.editor === b.editor;
}

// ---------------------------------------------------------------------------
// Display values
// ---------------------------------------------------------------------------

/**
 * How many selected datasets the group has a right on, now and after the
 * decision (see `hasLevel`): an indicator counts as readable only when it is
 * readable itself and on every timeseries.
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
    const current = currentTargets(group, dataset);
    const target = datasetTargets(group, dataset, decision);
    before += hasLevel(dataset, current, level) ? 1 : 0;
    after += hasLevel(dataset, target, level) ? 1 : 0;
    changed ||= allSlots(dataset).some(
      (s) => current.get(s.key)![level] !== target.get(s.key)![level]
    );
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
  datasets: readonly PermissionDataset[],
  decision: GroupDecision | undefined
): RightsDraft {
  return Object.fromEntries(
    datasets.flatMap((dataset) => [...datasetTargets(group, dataset, decision)])
  );
}

/** The dialog's checkboxes of one level over the datasets (see `levelSlots`). */
function levelCells(
  datasets: readonly PermissionDataset[],
  level: RightLevel
): readonly PermissionSlot[] {
  return datasets.flatMap((dataset) => levelSlots(dataset, level));
}

/**
 * The decision the per-dataset dialog hands back to the group table, per
 * level over the dialog's checkboxes: nothing differs from now → keep; set
 * everywhere → grant; cleared everywhere → revoke; anything else → custom,
 * which then reads the draft.
 *
 * Then coupled like the dropdowns: read cleared everywhere also revokes edit,
 * even where edit was off already and would come out as keep. For the slots
 * of the draft that changes nothing; for datasets selected afterwards it
 * makes "revoke read" withdraw edit there as well.
 */
export function actionsFromDraft(
  group: GroupPermissionIds,
  datasets: readonly PermissionDataset[],
  draft: RightsDraft
): GroupDecision {
  const actionFor = (level: RightLevel): RightAction => {
    const cells = levelCells(datasets, level);
    const values = cells.map((s) => draftValue(group, s, draft)[level]);
    if (cells.every((s, i) => values[i] === currentRights(group, s.permissions)[level])) {
      return 'keep';
    }
    if (values.every(Boolean)) {
      return 'grant';
    }
    return values.some(Boolean) ? 'custom' : 'revoke';
  };
  const { viewer, editor } = coupleDecision({
    viewer: actionFor('viewer'),
    editor: actionFor('editor'),
  });
  return viewer === 'custom' || editor === 'custom'
    ? { viewer, editor, custom: { ...draft } }
    : { viewer, editor };
}

/** Number of checkboxes in the draft that differ from the current rights. */
export function countDeviations(
  group: GroupPermissionIds,
  datasets: readonly PermissionDataset[],
  draft: RightsDraft
): number {
  let deviations = 0;
  for (const level of RIGHT_LEVELS) {
    for (const s of levelCells(datasets, level)) {
      if (draftValue(group, s, draft)[level] !== currentRights(group, s.permissions)[level]) {
        deviations++;
      }
    }
  }
  return deviations;
}

function draftValue(group: GroupPermissionIds, s: PermissionSlot, draft: RightsDraft): Rights {
  return draft[s.key] ?? currentRights(group, s.permissions);
}

/** The current rights as a draft — what "reset to current" in the per-dataset dialog restores. */
export function currentDraft(
  group: GroupPermissionIds,
  datasets: readonly PermissionDataset[]
): RightsDraft {
  return initialDraft(group, datasets, undefined);
}

/**
 * Sets one level on the given checkboxes (see `levelSlots`), coupled so that
 * edit includes read: edit on sets read, read off clears edit. On an
 * indicator with timeseries the two sit on different slots — edit on the
 * indicator sets read on all its timeseries, read off on a timeseries clears
 * edit on the indicator. Slots not given stay as they are.
 */
export function setDraftLevel(
  group: GroupPermissionIds,
  datasets: readonly PermissionDataset[],
  slots: readonly PermissionSlot[],
  draft: RightsDraft,
  level: RightLevel,
  value: boolean
): RightsDraft {
  const timeseriesOf = new Map<string, readonly PermissionSlot[]>();
  const indicatorOf = new Map<string, PermissionSlot>();
  for (const dataset of datasets) {
    if (dataset.indicatorSlot) {
      timeseriesOf.set(dataset.indicatorSlot.key, dataset.slots);
      dataset.slots.forEach((s) => indicatorOf.set(s.key, dataset.indicatorSlot!));
    }
  }
  const next: Record<string, Rights> = { ...draft };
  const set = (s: PermissionSlot, changed: Partial<Rights>) => {
    next[s.key] = { ...draftValue(group, s, next), ...changed };
  };
  for (const s of slots) {
    const timeseries = timeseriesOf.get(s.key);
    const indicator = indicatorOf.get(s.key);
    if (timeseries) {
      set(s, { editor: value });
      if (value) {
        timeseries.forEach((t) => set(t, { viewer: true }));
      }
    } else if (indicator) {
      set(s, { viewer: value });
      if (!value) {
        set(indicator, { editor: false });
      }
    } else {
      next[s.key] = coupleRights(draftValue(group, s, next), level, value);
    }
  }
  return next;
}

/** State of a collective checkbox over the given slots in the draft. */
export function draftState(
  group: GroupPermissionIds,
  slots: readonly PermissionSlot[],
  draft: RightsDraft,
  level: RightLevel
): TriState {
  return triState(slots.filter((s) => draftValue(group, s, draft)[level]).length, slots.length);
}

/** Whether the draft differs from the current rights on any of the given slots at this level. */
export function draftDeviates(
  group: GroupPermissionIds,
  slots: readonly PermissionSlot[],
  draft: RightsDraft,
  level: RightLevel
): boolean {
  return slots.some(
    (s) => draftValue(group, s, draft)[level] !== currentRights(group, s.permissions)[level]
  );
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
    const changes = datasets.map((dataset) => ({
      dataset,
      current: currentTargets(group, dataset),
      target: datasetTargets(group, dataset, decision),
    }));
    for (const level of RIGHT_LEVELS) {
      let added = 0;
      let removed = 0;
      for (const { dataset, current, target } of changes) {
        const slots = allSlots(dataset);
        added += slots.some((s) => target.get(s.key)![level] && !current.get(s.key)![level])
          ? 1
          : 0;
        removed += slots.some((s) => !target.get(s.key)![level] && current.get(s.key)![level])
          ? 1
          : 0;
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
 * slots change on it.
 */
export function changedDatasetCount(
  groups: readonly GroupPermissionIds[],
  datasets: readonly PermissionDataset[],
  decisions: Decisions
): number {
  const deciding = groups.filter((g) => decisions[g.organizationalUnitId]);
  return datasets.filter((dataset) =>
    deciding.some(
      (group) => changedSlots(group, dataset, decisions[group.organizationalUnitId]).length > 0
    )
  ).length;
}

/**
 * On how many datasets a group loses read access to a public slot — where the
 * loss has no effect, as anyone may read the slot anyway.
 */
export function publicReadLossCount(
  groups: readonly GroupPermissionIds[],
  datasets: readonly PermissionDataset[],
  decisions: Decisions
): number {
  const deciding = groups.filter((g) => decisions[g.organizationalUnitId]);
  return datasets.filter((dataset) =>
    deciding.some((group) =>
      changedSlots(group, dataset, decisions[group.organizationalUnitId]).some(
        ({ slot, target }) =>
          slot.isPublic && !target.viewer && currentRights(group, slot.permissions).viewer
      )
    )
  ).length;
}

/** The slots of the dataset whose rights change, with their target rights. */
function changedSlots(
  group: GroupPermissionIds,
  dataset: PermissionDataset,
  decision: GroupDecision
): { slot: PermissionSlot; target: Rights }[] {
  const target = datasetTargets(group, dataset, decision);
  return allSlots(dataset)
    .filter((s) => !sameRights(currentRights(group, s.permissions), target.get(s.key)!))
    .map((s) => ({ slot: s, target: target.get(s.key)! }));
}

/**
 * The PATCH body. Only slots whose rights change are listed (see
 * `datasetTargets`). Each lists the group's complete wanted ids there: the
 * group's other ids on the slot (creator and the like) plus the target
 * viewer/editor ids.
 */
export function buildPermissionsPatch(
  groups: readonly GroupPermissionIds[],
  datasets: readonly PermissionDataset[],
  decisions: Decisions
): OrganizationalUnitPermissionInputType[] {
  const patch: OrganizationalUnitPermissionInputType[] = [];
  for (const group of groups) {
    const decision = decisions[group.organizationalUnitId];
    if (!decision) {
      continue;
    }
    const sections: OrganizationalUnitPermissionInputType['permissions'] = {};
    for (const dataset of datasets) {
      for (const { slot, target } of changedSlots(group, dataset, decision)) {
        addElement(sections, slot.target, wantedIds(group, slot.permissions, target));
      }
    }
    if (Object.keys(sections).length > 0) {
      patch.push({ organizationalUnitId: group.organizationalUnitId, permissions: sections });
    }
  }
  return patch;
}

/**
 * Whether two PATCH bodies write the same. Order does not matter — not of the
 * groups, the elements or the ids — since the endpoint treats each element on
 * its own and each list as a set.
 */
export function samePatch(
  a: readonly OrganizationalUnitPermissionInputType[],
  b: readonly OrganizationalUnitPermissionInputType[]
): boolean {
  return canonicalPatch(a) === canonicalPatch(b);
}

function canonicalPatch(patch: readonly OrganizationalUnitPermissionInputType[]): string {
  const entries = patch.map((entry) => {
    const sections = (Object.keys(entry.permissions) as PermissionSection[])
      .filter((section) => (entry.permissions[section] ?? []).length > 0)
      .sort()
      .map((section) => {
        const elements = (entry.permissions[section] ?? []).map((element) => {
          const spatialUnitId = 'spatialUnitId' in element ? element.spatialUnitId : '';
          return JSON.stringify([element.id, spatialUnitId, [...element.permissions].sort()]);
        });
        return [section, elements.sort()];
      });
    return JSON.stringify([entry.organizationalUnitId, sections]);
  });
  return JSON.stringify(entries.sort());
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
  sections: OrganizationalUnitPermissionInputType['permissions'],
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
