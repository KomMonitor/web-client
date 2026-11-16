import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { MAIN_MAP_LAYER_GROUPS } from 'services/map-layer-registry-service/layer-group-catalog';
import type { LayerRegistration } from 'services/map-layer-registry-service/map-layer.model';
import { MapLayerRegistry } from 'services/map-layer-registry-service/map-layer-registry';
import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

import { MAP_LAYERS_PANEL_STORAGE_KEY } from './map-layers-panel-ui-state.service';
import { MapLayersPanelComponent } from './map-layers-panel.component';

describe('MapLayersPanelComponent', () => {
  let registry: MapLayerRegistry;
  let fixture: ComponentFixture<MapLayersPanelComponent>;

  const register = (id: string, groupId: string, title = id): void =>
    registry.register({
      id,
      groupId,
      title,
      kind: 'vector',
      symbol: { kind: 'fill', color: '#ff0000' },
      // the panel never touches layers, and there is no map here
      layer: {} as LayerRegistration['layer'],
    });

  function render(): HTMLElement {
    fixture = TestBed.createComponent(MapLayersPanelComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  /** The top-level group sections; titles show their i18n keys, as no loader is set up. */
  const topGroups = (root: HTMLElement) => [
    ...root.querySelectorAll<HTMLElement>('.layer-group--top'),
  ];

  const group = (root: HTMLElement, i18nKey: string): HTMLElement =>
    [...root.querySelectorAll<HTMLElement>('.layer-group')].find(
      (section) =>
        section
          .querySelector(':scope > .layer-group__header .layer-group__title')
          ?.textContent?.trim() === i18nKey
    )!;

  const badge = (section: HTMLElement) =>
    section.querySelector(':scope > .layer-group__header .layer-group__badge')!.textContent!.trim();
  const rowTitles = (section: HTMLElement) =>
    [...section.querySelectorAll('.layer-row__name')].map((name) =>
      name.firstChild!.textContent!.trim()
    );

  beforeEach(() => {
    localStorage.removeItem(MAP_LAYERS_PANEL_STORAGE_KEY);
    registry = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
    TestBed.configureTestingModule({
      imports: [MapLayersPanelComponent, TranslateModule.forRoot()],
      providers: [{ provide: MAP_LAYER_REGISTRY, useValue: registry }],
    });
  });

  afterEach(() => localStorage.removeItem(MAP_LAYERS_PANEL_STORAGE_KEY));

  it('shows the groups of the registry tree in their order, sub groups nested', () => {
    register('indicator', 'indicator', 'Anteil 80+');
    register('georesource:1', 'georesource.point', 'Schulen');
    const root = render();

    expect(
      topGroups(root).map((section) =>
        section.querySelector('.layer-group__title')!.textContent!.trim()
      )
    ).toEqual([
      'MAP_LAYERS.GROUPS.REACHABILITY',
      'MAP_LAYERS.GROUPS.TEMPORARY',
      'MAP_LAYERS.GROUPS.OUTLINE',
      'MAP_LAYERS.GROUPS.GEORESOURCE',
      'MAP_LAYERS.GROUPS.INDICATOR',
    ]);
    const georesource = group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE');
    // empty sub groups are left out (whenEmpty: 'hide'), only Punktdaten has a layer
    expect(
      georesource.querySelectorAll(':scope > .layer-group__body > app-layer-group')
    ).toHaveLength(1);
    expect(rowTitles(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_POINT'))).toEqual(['Schulen']);
    expect(rowTitles(group(root, 'MAP_LAYERS.GROUPS.INDICATOR'))).toEqual(['Anteil 80+']);
  });

  it('counts the layers of a group including its sub groups', () => {
    register('georesource:1', 'georesource.point');
    register('georesource:2', 'georesource.point');
    register('georesource:3', 'georesource.area');
    const root = render();

    expect(badge(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE'))).toBe('3');
    expect(badge(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_POINT'))).toBe('2');
    expect(badge(group(root, 'MAP_LAYERS.GROUPS.INDICATOR'))).toBe('0');
  });

  it('toggles the visibility of a layer with its eye', () => {
    register('file:a', 'temporary', 'Datei A');
    const setVisible = jest.spyOn(registry, 'setVisible');
    const root = render();
    const eye = root.querySelector<HTMLButtonElement>('.layer-row__eye')!;
    expect(eye.getAttribute('aria-pressed')).toBe('true');

    eye.click();
    fixture.detectChanges();

    expect(setVisible).toHaveBeenCalledWith('file:a', false);
    expect(eye.getAttribute('aria-pressed')).toBe('false');
    expect(eye.querySelector('i')!.classList).toContain('fa-eye-slash');
  });

  it('collapses a group and remembers it for the next panel', () => {
    register('file:a', 'temporary', 'Datei A');
    const root = render();
    const header = group(root, 'MAP_LAYERS.GROUPS.TEMPORARY').querySelector<HTMLButtonElement>(
      '.layer-group__toggle'
    )!;
    expect(header.getAttribute('aria-expanded')).toBe('true');

    header.click();
    fixture.detectChanges();

    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(rowTitles(group(root, 'MAP_LAYERS.GROUPS.TEMPORARY'))).toEqual([]);

    TestBed.tick();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [MapLayersPanelComponent, TranslateModule.forRoot()],
      providers: [{ provide: MAP_LAYER_REGISTRY, useValue: registry }],
    });
    const again = render();
    expect(
      group(again, 'MAP_LAYERS.GROUPS.TEMPORARY')
        .querySelector('.layer-group__toggle')!
        .getAttribute('aria-expanded')
    ).toBe('false');
  });

  it('shows a layer registered after rendering', () => {
    const root = render();

    register('search:result', 'temporary', 'Kettwiger Straße');
    fixture.detectChanges();

    expect(rowTitles(group(root, 'MAP_LAYERS.GROUPS.TEMPORARY'))).toEqual(['Kettwiger Straße']);
    expect(badge(group(root, 'MAP_LAYERS.GROUPS.TEMPORARY'))).toBe('1');
  });

  describe('empty groups', () => {
    const hint = (section: HTMLElement) =>
      section
        .querySelector(':scope > .layer-group__body > .layer-group__hint')
        ?.textContent?.trim();

    it('shows the hint of an empty top-level group', () => {
      const root = render();

      expect(hint(group(root, 'MAP_LAYERS.GROUPS.TEMPORARY'))).toBe(
        'MAP_LAYERS.EMPTY_HINTS.TEMPORARY'
      );
      expect(hint(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE'))).toBe(
        'MAP_LAYERS.EMPTY_HINTS.GEORESOURCE'
      );
    });

    it('hides empty sub groups and drops the hint once a layer is there', () => {
      register('wms:1', 'georesource.service', 'Luftbild');
      const root = render();
      const georesource = group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE');

      expect(hint(georesource)).toBeUndefined();
      expect(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_POINT')).toBeUndefined();
      expect(rowTitles(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_SERVICE'))).toEqual(['Luftbild']);
      expect(badge(georesource)).toBe('1');
    });
  });
  it('shows the base layer block above the thematic layers only if the map offers base layers', () => {
    expect(render().querySelector('app-base-layer-section')).toBeNull();
    fixture.destroy();

    registry.setBaseLayers([
      { id: 'base:Grau', title: 'Grau', thumbnail: null, layer: {} as LayerRegistration['layer'] },
    ]);
    const root = render();

    const section = root.querySelector('app-base-layer-section');
    expect(section).not.toBeNull();
    expect(
      section!.compareDocumentPosition(root.querySelector('.map-layers-panel__section-head')!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
  describe('group menu', () => {
    const menuButton = (section: HTMLElement) =>
      section.querySelector<HTMLButtonElement>(':scope > .layer-group__header .layer-group__menu');
    const items = () => [
      ...document.querySelectorAll<HTMLButtonElement>('.layer-actions-menu__item'),
    ];
    const topTitles = (root: HTMLElement) =>
      topGroups(root).map((section) =>
        section.querySelector('.layer-group__title')!.textContent!.trim()
      );

    it('is offered for top-level groups only', () => {
      register('wms:1', 'georesource.service', 'Luftbild');
      const root = render();

      expect(menuButton(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE'))).not.toBeNull();
      expect(menuButton(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_SERVICE'))).toBeNull();
      expect(
        menuButton(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE'))!.getAttribute('aria-label')
      ).toBe('MAP_LAYERS.ACTIONS.GROUP_MENU');
    });

    it('moves a group down and up again, also on the map', () => {
      const root = render();
      const reachability = group(root, 'MAP_LAYERS.GROUPS.REACHABILITY');

      menuButton(reachability)!.click();
      fixture.detectChanges();
      expect(items().map((item) => item.getAttribute('aria-disabled') === 'true')).toEqual([
        true,
        false,
      ]);
      items()[1].click();
      fixture.detectChanges();

      expect(topTitles(root).slice(0, 2)).toEqual([
        'MAP_LAYERS.GROUPS.TEMPORARY',
        'MAP_LAYERS.GROUPS.REACHABILITY',
      ]);
      expect(registry.tree()[1].group.id).toBe('reachability');

      menuButton(group(root, 'MAP_LAYERS.GROUPS.REACHABILITY'))!.click();
      fixture.detectChanges();
      items()[0].click();
      fixture.detectChanges();

      expect(registry.tree()[0].group.id).toBe('reachability');
    });

    it('gives the focus back to the ⋮ button of the moved group', () => {
      const root = render();
      menuButton(group(root, 'MAP_LAYERS.GROUPS.REACHABILITY'))!.click();
      fixture.detectChanges();

      items()[1].click();
      fixture.detectChanges();
      TestBed.tick();

      expect(document.activeElement).toBe(
        menuButton(group(root, 'MAP_LAYERS.GROUPS.REACHABILITY'))
      );
    });
  });
});
