import type { LayerGroupDef } from './map-layer.model';

/**
 * Layer groups of the main map, top to bottom: a group higher up in the list
 * is drawn above the ones below it. Reachability and temporary layers come
 * first, the filled indicator last, so it never hides anything and outlines
 * stay visible above area georesources and WMS. Sub groups keep their order
 * (points above lines above areas above services).
 */
export const MAIN_MAP_LAYER_GROUPS: readonly LayerGroupDef[] = [
  {
    id: 'reachability',
    i18nKey: 'MAP_LAYERS.GROUPS.REACHABILITY',
    whenEmpty: 'hint',
    emptyHintI18nKey: 'MAP_LAYERS.EMPTY_HINTS.REACHABILITY',
  },
  {
    id: 'temporary',
    i18nKey: 'MAP_LAYERS.GROUPS.TEMPORARY',
    whenEmpty: 'hint',
    emptyHintI18nKey: 'MAP_LAYERS.EMPTY_HINTS.TEMPORARY',
  },
  {
    id: 'outline',
    i18nKey: 'MAP_LAYERS.GROUPS.OUTLINE',
    whenEmpty: 'hint',
    emptyHintI18nKey: 'MAP_LAYERS.EMPTY_HINTS.OUTLINE',
  },
  {
    id: 'georesource',
    i18nKey: 'MAP_LAYERS.GROUPS.GEORESOURCE',
    whenEmpty: 'hint',
    emptyHintI18nKey: 'MAP_LAYERS.EMPTY_HINTS.GEORESOURCE',
    children: [
      {
        id: 'georesource.point',
        i18nKey: 'MAP_LAYERS.GROUPS.GEORESOURCE_POINT',
        whenEmpty: 'hide',
      },
      {
        id: 'georesource.line',
        i18nKey: 'MAP_LAYERS.GROUPS.GEORESOURCE_LINE',
        whenEmpty: 'hide',
      },
      {
        id: 'georesource.area',
        i18nKey: 'MAP_LAYERS.GROUPS.GEORESOURCE_AREA',
        whenEmpty: 'hide',
      },
      // All WMS (georesource and indicator WMS) and all WFS.
      {
        id: 'georesource.service',
        i18nKey: 'MAP_LAYERS.GROUPS.GEORESOURCE_SERVICE',
        whenEmpty: 'hide',
      },
    ],
  },
  {
    id: 'indicator',
    i18nKey: 'MAP_LAYERS.GROUPS.INDICATOR',
    maxEntries: 1,
    sortable: false,
    whenEmpty: 'hint',
    emptyHintI18nKey: 'MAP_LAYERS.EMPTY_HINTS.INDICATOR',
  },
];

/** A leaf group together with the top-level group whose position decides its draw order. */
export interface ResolvedLayerGroup {
  leaf: LayerGroupDef;
  topLevel: LayerGroupDef;
}

/**
 * Finds the leaf group a layer is registered under. Groups with children hold
 * no entries, so they resolve to undefined just like unknown ids.
 */
export function resolveLeafGroup(
  catalog: readonly LayerGroupDef[],
  groupId: string
): ResolvedLayerGroup | undefined {
  for (const topLevel of catalog) {
    const leaf = findLeaf(topLevel, groupId);
    if (leaf) {
      return { leaf, topLevel };
    }
  }
  return undefined;
}

function findLeaf(group: LayerGroupDef, groupId: string): LayerGroupDef | undefined {
  if (!group.children?.length) {
    return group.id === groupId ? group : undefined;
  }
  for (const child of group.children) {
    const leaf = findLeaf(child, groupId);
    if (leaf) {
      return leaf;
    }
  }
  return undefined;
}
