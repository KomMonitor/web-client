import { readFileSync } from 'fs';
import { join } from 'path';

import { MAIN_MAP_LAYER_GROUPS, resolveLeafGroup } from './layer-group-catalog';
import type { LayerGroupDef } from './map-layer.model';

const I18N = join(__dirname, '../../assets/i18n');

function allGroups(groups: readonly LayerGroupDef[]): LayerGroupDef[] {
  return groups.flatMap((group) => [group, ...allGroups(group.children ?? [])]);
}

function leafGroups(groups: readonly LayerGroupDef[]): LayerGroupDef[] {
  return allGroups(groups).filter((group) => !group.children?.length);
}

function loadTranslations(language: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(I18N, `${language}.json`), 'utf8'));
}

/** The text stored under a dotted key, or undefined if there is none. */
function lookup(tree: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<any>((node, part) => node?.[part], tree);
}

describe('MAIN_MAP_LAYER_GROUPS', () => {
  const groups = allGroups(MAIN_MAP_LAYER_GROUPS);
  const subGroups = MAIN_MAP_LAYER_GROUPS.flatMap((group) => group.children ?? []);

  it('has unique group ids', () => {
    const ids = groups.map((group) => group.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('prefixes sub group ids with the id of their parent', () => {
    const unprefixed = groups.flatMap((parent) =>
      (parent.children ?? [])
        .filter((child) => !child.id.startsWith(`${parent.id}.`))
        .map((child) => child.id)
    );
    expect(unprefixed).toEqual([]);
  });

  it('lists the top-level groups in the default draw order, top to bottom', () => {
    expect(MAIN_MAP_LAYER_GROUPS.map((group) => group.id)).toEqual([
      'reachability',
      'temporary',
      'outline',
      'georesource',
      'indicator',
    ]);
  });

  it('keeps points above lines above areas above services', () => {
    const georesource = MAIN_MAP_LAYER_GROUPS.find((group) => group.id === 'georesource');
    expect(georesource?.children?.map((group) => group.id)).toEqual([
      'georesource.point',
      'georesource.line',
      'georesource.area',
      'georesource.service',
    ]);
  });

  it('shows a hint in empty top-level groups and hides empty sub groups', () => {
    for (const group of MAIN_MAP_LAYER_GROUPS) {
      expect(group.whenEmpty).toBe('hint');
      expect(group.emptyHintI18nKey).toBeTruthy();
    }
    for (const group of subGroups) {
      expect(group.whenEmpty).toBe('hide');
    }
  });

  it('allows exactly one, unsortable indicator layer', () => {
    const indicator = MAIN_MAP_LAYER_GROUPS.find((group) => group.id === 'indicator');
    expect(indicator?.maxEntries).toBe(1);
    expect(indicator?.sortable).toBe(false);
  });

  it.each(['de', 'en'])('has a %s text for every title and hint', (language) => {
    const translations = loadTranslations(language);
    const keys = groups.flatMap((group) =>
      [group.i18nKey, group.emptyHintI18nKey].filter((key): key is string => !!key)
    );
    const missing = keys.filter((key) => {
      const text = lookup(translations, key);
      return typeof text !== 'string' || !text.trim();
    });
    expect(missing).toEqual([]);
  });
});

describe('resolveLeafGroup', () => {
  it.each(leafGroups(MAIN_MAP_LAYER_GROUPS).map((group) => group.id))(
    'resolves the leaf group %s',
    (id) => {
      expect(resolveLeafGroup(MAIN_MAP_LAYER_GROUPS, id)?.leaf.id).toBe(id);
    }
  );

  it('returns the top-level group that decides the draw order', () => {
    expect(resolveLeafGroup(MAIN_MAP_LAYER_GROUPS, 'georesource.area')?.topLevel.id).toBe(
      'georesource'
    );
    expect(resolveLeafGroup(MAIN_MAP_LAYER_GROUPS, 'indicator')?.topLevel.id).toBe('indicator');
  });

  it('does not resolve a group that only holds sub groups', () => {
    expect(resolveLeafGroup(MAIN_MAP_LAYER_GROUPS, 'georesource')).toBeUndefined();
  });

  it('does not resolve an unknown group', () => {
    expect(resolveLeafGroup(MAIN_MAP_LAYER_GROUPS, 'drawing')).toBeUndefined();
  });

  it('resolves leaves of nested sub groups in another catalogue', () => {
    const catalog: LayerGroupDef[] = [
      {
        id: 'topics',
        i18nKey: 'TOPICS',
        children: [
          {
            id: 'topics.mobility',
            i18nKey: 'MOBILITY',
            children: [{ id: 'topics.mobility.bus', i18nKey: 'BUS' }],
          },
        ],
      },
    ];
    const resolved = resolveLeafGroup(catalog, 'topics.mobility.bus');
    expect(resolved?.leaf.id).toBe('topics.mobility.bus');
    expect(resolved?.topLevel.id).toBe('topics');
  });
});
