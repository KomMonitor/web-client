import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { MAIN_MAP_LAYER_GROUPS } from 'services/map-layer-registry-service/layer-group-catalog';
import type { BaseLayerRegistration } from 'services/map-layer-registry-service/map-layer.model';
import { MapLayerRegistry } from 'services/map-layer-registry-service/map-layer-registry';
import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

import { BaseLayerSectionComponent } from './base-layer-section.component';
import { MAP_LAYERS_PANEL_STORAGE_KEY } from './map-layers-panel-ui-state.service';

/** The gallery never touches layers, and there is no map here. */
function base(name: string, overrides: Partial<BaseLayerRegistration> = {}): BaseLayerRegistration {
  return {
    id: `base:${name}`,
    title: name,
    thumbnail: { url: `https://tiles.example/${name}.png`, grayscale: false },
    layer: {} as BaseLayerRegistration['layer'],
    ...overrides,
  };
}

describe('BaseLayerSectionComponent', () => {
  let registry: MapLayerRegistry;
  let fixture: ComponentFixture<BaseLayerSectionComponent>;
  let root: HTMLElement;

  function render(): void {
    fixture = TestBed.createComponent(BaseLayerSectionComponent);
    fixture.detectChanges();
    root = fixture.nativeElement;
  }

  function update(): void {
    TestBed.tick();
    fixture.detectChanges();
  }

  const header = () => root.querySelector<HTMLButtonElement>('.base-layer-section__header')!;
  const tiles = () => [...root.querySelectorAll<HTMLElement>('.base-tile')];
  const radios = () => [...root.querySelectorAll<HTMLInputElement>('.base-tile__input')];
  const slider = () => root.querySelector<HTMLInputElement>('input[type="range"]')!;
  const label = (tile: HTMLElement) => tile.querySelector('.base-tile__label')!.textContent!.trim();

  function expand(): void {
    header().click();
    update();
  }

  beforeEach(() => {
    localStorage.removeItem(MAP_LAYERS_PANEL_STORAGE_KEY);
    registry = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
    registry.setBaseLayers([
      base('OSM Grau', {
        thumbnail: { url: 'https://tiles.example/grau.png', grayscale: true },
      }),
      base('RVR Stadtplan'),
      base('Ohne Vorschau', { thumbnail: null }),
    ]);
    TestBed.configureTestingModule({
      imports: [BaseLayerSectionComponent, TranslateModule.forRoot()],
      providers: [{ provide: MAP_LAYER_REGISTRY, useValue: registry }],
    });
  });

  afterEach(() => localStorage.removeItem(MAP_LAYERS_PANEL_STORAGE_KEY));

  describe('collapsed', () => {
    it('names the active base layer with its thumbnail and the bottom badge', () => {
      render();

      expect(header().getAttribute('aria-expanded')).toBe('false');
      expect(root.querySelector('.base-layer-section__title')!.textContent!.trim()).toBe(
        'MAP_LAYERS.BASE.TITLE'
      );
      expect(root.querySelector('.base-layer-section__name')!.textContent!.trim()).toBe('OSM Grau');
      expect(root.querySelector('.base-layer-section__mini img')!.getAttribute('src')).toBe(
        'https://tiles.example/grau.png'
      );
      expect(root.querySelector('.base-layer-section__badge')!.textContent!.trim()).toBe(
        'MAP_LAYERS.BASE.BOTTOM'
      );
      expect(root.querySelector('.base-layer-section__gallery')).toBeNull();
    });

    it('names the empty map when no base layer is shown', () => {
      registry.setBaseLayer(null);
      render();

      expect(root.querySelector('.base-layer-section__name')!.textContent!.trim()).toBe(
        'MAP_LAYERS.BASE.EMPTY'
      );
      expect(root.querySelector('.base-layer-section__mini .fa-ban')).not.toBeNull();
    });
  });

  it('expands and stays expanded for the next panel', () => {
    render();
    expand();

    expect(header().getAttribute('aria-expanded')).toBe('true');
    expect(header().getAttribute('aria-controls')).toBe(
      root.querySelector('.base-layer-section__body')!.id
    );

    fixture.destroy();
    render();
    expect(root.querySelector('.base-layer-section__gallery')).not.toBeNull();
  });

  describe('gallery', () => {
    beforeEach(() => {
      render();
      expand();
    });

    it('offers the empty map first, then every base layer, as one radio group', () => {
      const gallery = root.querySelector('.base-layer-section__gallery')!;
      expect(gallery.getAttribute('role')).toBe('radiogroup');
      expect(gallery.getAttribute('aria-label')).toBe('MAP_LAYERS.BASE.CHOOSE');

      expect(tiles().map(label)).toEqual([
        'MAP_LAYERS.BASE.EMPTY',
        'OSM Grau',
        'RVR Stadtplan',
        'Ohne Vorschau',
      ]);
      const names = new Set(radios().map((radio) => radio.name));
      expect(names.size).toBe(1);
      expect([...names][0]).toBeTruthy();
      expect(radios().map((radio) => radio.checked)).toEqual([false, true, false, false]);
    });

    it('turns a choice into the registry command, the empty map as null', () => {
      radios()[2].click();
      update();
      expect(registry.activeBaseLayer()?.id).toBe('base:RVR Stadtplan');

      radios()[0].click();
      update();
      expect(registry.activeBaseLayer()).toBeNull();
      expect(radios().map((radio) => radio.checked)).toEqual([true, false, false, false]);
    });

    it('follows a choice made elsewhere, e.g. in the old layer control', () => {
      registry.setBaseLayer('base:Ohne Vorschau');
      update();

      expect(radios().map((radio) => radio.checked)).toEqual([false, false, false, true]);
      expect(root.querySelector('.base-layer-section__name')!.textContent!.trim()).toBe(
        'Ohne Vorschau'
      );
    });

    it('shows thumbnails, grey where asked, and an icon without one or when it fails', () => {
      const thumb = (index: number) => tiles()[index].querySelector('.base-tile__thumb')!;

      expect(thumb(0).querySelector('.fa-ban')).not.toBeNull();
      expect(
        thumb(1).querySelector('img')!.classList.contains('base-preview__image--grayscale')
      ).toBe(true);
      expect(
        thumb(2).querySelector('img')!.classList.contains('base-preview__image--grayscale')
      ).toBe(false);
      expect(thumb(3).querySelector('img')).toBeNull();
      expect(thumb(3).querySelector('.fa-map')).not.toBeNull();

      thumb(2).querySelector('img')!.dispatchEvent(new Event('error'));
      update();
      expect(thumb(2).querySelector('img')).toBeNull();
      expect(thumb(2).querySelector('.fa-map')).not.toBeNull();
    });

    it('sets the transparency of the base layer live', () => {
      registry.setBaseLayerOpacity(0.7);
      update();
      expect(slider().value).toBe('30');
      expect(slider().getAttribute('aria-valuetext')).toBe('30 %');
      expect(root.querySelector(`label[for="${slider().id}"]`)!.textContent!.trim()).toBe(
        'MAP_LAYERS.BASE.TRANSPARENCY'
      );

      slider().value = '45';
      slider().dispatchEvent(new Event('input'));
      update();

      expect(registry.baseLayerOpacity()).toBeCloseTo(0.55);
      expect(root.querySelector('.base-layer-section__value')!.textContent!.trim()).toBe('45 %');
    });

    it('disables the transparency for the empty map', () => {
      expect(slider().disabled).toBe(false);

      registry.setBaseLayer(null);
      update();

      expect(slider().disabled).toBe(true);
    });
  });
});
