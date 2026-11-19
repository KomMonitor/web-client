import { InjectionToken, inject } from '@angular/core';

import type { LayerEntryState, LayerId, LayerTreeNode } from './map-layer.model';
import type { MapLayerRegistry } from './map-layer-registry';

/**
 * An entry of the ⋮ menu of a layer. The menu renders whatever applies to a
 * layer and knows no layer types; sources add their own actions through
 * `MAP_LAYER_ACTIONS`. `appliesTo` decides whether the action is listed,
 * `enabled` whether it can be chosen right now.
 */
export interface LayerAction {
  id: string;
  i18nKey: string;
  /** Font Awesome classes, e.g. 'fas fa-xmark'. */
  icon: string;
  /** Position in the menu, ascending. */
  order: number;
  appliesTo(entry: LayerEntryState, registry: MapLayerRegistry): boolean;
  enabled?(entry: LayerEntryState, registry: MapLayerRegistry): boolean;
  run(entry: LayerEntryState, registry: MapLayerRegistry): void | Promise<void>;
}

/** An entry of the ⋮ menu of a group; the same as `LayerAction`, for a group of the tree. */
export interface LayerGroupAction {
  id: string;
  i18nKey: string;
  icon: string;
  order: number;
  appliesTo(node: LayerTreeNode, registry: MapLayerRegistry): boolean;
  enabled?(node: LayerTreeNode, registry: MapLayerRegistry): boolean;
  run(node: LayerTreeNode, registry: MapLayerRegistry): void | Promise<void>;
}

/**
 * Further layer actions, e.g. from a source:
 * `{ provide: MAP_LAYER_ACTIONS, multi: true, useValue: action }`.
 * The defaults are always there and need no provider.
 */
export const MAP_LAYER_ACTIONS = new InjectionToken<
  readonly (LayerAction | readonly LayerAction[])[]
>('MAP_LAYER_ACTIONS');

/** Further group actions, provided like `MAP_LAYER_ACTIONS`. */
export const MAP_LAYER_GROUP_ACTIONS = new InjectionToken<
  readonly (LayerGroupAction | readonly LayerGroupAction[])[]
>('MAP_LAYER_GROUP_ACTIONS');

/** Where an entry sits in its list, and whether the user may move it there. */
export interface EntryListPosition {
  /** 0 = top. */
  index: number;
  /** Number of entries in the list. */
  size: number;
  /** The group is sortable and the entry may be reordered. */
  movable: boolean;
}

/** Finds the list of `id` in the tree; undefined for unknown ids. */
export function entryListPosition(
  tree: readonly LayerTreeNode[],
  id: LayerId
): EntryListPosition | undefined {
  for (const node of tree) {
    const index = node.entries.findIndex((entry) => entry.id === id);
    if (index >= 0) {
      return {
        index,
        size: node.entries.length,
        movable: node.group.sortable !== false && node.entries[index].capabilities.reorder,
      };
    }
    const nested = entryListPosition(node.children, id);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

/** Index of a top-level group, -1 for sub groups. */
function groupIndex(registry: MapLayerRegistry, node: LayerTreeNode): number {
  return registry.tree().findIndex((top) => top.group.id === node.group.id);
}

function canMove(entry: LayerEntryState, registry: MapLayerRegistry): boolean {
  const position = entryListPosition(registry.tree(), entry.id);
  return !!position && position.movable && position.size > 1;
}

function moveBy(entry: LayerEntryState, registry: MapLayerRegistry, delta: number): void {
  const position = entryListPosition(registry.tree(), entry.id);
  if (position) {
    registry.moveEntry(entry.id, position.index + delta);
  }
}

export const DEFAULT_LAYER_ACTIONS: readonly LayerAction[] = [
  {
    id: 'zoomTo',
    i18nKey: 'MAP_LAYERS.ACTIONS.ZOOM_TO',
    icon: 'fas fa-magnifying-glass-location',
    order: 10,
    appliesTo: (entry) => entry.capabilities.zoomTo,
    enabled: (entry, registry) => registry.canZoomTo(entry.id),
    run: (entry, registry) => registry.zoomTo(entry.id),
  },
  {
    id: 'moveUp',
    i18nKey: 'MAP_LAYERS.ACTIONS.MOVE_UP',
    icon: 'fas fa-arrow-up',
    order: 30,
    appliesTo: canMove,
    enabled: (entry, registry) => (entryListPosition(registry.tree(), entry.id)?.index ?? 0) > 0,
    run: (entry, registry) => moveBy(entry, registry, -1),
  },
  {
    id: 'moveDown',
    i18nKey: 'MAP_LAYERS.ACTIONS.MOVE_DOWN',
    icon: 'fas fa-arrow-down',
    order: 40,
    appliesTo: canMove,
    enabled: (entry, registry) => {
      const position = entryListPosition(registry.tree(), entry.id);
      return !!position && position.index < position.size - 1;
    },
    run: (entry, registry) => moveBy(entry, registry, 1),
  },
  {
    id: 'remove',
    i18nKey: 'MAP_LAYERS.ACTIONS.REMOVE',
    icon: 'fas fa-xmark',
    order: 90,
    appliesTo: (entry) => entry.capabilities.remove,
    run: (entry, registry) => registry.remove(entry.id),
  },
];

export const DEFAULT_LAYER_GROUP_ACTIONS: readonly LayerGroupAction[] = [
  {
    id: 'moveGroupUp',
    i18nKey: 'MAP_LAYERS.ACTIONS.MOVE_UP',
    icon: 'fas fa-arrow-up',
    order: 30,
    appliesTo: (node, registry) => groupIndex(registry, node) >= 0 && registry.tree().length > 1,
    enabled: (node, registry) => groupIndex(registry, node) > 0,
    run: (node, registry) => registry.moveGroup(node.group.id, groupIndex(registry, node) - 1),
  },
  {
    id: 'moveGroupDown',
    i18nKey: 'MAP_LAYERS.ACTIONS.MOVE_DOWN',
    icon: 'fas fa-arrow-down',
    order: 40,
    appliesTo: (node, registry) => groupIndex(registry, node) >= 0 && registry.tree().length > 1,
    enabled: (node, registry) => {
      const index = groupIndex(registry, node);
      return index >= 0 && index < registry.tree().length - 1;
    },
    run: (node, registry) => registry.moveGroup(node.group.id, groupIndex(registry, node) + 1),
  },
];

/** The default layer actions and those provided through `MAP_LAYER_ACTIONS`, in menu order. */
export function injectLayerActions(): readonly LayerAction[] {
  return withDefaults(DEFAULT_LAYER_ACTIONS, inject(MAP_LAYER_ACTIONS, { optional: true }));
}

/** The default group actions and those provided through `MAP_LAYER_GROUP_ACTIONS`, in menu order. */
export function injectLayerGroupActions(): readonly LayerGroupAction[] {
  return withDefaults(
    DEFAULT_LAYER_GROUP_ACTIONS,
    inject(MAP_LAYER_GROUP_ACTIONS, { optional: true })
  );
}

/** A provider may give one action or several, so the contributions are flattened. */
function withDefaults<T extends { order: number }>(
  defaults: readonly T[],
  provided: readonly (T | readonly T[])[] | null
): readonly T[] {
  const extra = (provided ?? []).flat() as T[];
  return [...defaults, ...extra].sort((a, b) => a.order - b.order);
}
