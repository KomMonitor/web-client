import { TestBed } from '@angular/core/testing';
import type * as L from 'leaflet';

import {
  DEFAULT_LAYER_ACTIONS,
  DEFAULT_LAYER_GROUP_ACTIONS,
  type LayerAction,
  type LayerGroupAction,
  MAP_LAYER_ACTIONS,
  MAP_LAYER_GROUP_ACTIONS,
  entryListPosition,
  injectLayerActions,
  injectLayerGroupActions,
} from './layer-actions';
import { MAIN_MAP_LAYER_GROUPS } from './layer-group-catalog';
import type {
  LayerEntryState,
  LayerRegistration,
  LayerTreeNode,
  MapLayerBinding,
} from './map-layer.model';
import { MapLayerRegistry } from './map-layer-registry';

function layer(id: string, overrides: Partial<LayerRegistration> = {}): LayerRegistration {
  return {
    id,
    groupId: 'georesource.point',
    title: id,
    kind: 'marker',
    symbol: { kind: 'point', color: '#ff0000' },
    layer: { id } as unknown as L.Layer,
    ...overrides,
  };
}

/** A binding that only answers `canZoomTo` and records `zoomTo`. */
function zoomBinding(zoomable: string[]): MapLayerBinding & { zoomed: string[] } {
  const zoomed: string[] = [];
  return {
    zoomed,
    canZoomTo: (id) => zoomable.includes(id),
    zoomTo: (id) => zoomed.push(id),
    bind: () => undefined,
    unbind: () => undefined,
    setVisible: () => undefined,
    setOpacity: () => undefined,
    setOrder: () => undefined,
    bindBaseLayers: () => undefined,
    showBaseLayer: () => undefined,
    setBaseLayerOpacity: () => undefined,
  };
}

const action = (id: string) => DEFAULT_LAYER_ACTIONS.find((candidate) => candidate.id === id)!;
const groupAction = (id: string) =>
  DEFAULT_LAYER_GROUP_ACTIONS.find((candidate) => candidate.id === id)!;

describe('layer actions', () => {
  let registry: MapLayerRegistry;
  const entry = (id: string): LayerEntryState => registry.entry(id)!;
  const node = (groupId: string): LayerTreeNode => {
    const find = (nodes: LayerTreeNode[]): LayerTreeNode | undefined =>
      nodes.map((n) => (n.group.id === groupId ? n : find(n.children))).find(Boolean);
    return find(registry.tree())!;
  };
  /** Ids of the actions listed for an entry. */
  const listed = (id: string) =>
    DEFAULT_LAYER_ACTIONS.filter((candidate) => candidate.appliesTo(entry(id), registry)).map(
      (candidate) => candidate.id
    );

  beforeEach(() => {
    registry = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
  });

  describe('entryListPosition', () => {
    it('finds the list of an entry, also in sub groups', () => {
      registry.register(layer('georesource:1'));
      registry.register(layer('georesource:2'));

      expect(entryListPosition(registry.tree(), 'georesource:1')).toEqual({
        index: 1,
        size: 2,
        movable: true,
      });
      expect(entryListPosition(registry.tree(), 'georesource:404')).toBeUndefined();
    });

    it('is not movable in a group that is not sortable or for an entry that may not move', () => {
      registry.register(layer('indicator', { groupId: 'indicator', kind: 'vector' }));
      registry.register(
        layer('file:a', { groupId: 'temporary', capabilities: { reorder: false } })
      );

      expect(entryListPosition(registry.tree(), 'indicator')?.movable).toBe(false);
      expect(entryListPosition(registry.tree(), 'file:a')?.movable).toBe(false);
    });
  });

  describe('zoom to layer', () => {
    it('is listed by default and enabled only when the map knows an extent', () => {
      registry.register(layer('georesource:1'));
      registry.register(layer('wms:2', { groupId: 'georesource.service', kind: 'raster' }));
      const binding = zoomBinding(['georesource:1']);
      registry.attach(binding);

      expect(listed('wms:2')).toContain('zoomTo');
      expect(action('zoomTo').enabled!(entry('georesource:1'), registry)).toBe(true);
      expect(action('zoomTo').enabled!(entry('wms:2'), registry)).toBe(false);

      action('zoomTo').run(entry('georesource:1'), registry);
      expect(binding.zoomed).toEqual(['georesource:1']);
    });

    it('is not listed for a layer that may not zoom', () => {
      registry.register(layer('georesource:1', { capabilities: { zoomTo: false } }));

      expect(listed('georesource:1')).not.toContain('zoomTo');
    });
  });

  describe('move up and down', () => {
    beforeEach(() => {
      registry.register(layer('georesource:1'));
      registry.register(layer('georesource:2'));
      registry.register(layer('georesource:3'));
    });

    it('moves an entry by one within its list', () => {
      action('moveUp').run(entry('georesource:2'), registry);
      expect(node('georesource.point').entries.map((e) => e.id)).toEqual([
        'georesource:2',
        'georesource:3',
        'georesource:1',
      ]);

      action('moveDown').run(entry('georesource:2'), registry);
      expect(node('georesource.point').entries.map((e) => e.id)).toEqual([
        'georesource:3',
        'georesource:2',
        'georesource:1',
      ]);
    });

    it('is disabled at the top and at the bottom', () => {
      const enabled = (id: string, layerId: string) =>
        action(id).enabled!(entry(layerId), registry);

      expect([enabled('moveUp', 'georesource:3'), enabled('moveDown', 'georesource:3')]).toEqual([
        false,
        true,
      ]);
      expect([enabled('moveUp', 'georesource:1'), enabled('moveDown', 'georesource:1')]).toEqual([
        true,
        false,
      ]);
    });

    it('is not listed for the only entry of a list or in a group that is not sortable', () => {
      registry.register(layer('file:a', { groupId: 'temporary' }));
      registry.register(layer('indicator', { groupId: 'indicator', kind: 'vector' }));

      expect(listed('file:a')).not.toContain('moveUp');
      expect(listed('indicator')).not.toContain('moveDown');
      expect(listed('georesource:1')).toEqual(['zoomTo', 'moveUp', 'moveDown']);
    });
  });

  describe('details', () => {
    it('is listed for layers with details and asks the panel to show them', () => {
      registry.register(layer('georesource:1', { info: () => ({ items: [] }) }));
      registry.register(layer('georesource:2'));
      const panel = { showInfo: jest.fn() };

      expect(listed('georesource:1')).toContain('info');
      expect(listed('georesource:2')).not.toContain('info');

      action('info').run(entry('georesource:1'), registry, panel);
      expect(panel.showInfo).toHaveBeenCalledWith('georesource:1');
    });
  });

  describe('remove', () => {
    it('is listed only for removable layers and lets the owner deselect the layer', () => {
      const owner = { remove: jest.fn() };
      registry.register(layer('georesource:1', { owner, capabilities: { remove: true } }));
      registry.register(layer('outline:2', { groupId: 'outline', kind: 'vector' }));

      expect(listed('georesource:1')).toContain('remove');
      expect(listed('outline:2')).not.toContain('remove');

      action('remove').run(entry('georesource:1'), registry);
      expect(owner.remove).toHaveBeenCalledWith('georesource:1');
      expect(registry.entry('georesource:1')).toBeUndefined();
    });
  });

  describe('group actions', () => {
    const topLevel = () => registry.tree().map((top) => top.group.id);

    it('move a top-level group by one', () => {
      groupAction('moveGroupDown').run(node('reachability'), registry);
      expect(topLevel().slice(0, 2)).toEqual(['temporary', 'reachability']);

      groupAction('moveGroupUp').run(node('reachability'), registry);
      expect(topLevel().slice(0, 2)).toEqual(['reachability', 'temporary']);
    });

    it('are disabled at the top and at the bottom', () => {
      expect(groupAction('moveGroupUp').enabled!(node('reachability'), registry)).toBe(false);
      expect(groupAction('moveGroupDown').enabled!(node('reachability'), registry)).toBe(true);
      expect(groupAction('moveGroupDown').enabled!(node('indicator'), registry)).toBe(false);
    });

    it('apply to top-level groups only', () => {
      expect(groupAction('moveGroupUp').appliesTo(node('georesource'), registry)).toBe(true);
      expect(groupAction('moveGroupUp').appliesTo(node('georesource.point'), registry)).toBe(false);
    });
  });

  describe('injected', () => {
    const extra: LayerAction = {
      id: 'export',
      i18nKey: 'EXPORT',
      icon: 'fas fa-download',
      order: 50,
      appliesTo: () => true,
      run: () => undefined,
    };
    const extraGroup: LayerGroupAction = { ...extra, id: 'showAll', order: 5 };

    it('are the defaults without providers', () => {
      expect(TestBed.runInInjectionContext(injectLayerActions)).toEqual(DEFAULT_LAYER_ACTIONS);
      expect(TestBed.runInInjectionContext(injectLayerGroupActions)).toEqual(
        DEFAULT_LAYER_GROUP_ACTIONS
      );
    });

    it('add provided actions, single or several, in menu order', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: MAP_LAYER_ACTIONS, multi: true, useValue: extra },
          { provide: MAP_LAYER_ACTIONS, multi: true, useValue: [{ ...extra, id: 'a', order: 1 }] },
          { provide: MAP_LAYER_GROUP_ACTIONS, multi: true, useValue: extraGroup },
        ],
      });

      expect(TestBed.runInInjectionContext(injectLayerActions).map((a) => a.id)).toEqual([
        'a',
        'zoomTo',
        'info',
        'moveUp',
        'moveDown',
        'export',
        'remove',
      ]);
      expect(TestBed.runInInjectionContext(injectLayerGroupActions).map((a) => a.id)).toEqual([
        'showAll',
        'moveGroupUp',
        'moveGroupDown',
      ]);
    });
  });
});
