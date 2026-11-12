import { computed } from '@angular/core';
import type * as L from 'leaflet';

import { MAIN_MAP_LAYER_GROUPS } from './layer-group-catalog';
import type {
  BoundLayer,
  LayerId,
  LayerRegistration,
  LayerTreeNode,
  MapLayerBinding,
} from './map-layer.model';
import { DEFAULT_LAYER_CAPABILITIES, MapLayerRegistry } from './map-layer-registry';

/** Records every call, so specs can check what reached the map side and when. */
class FakeBinding implements MapLayerBinding {
  readonly calls: unknown[][] = [];

  bind(layer: BoundLayer): void {
    this.calls.push(['bind', layer]);
  }
  unbind(id: LayerId): void {
    this.calls.push(['unbind', id]);
  }
  setVisible(id: LayerId, visible: boolean): void {
    this.calls.push(['setVisible', id, visible]);
  }
  setOpacity(id: LayerId, opacity: number): void {
    this.calls.push(['setOpacity', id, opacity]);
  }
  zoomTo(id: LayerId): void {
    this.calls.push(['zoomTo', id]);
  }
}

/** The registry never touches layers, so a tagged object stands in for a Leaflet layer. */
function fakeLayer(name: string): L.Layer {
  return { name } as unknown as L.Layer;
}

function poi(id: string, overrides: Partial<LayerRegistration> = {}): LayerRegistration {
  return {
    id,
    groupId: 'georesource.point',
    title: id,
    kind: 'marker',
    symbol: { kind: 'point', color: '#ff0000' },
    layer: fakeLayer(id),
    ...overrides,
  };
}

function findNode(nodes: LayerTreeNode[], groupId: string): LayerTreeNode | undefined {
  for (const node of nodes) {
    const found = node.group.id === groupId ? node : findNode(node.children, groupId);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function idsIn(registry: MapLayerRegistry, groupId: string): string[] | undefined {
  return findNode(registry.tree(), groupId)?.entries.map((entry) => entry.id);
}

describe('MapLayerRegistry', () => {
  let registry: MapLayerRegistry;
  let binding: FakeBinding;

  beforeEach(() => {
    registry = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
    binding = new FakeBinding();
  });

  describe('register', () => {
    it('adds a visible, opaque entry with default capabilities', () => {
      registry.register(poi('georesource:1', { subtitle: '2024-01-01' }));

      expect(registry.entry('georesource:1')).toEqual({
        id: 'georesource:1',
        groupId: 'georesource.point',
        title: 'georesource:1',
        subtitle: '2024-01-01',
        kind: 'marker',
        symbol: { kind: 'point', color: '#ff0000' },
        visible: true,
        opacity: 1,
        status: 'ready',
        outOfScale: false,
        capabilities: DEFAULT_LAYER_CAPABILITIES,
      });
    });

    it('takes the initial state and capabilities of the registration', () => {
      registry.register(
        poi('georesource:1', {
          initial: { visible: false, opacity: 0.4 },
          capabilities: { remove: true, searchable: true },
        })
      );

      const entry = registry.entry('georesource:1');
      expect(entry?.visible).toBe(false);
      expect(entry?.opacity).toBe(0.4);
      expect(entry?.capabilities).toEqual({
        ...DEFAULT_LAYER_CAPABILITIES,
        remove: true,
        searchable: true,
      });
    });

    it('marks an entry that is only loaded on first show as idle', () => {
      registry.register(
        poi('outline:7', {
          groupId: 'outline',
          layer: undefined,
          load: () => Promise.resolve(fakeLayer('outline:7')),
        })
      );

      expect(registry.entry('outline:7')?.status).toBe('idle');
    });

    it('puts new entries at the top of their list and counts them up the tree', () => {
      registry.register(poi('georesource:1'));
      registry.register(poi('georesource:2'));
      registry.register(poi('georesource:3', { groupId: 'georesource.area', kind: 'vector' }));

      expect(idsIn(registry, 'georesource.point')).toEqual(['georesource:2', 'georesource:1']);
      expect(findNode(registry.tree(), 'georesource.point')?.count).toBe(2);
      expect(findNode(registry.tree(), 'georesource')?.count).toBe(3);
      expect(findNode(registry.tree(), 'indicator')?.count).toBe(0);
    });

    it('keeps empty groups in the tree, in catalogue order', () => {
      expect(registry.tree().map((node) => node.group.id)).toEqual(
        MAIN_MAP_LAYER_GROUPS.map((group) => group.id)
      );
    });

    it('rejects unknown groups and groups that only hold sub groups', () => {
      expect(() => registry.register(poi('x:1', { groupId: 'drawing' }))).toThrow(/no leaf group/);
      expect(() => registry.register(poi('x:2', { groupId: 'georesource' }))).toThrow(
        /no leaf group/
      );
    });

    it('rejects a registration without layer and load function', () => {
      expect(() => registry.register(poi('x:1', { layer: undefined }))).toThrow(
        /neither a layer nor a load function/
      );
    });
  });

  describe('replacing under the same id', () => {
    beforeEach(() => {
      registry.register(poi('georesource:1'));
      registry.register(poi('georesource:2'));
      registry.setVisible('georesource:1', false);
      registry.setOpacity('georesource:1', 0.3);
    });

    it('keeps visibility, opacity and position, and ignores the initial state', () => {
      registry.register(
        poi('georesource:1', {
          title: 'Schulen',
          subtitle: '2025-01-01',
          initial: { visible: true, opacity: 1 },
        })
      );

      const entry = registry.entry('georesource:1');
      expect(entry).toMatchObject({
        title: 'Schulen',
        subtitle: '2025-01-01',
        visible: false,
        opacity: 0.3,
      });
      expect(idsIn(registry, 'georesource.point')).toEqual(['georesource:2', 'georesource:1']);
    });

    it('replaces kind, symbol and capabilities', () => {
      registry.register(
        poi('georesource:1', {
          kind: 'cluster',
          symbol: { kind: 'point', color: '#00ff00' },
          capabilities: { remove: true },
        })
      );

      const entry = registry.entry('georesource:1');
      expect(entry?.kind).toBe('cluster');
      expect(entry?.symbol).toEqual({ kind: 'point', color: '#00ff00' });
      expect(entry?.capabilities.remove).toBe(true);
    });

    it('moves an entry registered under another group to the top of that list', () => {
      registry.register(poi('georesource:3', { groupId: 'georesource.area', kind: 'vector' }));
      registry.register(poi('georesource:1', { groupId: 'georesource.area', kind: 'vector' }));

      expect(idsIn(registry, 'georesource.point')).toEqual(['georesource:2']);
      expect(idsIn(registry, 'georesource.area')).toEqual(['georesource:1', 'georesource:3']);
      expect(registry.entry('georesource:1')).toMatchObject({ visible: false, opacity: 0.3 });
    });

    it('hands the new layer with the kept state to the binding', () => {
      registry.attach(binding);
      binding.calls.length = 0;
      const replacement = fakeLayer('replacement');

      registry.register(poi('georesource:1', { layer: replacement }));

      expect(binding.calls).toEqual([
        [
          'bind',
          {
            id: 'georesource:1',
            kind: 'marker',
            pane: registry.paneFor('georesource:1'),
            layer: replacement,
            adapter: undefined,
            visible: false,
            opacity: 0.3,
          },
        ],
      ]);
    });

    it('unbinds the old layer when the replacement is only loaded later', () => {
      registry.attach(binding);
      binding.calls.length = 0;

      registry.register(
        poi('georesource:1', {
          layer: undefined,
          load: () => Promise.resolve(fakeLayer('later')),
        })
      );

      expect(binding.calls).toEqual([['unbind', 'georesource:1']]);
      expect(registry.entry('georesource:1')?.status).toBe('idle');
    });
  });

  describe('buffering until attach', () => {
    it('binds nothing before attach and every entry with a layer on attach', () => {
      const adapter = { setOpacity: jest.fn() };
      registry.register(poi('georesource:1', { adapter }));
      registry.register(
        poi('outline:7', {
          groupId: 'outline',
          kind: 'vector',
          layer: undefined,
          load: () => Promise.resolve(fakeLayer('outline:7')),
        })
      );
      registry.setVisible('georesource:1', false);
      registry.setOpacity('georesource:1', 0.5);

      registry.attach(binding);

      expect(binding.calls).toEqual([
        [
          'bind',
          {
            id: 'georesource:1',
            kind: 'marker',
            pane: registry.paneFor('georesource:1'),
            layer: expect.objectContaining({ name: 'georesource:1' }),
            adapter,
            visible: false,
            opacity: 0.5,
          },
        ],
      ]);
    });

    it('calls the binding synchronously once attached', () => {
      registry.attach(binding);

      registry.register(poi('georesource:1'));
      expect(binding.calls.at(-1)?.[0]).toBe('bind');

      registry.setVisible('georesource:1', false);
      expect(binding.calls.at(-1)).toEqual(['setVisible', 'georesource:1', false]);

      registry.setOpacity('georesource:1', 0.6);
      expect(binding.calls.at(-1)).toEqual(['setOpacity', 'georesource:1', 0.6]);
    });

    it('moves to a new binding on a second attach and stops after detach', () => {
      registry.register(poi('georesource:1'));
      registry.attach(binding);
      const rebuilt = new FakeBinding();

      registry.attach(rebuilt);
      registry.setVisible('georesource:1', false);

      expect(rebuilt.calls.map((call) => call[0])).toEqual(['bind', 'setVisible']);
      expect(binding.calls.map((call) => call[0])).toEqual(['bind']);

      registry.detach();
      registry.setVisible('georesource:1', true);

      expect(rebuilt.calls).toHaveLength(2);
      expect(registry.entry('georesource:1')?.visible).toBe(true);
    });
  });

  describe('unregister', () => {
    beforeEach(() => {
      registry.register(poi('georesource:1'));
      registry.register(poi('georesource:2'));
      registry.register(poi('wms:9', { groupId: 'georesource.service', kind: 'raster' }));
      registry.attach(binding);
      binding.calls.length = 0;
    });

    it('removes the entry and unbinds its layer', () => {
      registry.unregister('georesource:1');

      expect(registry.entry('georesource:1')).toBeUndefined();
      expect(idsIn(registry, 'georesource.point')).toEqual(['georesource:2']);
      expect(binding.calls).toEqual([['unbind', 'georesource:1']]);
    });

    it('ignores unknown ids', () => {
      registry.unregister('georesource:404');

      expect(binding.calls).toEqual([]);
    });

    it('removes every matching entry', () => {
      registry.unregisterWhere((entry) => entry.id.startsWith('georesource:'));

      expect(binding.calls).toEqual([
        ['unbind', 'georesource:2'],
        ['unbind', 'georesource:1'],
      ]);
      expect(findNode(registry.tree(), 'georesource')?.count).toBe(1);
    });
  });

  describe('visibility and opacity', () => {
    beforeEach(() => {
      registry.register(poi('georesource:1'));
      registry.attach(binding);
      binding.calls.length = 0;
    });

    it('clamps the opacity to 0..1 and ignores NaN', () => {
      registry.setOpacity('georesource:1', 1.5);
      expect(registry.entry('georesource:1')?.opacity).toBe(1);

      registry.setOpacity('georesource:1', -0.2);
      expect(registry.entry('georesource:1')?.opacity).toBe(0);

      registry.setOpacity('georesource:1', Number.NaN);
      expect(registry.entry('georesource:1')?.opacity).toBe(0);
      expect(binding.calls).toEqual([['setOpacity', 'georesource:1', 0]]);
    });

    it('does not call the binding when nothing changes', () => {
      registry.setVisible('georesource:1', true);
      registry.setOpacity('georesource:1', 1);

      expect(binding.calls).toEqual([]);
    });

    it('ignores unknown ids', () => {
      registry.setVisible('georesource:404', false);
      registry.setOpacity('georesource:404', 0.5);
      registry.reapply('georesource:404');
      registry.zoomTo('georesource:404');

      expect(binding.calls).toEqual([]);
      expect(registry.entry('georesource:404')).toBeUndefined();
    });

    it('only remembers the visibility of an entry that has no layer yet', () => {
      registry.register(
        poi('outline:7', {
          groupId: 'outline',
          initial: { visible: false },
          layer: undefined,
          load: () => Promise.resolve(fakeLayer('outline:7')),
        })
      );

      registry.setVisible('outline:7', true);

      expect(registry.entry('outline:7')?.visible).toBe(true);
      expect(binding.calls).toEqual([]);
    });

    it('applies the current opacity again on reapply', () => {
      registry.setOpacity('georesource:1', 0.25);
      registry.reapply('georesource:1');

      expect(binding.calls).toEqual([
        ['setOpacity', 'georesource:1', 0.25],
        ['setOpacity', 'georesource:1', 0.25],
      ]);
    });

    it('delegates zoomTo to the binding', () => {
      registry.zoomTo('georesource:1');

      expect(binding.calls).toEqual([['zoomTo', 'georesource:1']]);
    });
  });

  describe('paneFor', () => {
    it('gives each id its own pane, also before it is registered', () => {
      const pane = registry.paneFor('wfs:Schulen und Kitas');

      expect(pane).toMatch(/^[A-Za-z0-9]+$/);
      expect(registry.paneFor('wfs:Schulen und Kitas')).toBe(pane);
      expect(registry.paneFor('wms:1')).not.toBe(pane);
    });

    it('keeps the pane of an id across unregister and register', () => {
      registry.register(poi('georesource:1'));
      const pane = registry.paneFor('georesource:1');
      registry.unregister('georesource:1');
      registry.register(poi('georesource:1'));

      expect(registry.paneFor('georesource:1')).toBe(pane);
    });
  });

  describe('visibleEntries', () => {
    beforeEach(() => {
      registry.register(poi('indicator', { groupId: 'indicator', kind: 'vector' }));
      registry.register(poi('georesource:1', { capabilities: { searchable: true } }));
      registry.register(poi('wms:9', { groupId: 'georesource.service', kind: 'raster' }));
      registry.register(poi('reachability:live:start', { groupId: 'reachability' }));
      registry.setVisible('wms:9', false);
    });

    it('lists the visible entries top to bottom', () => {
      expect(registry.visibleEntries().map((entry) => entry.id)).toEqual([
        'reachability:live:start',
        'georesource:1',
        'indicator',
      ]);
    });

    it('filters by capability', () => {
      expect(registry.visibleEntries({ searchable: true }).map((entry) => entry.id)).toEqual([
        'georesource:1',
      ]);
    });

    it('is reactive inside computed', () => {
      const searchable = computed(() =>
        registry.visibleEntries({ searchable: true }).map((entry) => entry.id)
      );
      expect(searchable()).toEqual(['georesource:1']);

      registry.setVisible('georesource:1', false);

      expect(searchable()).toEqual([]);
    });
  });
});
