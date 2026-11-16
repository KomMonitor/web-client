import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { MAIN_MAP_LAYER_GROUPS } from 'services/map-layer-registry-service/layer-group-catalog';
import type {
  LayerEntryState,
  LayerRegistration,
} from 'services/map-layer-registry-service/map-layer.model';
import { MapLayerRegistry } from 'services/map-layer-registry-service/map-layer-registry';
import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

import {
  type LayerAction,
  MAP_LAYER_ACTIONS,
} from 'services/map-layer-registry-service/layer-actions';

import { LayerRowComponent } from './layer-row.component';

describe('LayerRowComponent', () => {
  let registry: MapLayerRegistry;
  let fixture: ComponentFixture<LayerRowComponent>;

  beforeEach(() => {
    registry = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
    registry.register({
      id: 'wms:1',
      groupId: 'georesource.service',
      title: 'Luftbild',
      kind: 'raster',
      symbol: { kind: 'service', serviceType: 'wms' },
      // there is no map here
      layer: {} as LayerRegistration['layer'],
    });
    TestBed.configureTestingModule({
      imports: [LayerRowComponent, TranslateModule.forRoot()],
      providers: [{ provide: MAP_LAYER_REGISTRY, useValue: registry }],
    });
  });

  function render(id = 'wms:1'): HTMLElement {
    fixture = TestBed.createComponent(LayerRowComponent);
    fixture.componentRef.setInput('entry', registry.entry(id));
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function wms(id: string, overrides: Partial<LayerRegistration> = {}): LayerRegistration {
    return {
      id,
      groupId: 'georesource.service',
      title: id,
      kind: 'raster',
      symbol: { kind: 'service', serviceType: 'wms' },
      layer: {} as LayerRegistration['layer'],
      ...overrides,
    };
  }

  /** Labels of the state icons; the keys stand in for the texts, as no loader is set up. */
  const states = (root: HTMLElement) =>
    [...root.querySelectorAll('.layer-row__state')].map((icon) => icon.getAttribute('aria-label'));

  it('draws the symbol of the layer', () => {
    expect(render().querySelector('app-layer-symbol .layer-symbol--service')).not.toBeNull();
  });

  it('greys out a hidden layer', () => {
    expect(render().querySelector('.layer-row')!.classList).not.toContain('layer-row--hidden');

    registry.setVisible('wms:1', false);
    const hidden = render();

    expect(hidden.querySelector('.layer-row')!.classList).toContain('layer-row--hidden');
  });

  it('shows no state while the layer is fine', () => {
    expect(states(render())).toEqual([]);
  });

  it.each([
    ['loading', 'MAP_LAYERS.STATUS.LOADING', 'fa-spinner'],
    ['error', 'MAP_LAYERS.STATUS.ERROR', 'fa-triangle-exclamation'],
  ] as const)('shows the %s state', (status, label, icon) => {
    registry.reportStatus('wms:1', status);
    const root = render();

    expect(states(root)).toEqual([label]);
    expect(root.querySelector('.layer-row__state')!.classList).toContain(icon);
    expect(root.querySelector('.layer-row__state')!.getAttribute('role')).toBe('img');
  });

  it('shows when the layer is out of its zoom range', () => {
    registry.reportOutOfScale('wms:1', true);

    expect(states(render())).toEqual(['MAP_LAYERS.STATUS.OUT_OF_SCALE']);
  });
  describe('transparency', () => {
    /** Re-renders with the current registry state, as the panel does through the tree. */
    function refresh(): void {
      fixture.componentRef.setInput('entry', registry.entry('wms:1'));
      TestBed.tick();
      fixture.detectChanges();
    }

    const expandButton = (root: HTMLElement) =>
      root.querySelector<HTMLButtonElement>('.layer-row__expand')!;
    const details = (root: HTMLElement) => root.querySelector<HTMLElement>('.layer-row__details');
    const slider = (root: HTMLElement) =>
      root.querySelector<HTMLInputElement>('.layer-row__details input[type="range"]')!;

    it('opens below the row from the expand button', () => {
      const root = render();
      const button = expandButton(root);
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('aria-label')).toBe('MAP_LAYERS.ROW.EXPAND');
      expect(details(root)).toBeNull();

      button.click();
      refresh();

      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(details(root)!.id).toBe(button.getAttribute('aria-controls'));
      expect(root.querySelector(`label[for="${slider(root).id}"]`)!.textContent!.trim()).toBe(
        'MAP_LAYERS.ROW.TRANSPARENCY'
      );
    });

    it('opens and closes from a click on the name, which stays out of the tab order', () => {
      const root = render();
      const name = root.querySelector<HTMLButtonElement>('button.layer-row__name')!;
      expect(name.tabIndex).toBe(-1);
      expect(name.textContent!.trim()).toBe('Luftbild');

      name.click();
      refresh();
      expect(details(root)).not.toBeNull();
      expect(name.getAttribute('aria-expanded')).toBe('true');

      name.click();
      refresh();
      expect(details(root)).toBeNull();
    });

    it('shows the transparency and sets the opacity live', () => {
      registry.setOpacity('wms:1', 0.7);
      const root = render();
      expandButton(root).click();
      refresh();
      expect(slider(root).value).toBe('30');
      expect(slider(root).getAttribute('aria-valuetext')).toBe('30 %');

      slider(root).value = '45';
      slider(root).dispatchEvent(new Event('input'));
      refresh();

      expect(registry.entry('wms:1')!.opacity).toBe(0.55);
      expect(root.querySelector('.layer-row__value')!.textContent!.trim()).toBe('45 %');
    });

    it('stays open for the next row of the same layer, e.g. after the panel was closed', () => {
      expandButton(render()).click();
      fixture.destroy();

      expect(details(render())).not.toBeNull();
    });

    it('is not offered for layers without the opacity capability', () => {
      registry.register({
        id: 'wms:1',
        groupId: 'georesource.service',
        title: 'Luftbild',
        kind: 'raster',
        symbol: { kind: 'service', serviceType: 'wms' },
        layer: {} as LayerRegistration['layer'],
        capabilities: { opacity: false },
      });
      const root = render();

      expect(root.querySelector('.layer-row__expand')).toBeNull();
      expect(root.querySelector('button.layer-row__name')).toBeNull();
      expect(root.querySelector('.layer-row__name')!.textContent!.trim()).toBe('Luftbild');
    });
  });
  describe('actions menu', () => {
    /** The menu renders into the overlay container, outside the row. */
    const items = () => [
      ...document.querySelectorAll<HTMLButtonElement>('.layer-actions-menu__item'),
    ];
    const labels = () => items().map((item) => item.textContent!.trim());
    const disabled = () => items().map((item) => item.getAttribute('aria-disabled') === 'true');
    const trigger = (root: HTMLElement) =>
      root.querySelector<HTMLButtonElement>('.layer-row__menu')!;

    function open(root: HTMLElement): void {
      trigger(root).click();
      fixture.detectChanges();
    }

    it('opens from the ⋮ button and lists what applies', () => {
      const root = render();
      expect(trigger(root).getAttribute('aria-label')).toBe('MAP_LAYERS.ACTIONS.MENU');
      expect(trigger(root).getAttribute('aria-haspopup')).toBe('menu');

      open(root);

      expect(document.querySelector('.layer-actions-menu')!.getAttribute('role')).toBe('menu');
      // alone in its list and not removable; no map, so no extent to zoom to
      expect(labels()).toEqual(['MAP_LAYERS.ACTIONS.ZOOM_TO']);
      expect(disabled()).toEqual([true]);
    });

    it('moves the layer within its list', () => {
      registry.register(wms('wms:2'));
      const root = render();
      open(root);
      expect(labels()).toEqual([
        'MAP_LAYERS.ACTIONS.ZOOM_TO',
        'MAP_LAYERS.ACTIONS.MOVE_UP',
        'MAP_LAYERS.ACTIONS.MOVE_DOWN',
      ]);
      expect(disabled()).toEqual([true, false, true]);

      items()[1].click();
      fixture.detectChanges();

      expect(registry.drawOrder()).toEqual(['wms:1', 'wms:2']);
      expect(items()).toEqual([]);
    });

    it('removes a removable layer through its owner', () => {
      const owner = { remove: jest.fn() };
      registry.register(wms('wms:1', { owner, capabilities: { remove: true } }));
      const root = render();
      open(root);

      items()
        .find((item) => item.textContent!.includes('REMOVE'))!
        .click();

      expect(owner.remove).toHaveBeenCalledWith('wms:1');
      expect(registry.entry('wms:1')).toBeUndefined();
    });

    it('opens on right-click on the row', () => {
      const root = render();
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

      root.querySelector('.layer-row')!.dispatchEvent(event);
      fixture.detectChanges();

      expect(event.defaultPrevented).toBe(true);
      expect(labels()).toEqual(['MAP_LAYERS.ACTIONS.ZOOM_TO']);
    });

    it('has no ⋮ button and keeps the browser menu when nothing applies', () => {
      registry.register(wms('wms:1', { capabilities: { zoomTo: false } }));
      const root = render();
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

      root.querySelector('.layer-row')!.dispatchEvent(event);

      expect(trigger(root)).toBeNull();
      expect(event.defaultPrevented).toBe(false);
    });

    it('lists actions provided through MAP_LAYER_ACTIONS', () => {
      const run = jest.fn();
      const exportAction: LayerAction = {
        id: 'export',
        i18nKey: 'EXPORT',
        icon: 'fas fa-download',
        order: 50,
        appliesTo: (entry: LayerEntryState) => entry.kind === 'raster',
        run,
      };
      TestBed.configureTestingModule({
        providers: [{ provide: MAP_LAYER_ACTIONS, multi: true, useValue: exportAction }],
      });
      const root = render();
      open(root);

      expect(labels()).toEqual(['MAP_LAYERS.ACTIONS.ZOOM_TO', 'EXPORT']);
      items()[1].click();
      expect(run).toHaveBeenCalledWith(registry.entry('wms:1'), registry);
    });
  });
});
