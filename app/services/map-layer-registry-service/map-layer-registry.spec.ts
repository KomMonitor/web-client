import { computed } from '@angular/core';
import type * as L from 'leaflet';

import { MAIN_MAP_LAYER_GROUPS } from './layer-group-catalog';
import type {
  BoundLayer,
  LayerGroupDef,
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

  /** Kept apart from `calls`, so specs about other commands need not list every order. */
  readonly orders: LayerId[][] = [];

  setOrder(order: LayerId[]): void {
    this.orders.push(order);
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

    it('marks a hidden entry that is only loaded on first show as idle', () => {
      registry.register(
        poi('outline:7', {
          groupId: 'outline',
          initial: { visible: false },
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

  describe('moveEntry', () => {
    beforeEach(() => {
      registry.register(poi('georesource:1'));
      registry.register(poi('georesource:2'));
      registry.register(poi('georesource:3'));
      registry.register(poi('georesource:9', { groupId: 'georesource.area', kind: 'vector' }));
      // Point list top to bottom: 3, 2, 1.
    });

    it('moves an entry within its own list', () => {
      registry.moveEntry('georesource:3', 2);
      expect(idsIn(registry, 'georesource.point')).toEqual([
        'georesource:2',
        'georesource:1',
        'georesource:3',
      ]);

      registry.moveEntry('georesource:1', 0);
      expect(idsIn(registry, 'georesource.point')).toEqual([
        'georesource:1',
        'georesource:2',
        'georesource:3',
      ]);
      expect(idsIn(registry, 'georesource.area')).toEqual(['georesource:9']);
    });

    it('clamps the target index to its own list', () => {
      registry.moveEntry('georesource:3', 99);
      expect(idsIn(registry, 'georesource.point')).toEqual([
        'georesource:2',
        'georesource:1',
        'georesource:3',
      ]);

      registry.moveEntry('georesource:1', -5);
      expect(idsIn(registry, 'georesource.point')).toEqual([
        'georesource:1',
        'georesource:2',
        'georesource:3',
      ]);
      expect(idsIn(registry, 'georesource.area')).toEqual(['georesource:9']);
    });

    it('ignores unknown ids and entries that may not be reordered', () => {
      registry.register(poi('georesource:4', { capabilities: { reorder: false } }));
      const before = registry.drawOrder();

      registry.moveEntry('georesource:404', 0);
      registry.moveEntry('georesource:4', 3);
      registry.moveEntry('georesource:2', Number.NaN);

      expect(registry.drawOrder()).toEqual(before);
    });

    it('ignores entries of a group that is not sortable', () => {
      const catalog: LayerGroupDef[] = [{ id: 'fixed', i18nKey: 'FIXED', sortable: false }];
      const fixed = new MapLayerRegistry(catalog);
      fixed.register(poi('a', { groupId: 'fixed' }));
      fixed.register(poi('b', { groupId: 'fixed' }));

      fixed.moveEntry('b', 1);

      expect(fixed.drawOrder()).toEqual(['b', 'a']);
    });
  });

  describe('moveGroup', () => {
    beforeEach(() => {
      registry.register(poi('indicator', { groupId: 'indicator', kind: 'vector' }));
      registry.register(poi('georesource:1'));
      registry.register(poi('reachability:live:start', { groupId: 'reachability' }));
    });

    it('moves a top-level group and with it the stacking of its entries', () => {
      registry.moveGroup('indicator', 0);

      expect(registry.tree().map((node) => node.group.id)).toEqual([
        'indicator',
        'reachability',
        'temporary',
        'outline',
        'georesource',
      ]);
      expect(registry.drawOrder()).toEqual([
        'indicator',
        'reachability:live:start',
        'georesource:1',
      ]);
    });

    it('clamps the target index', () => {
      registry.moveGroup('reachability', 42);

      expect(registry.tree().at(-1)?.group.id).toBe('reachability');
    });

    it('keeps sub groups fixed and ignores unknown groups', () => {
      const before = registry.tree().map((node) => node.group.id);

      registry.moveGroup('georesource.point', 0);
      registry.moveGroup('drawing', 0);

      expect(registry.tree().map((node) => node.group.id)).toEqual(before);
      expect(findNode(registry.tree(), 'georesource')?.children.map((n) => n.group.id)).toEqual([
        'georesource.point',
        'georesource.line',
        'georesource.area',
        'georesource.service',
      ]);
    });
  });

  describe('drawOrder', () => {
    it('lists every entry top to bottom, hidden and not yet loaded ones included', () => {
      registry.register(poi('indicator', { groupId: 'indicator', kind: 'vector' }));
      registry.register(poi('wms:9', { groupId: 'georesource.service', kind: 'raster' }));
      registry.register(poi('georesource:5', { groupId: 'georesource.area', kind: 'vector' }));
      registry.register(poi('georesource:1'));
      registry.register(poi('georesource:2'));
      registry.register(
        poi('outline:7', {
          groupId: 'outline',
          initial: { visible: false },
          layer: undefined,
          load: () => Promise.resolve(fakeLayer('outline:7')),
        })
      );
      registry.register(poi('file:a.geojson', { groupId: 'temporary', kind: 'vector' }));
      registry.setVisible('georesource:1', false);

      expect(registry.drawOrder()).toEqual([
        'file:a.geojson',
        'outline:7',
        'georesource:2',
        'georesource:1',
        'georesource:5',
        'wms:9',
        'indicator',
      ]);
    });
  });

  describe('maxEntries', () => {
    const catalog: LayerGroupDef[] = [
      { id: 'pair', i18nKey: 'PAIR', maxEntries: 2 },
      { id: 'other', i18nKey: 'OTHER' },
    ];

    it('lets a new entry push out the oldest ones and tells their owner', () => {
      const limited = new MapLayerRegistry(catalog);
      const owner = { remove: jest.fn((id: LayerId) => limited.unregister(id)) };
      limited.register(poi('a', { groupId: 'pair', owner }));
      limited.register(poi('b', { groupId: 'pair', owner }));

      limited.register(poi('c', { groupId: 'pair', owner }));

      expect(limited.drawOrder()).toEqual(['c', 'b']);
      expect(owner.remove).toHaveBeenCalledTimes(1);
      expect(owner.remove).toHaveBeenCalledWith('a');
    });

    it('also makes room when an entry moves into a full group', () => {
      const limited = new MapLayerRegistry(catalog);
      limited.register(poi('a', { groupId: 'pair' }));
      limited.register(poi('b', { groupId: 'pair' }));
      limited.register(poi('c', { groupId: 'other' }));

      limited.register(poi('c', { groupId: 'pair' }));

      expect(limited.drawOrder()).toEqual(['c', 'b']);
    });

    it('does not push anything out when an entry is replaced', () => {
      const limited = new MapLayerRegistry(catalog);
      limited.register(poi('a', { groupId: 'pair' }));
      limited.register(poi('b', { groupId: 'pair' }));

      limited.register(poi('a', { groupId: 'pair', title: 'A again' }));

      expect(limited.drawOrder()).toEqual(['b', 'a']);
    });

    it('keeps the single indicator of the main map when it is replaced', () => {
      registry.register(poi('indicator', { groupId: 'indicator', kind: 'vector' }));
      registry.register(poi('indicator', { groupId: 'indicator', kind: 'vector', title: 'B' }));

      expect(findNode(registry.tree(), 'indicator')?.entries.map((e) => e.title)).toEqual(['B']);
    });
  });

  describe('handing the order to the binding', () => {
    beforeEach(() => {
      registry.register(poi('georesource:1'));
      registry.register(poi('indicator', { groupId: 'indicator', kind: 'vector' }));
    });

    it('sends the order on attach, after binding the layers', () => {
      registry.attach(binding);

      expect(binding.orders).toEqual([['georesource:1', 'indicator']]);
      expect(binding.calls.map((call) => call[0])).toEqual(['bind', 'bind']);
    });

    it('sends it again after every change of the stacking', () => {
      registry.attach(binding);

      registry.register(poi('georesource:2'));
      registry.moveEntry('georesource:2', 1);
      registry.moveGroup('indicator', 0);
      registry.unregister('georesource:1');

      expect(binding.orders).toEqual([
        ['georesource:1', 'indicator'],
        ['georesource:2', 'georesource:1', 'indicator'],
        ['georesource:1', 'georesource:2', 'indicator'],
        ['indicator', 'georesource:1', 'georesource:2'],
        ['indicator', 'georesource:2'],
      ]);
    });

    it('does not send an unchanged order', () => {
      registry.attach(binding);

      registry.register(poi('georesource:1', { title: 'replaced' }));
      registry.setVisible('georesource:1', false);
      registry.setOpacity('georesource:1', 0.5);
      registry.moveEntry('georesource:1', 0);
      registry.moveGroup('georesource', 3);

      expect(binding.orders).toHaveLength(1);
    });

    it('sends nothing while detached', () => {
      registry.register(poi('georesource:2'));

      expect(binding.orders).toEqual([]);
    });
  });

  describe('loading on first show', () => {
    function deferred<T>() {
      let resolve!: (value: T) => void;
      let reject!: (reason: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    }

    /** Lets pending promise callbacks run. */
    const flush = () => new Promise((resolve) => setTimeout(resolve));

    function outline(
      load: () => Promise<L.Layer>,
      initial: LayerRegistration['initial'] = { visible: false }
    ): LayerRegistration {
      return poi('outline:7', {
        groupId: 'outline',
        kind: 'vector',
        symbol: { kind: 'outline', color: '#ff0000' },
        layer: undefined,
        load,
        initial,
      });
    }

    it('does not load a hidden entry', () => {
      const load = jest.fn();

      registry.register(outline(load));

      expect(registry.entry('outline:7')?.status).toBe('idle');
      expect(load).not.toHaveBeenCalled();
    });

    it('loads on the first show and binds the layer with the current state', async () => {
      const pending = deferred<L.Layer>();
      const load = jest.fn(() => pending.promise);
      registry.register(outline(load));
      registry.attach(binding);
      registry.setOpacity('outline:7', 0.5);

      registry.setVisible('outline:7', true);

      expect(registry.entry('outline:7')?.status).toBe('loading');
      expect(load).toHaveBeenCalledTimes(1);
      expect(binding.calls).toEqual([]);

      const layer = fakeLayer('loaded');
      pending.resolve(layer);
      await flush();

      expect(registry.entry('outline:7')?.status).toBe('ready');
      expect(binding.calls).toEqual([
        [
          'bind',
          {
            id: 'outline:7',
            kind: 'vector',
            pane: registry.paneFor('outline:7'),
            layer,
            adapter: undefined,
            visible: true,
            opacity: 0.5,
          },
        ],
      ]);

      registry.setVisible('outline:7', false);
      registry.setVisible('outline:7', true);

      expect(load).toHaveBeenCalledTimes(1);
      expect(binding.calls.slice(1)).toEqual([
        ['setVisible', 'outline:7', false],
        ['setVisible', 'outline:7', true],
      ]);
    });

    it('loads an entry registered as visible right away and binds it on attach', async () => {
      const layer = fakeLayer('loaded');
      const load = jest.fn(() => Promise.resolve(layer));

      registry.register(outline(load, { visible: true }));

      expect(load).toHaveBeenCalledTimes(1);
      await flush();
      registry.attach(binding);

      expect(binding.calls).toEqual([
        ['bind', expect.objectContaining({ id: 'outline:7', layer, visible: true })],
      ]);
    });

    it('binds an entry hidden while loading as hidden and does not load twice', async () => {
      const pending = deferred<L.Layer>();
      const load = jest.fn(() => pending.promise);
      registry.attach(binding);
      registry.register(outline(load));

      registry.setVisible('outline:7', true);
      registry.setVisible('outline:7', false);
      registry.setVisible('outline:7', true);
      registry.setVisible('outline:7', false);
      pending.resolve(fakeLayer('loaded'));
      await flush();

      expect(load).toHaveBeenCalledTimes(1);
      expect(binding.calls).toEqual([
        ['bind', expect.objectContaining({ id: 'outline:7', visible: false })],
      ]);
    });

    it('hides a failed entry and tries again on the next show', async () => {
      const layer = fakeLayer('second try');
      const load = jest
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce(layer);
      registry.attach(binding);
      registry.register(outline(load));

      registry.setVisible('outline:7', true);
      await flush();

      expect(registry.entry('outline:7')).toMatchObject({ status: 'error', visible: false });
      expect(binding.calls).toEqual([]);

      registry.setVisible('outline:7', true);
      expect(registry.entry('outline:7')?.status).toBe('loading');
      await flush();

      expect(load).toHaveBeenCalledTimes(2);
      expect(registry.entry('outline:7')).toMatchObject({ status: 'ready', visible: true });
      expect(binding.calls).toEqual([['bind', expect.objectContaining({ layer, visible: true })]]);
    });

    it('treats a load function that throws as a failed load', async () => {
      registry.register(
        outline(() => {
          throw new Error('bug');
        })
      );

      registry.setVisible('outline:7', true);
      await flush();

      expect(registry.entry('outline:7')).toMatchObject({ status: 'error', visible: false });
    });

    it('drops the result of a load whose entry was replaced meanwhile', async () => {
      const pending = deferred<L.Layer>();
      registry.attach(binding);
      registry.register(outline(() => pending.promise));
      registry.setVisible('outline:7', true);
      registry.register(poi('outline:7', { groupId: 'outline', layer: fakeLayer('replacement') }));
      binding.calls.length = 0;

      pending.resolve(fakeLayer('stale'));
      await flush();

      expect(binding.calls).toEqual([]);
      expect(registry.entry('outline:7')?.status).toBe('ready');
    });

    it('starts the load of a replacement that is only loaded later', async () => {
      const first = deferred<L.Layer>();
      const second = deferred<L.Layer>();
      const secondLoad = jest.fn(() => second.promise);
      registry.register(outline(() => first.promise));
      registry.setVisible('outline:7', true);

      registry.register(outline(secondLoad));
      registry.attach(binding);

      expect(secondLoad).toHaveBeenCalledTimes(1);
      second.resolve(fakeLayer('fresh'));
      first.resolve(fakeLayer('stale'));
      await flush();

      expect(binding.calls).toEqual([
        ['bind', expect.objectContaining({ layer: expect.objectContaining({ name: 'fresh' }) })],
      ]);
    });

    it('drops the result of a load whose entry was unregistered meanwhile', async () => {
      const pending = deferred<L.Layer>();
      registry.attach(binding);
      registry.register(outline(() => pending.promise));
      registry.setVisible('outline:7', true);

      registry.unregister('outline:7');
      pending.resolve(fakeLayer('stale'));
      await flush();

      expect(binding.calls).toEqual([]);
      expect(registry.entry('outline:7')).toBeUndefined();
    });

    it('only counts the new load after unregistering and registering again', async () => {
      const first = deferred<L.Layer>();
      const second = deferred<L.Layer>();
      registry.register(outline(() => first.promise, { visible: true }));
      registry.unregister('outline:7');
      registry.register(outline(() => second.promise, { visible: true }));
      registry.attach(binding);

      second.resolve(fakeLayer('fresh'));
      await flush();
      first.resolve(fakeLayer('stale'));
      await flush();

      expect(binding.calls).toEqual([
        ['bind', expect.objectContaining({ layer: expect.objectContaining({ name: 'fresh' }) })],
      ]);
    });
  });

  describe('status reported by the binding', () => {
    beforeEach(() => {
      registry.register(poi('wms:9', { groupId: 'georesource.service', kind: 'raster' }));
    });

    it('sets the status of an entry with a layer and keeps it visible on errors', () => {
      registry.reportStatus('wms:9', 'loading');
      expect(registry.entry('wms:9')?.status).toBe('loading');

      registry.reportStatus('wms:9', 'error');
      expect(registry.entry('wms:9')).toMatchObject({ status: 'error', visible: true });

      registry.reportStatus('wms:9', 'ready');
      expect(registry.entry('wms:9')?.status).toBe('ready');
    });

    it('ignores unknown entries and entries without a layer yet', () => {
      registry.register(
        poi('outline:7', {
          groupId: 'outline',
          initial: { visible: false },
          layer: undefined,
          load: () => Promise.resolve(fakeLayer('outline:7')),
        })
      );

      registry.reportStatus('outline:7', 'error');
      registry.reportStatus('wms:404', 'error');

      expect(registry.entry('outline:7')?.status).toBe('idle');
      expect(registry.entry('wms:404')).toBeUndefined();
    });

    it('leaves the state untouched when a report repeats it', () => {
      const tree = registry.tree();

      registry.reportStatus('wms:9', 'ready');
      registry.reportOutOfScale('wms:9', false);

      expect(registry.tree()).toBe(tree);
    });

    it('sets and clears outOfScale', () => {
      registry.reportOutOfScale('wms:9', true);
      expect(registry.entry('wms:9')?.outOfScale).toBe(true);

      registry.reportOutOfScale('wms:9', false);
      expect(registry.entry('wms:9')?.outOfScale).toBe(false);

      registry.reportOutOfScale('wms:404', true);
      expect(registry.entry('wms:404')).toBeUndefined();
    });
  });
});
