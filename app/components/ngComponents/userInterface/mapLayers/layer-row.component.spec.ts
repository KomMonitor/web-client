import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { MAIN_MAP_LAYER_GROUPS } from 'services/map-layer-registry-service/layer-group-catalog';
import type { LayerRegistration } from 'services/map-layer-registry-service/map-layer.model';
import { MapLayerRegistry } from 'services/map-layer-registry-service/map-layer-registry';
import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

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

  function render(): HTMLElement {
    fixture = TestBed.createComponent(LayerRowComponent);
    fixture.componentRef.setInput('entry', registry.entry('wms:1'));
    fixture.detectChanges();
    return fixture.nativeElement;
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
});
