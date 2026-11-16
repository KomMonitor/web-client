import { CdkDrag, type CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { MAIN_MAP_LAYER_GROUPS } from 'services/map-layer-registry-service/layer-group-catalog';
import type {
  LayerGroupDef,
  LayerRegistration,
} from 'services/map-layer-registry-service/map-layer.model';
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
  describe('dragging groups', () => {
    const handles = (root: HTMLElement) => root.querySelectorAll('.layer-group__handle');
    const topIds = () => registry.tree().map((node) => node.group.id);

    function drop(id: string, previousIndex: number, currentIndex: number): void {
      fixture.debugElement
        .query(By.directive(CdkDropList))
        .injector.get(CdkDropList)
        .dropped.emit({ item: { data: id }, previousIndex, currentIndex } as unknown as CdkDragDrop<
          unknown,
          unknown,
          string
        >);
      fixture.detectChanges();
    }

    /** A panel on its own catalogue, e.g. with a top-level group that hides when empty. */
    function renderWith(catalog: LayerGroupDef[]): HTMLElement {
      registry = new MapLayerRegistry(catalog);
      TestBed.overrideProvider(MAP_LAYER_REGISTRY, { useValue: registry });
      return render();
    }

    it('offers a handle on top-level groups only', () => {
      register('wms:1', 'georesource.service', 'Luftbild');
      const root = render();

      expect(handles(root)).toHaveLength(5);
      expect(
        group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_SERVICE').querySelector(
          ':scope > .layer-group__header .layer-group__handle'
        )
      ).toBeNull();
      expect(handles(root)[0].getAttribute('aria-hidden')).toBe('true');
    });

    it('moves a dropped group, and panel and draw order follow', () => {
      register('indicator', 'indicator', 'Indikator');
      register('file:a', 'temporary', 'Datei A');
      const root = render();

      drop('indicator', 4, 0);

      expect(topIds()[0]).toBe('indicator');
      expect(topGroups(root)[0].querySelector('.layer-group__title')!.textContent!.trim()).toBe(
        'MAP_LAYERS.GROUPS.INDICATOR'
      );
      expect(registry.drawOrder()).toEqual(['indicator', 'file:a']);
    });

    it('finds the target among the shown groups when a top-level group is hidden', () => {
      renderWith([
        { id: 'a', i18nKey: 'A' },
        { id: 'hidden', i18nKey: 'HIDDEN', whenEmpty: 'hide' },
        { id: 'b', i18nKey: 'B' },
        { id: 'c', i18nKey: 'C' },
      ]);

      // shown are a, b, c: dropping a on the second place puts it below b
      drop('a', 0, 1);

      expect(topIds()).toEqual(['hidden', 'b', 'a', 'c']);
    });

    it('offers neither a handle nor dragging for a single shown group', () => {
      const root = renderWith([
        { id: 'a', i18nKey: 'A' },
        { id: 'hidden', i18nKey: 'HIDDEN', whenEmpty: 'hide' },
      ]);

      expect(handles(root)).toHaveLength(0);
      expect(fixture.debugElement.query(By.directive(CdkDrag)).injector.get(CdkDrag).disabled).toBe(
        true
      );
    });
  });
  describe('dragging layers', () => {
    const rowHandles = (section: HTMLElement) =>
      [...section.querySelectorAll('.layer-row__handle')].length;

    /** The drop list of the layers in a group; each (sub) group has its own. */
    function rowList(root: HTMLElement, i18nKey: string): CdkDropList {
      const section = group(root, i18nKey);
      return fixture.debugElement
        .queryAll(By.directive(CdkDropList))
        .find(
          (list) =>
            list.nativeElement.classList.contains('layer-group__rows') &&
            list.nativeElement.closest('.layer-group') === section
        )!
        .injector.get(CdkDropList);
    }

    it('offers handles only where layers can be reordered', () => {
      register('georesource:1', 'georesource.point', 'Schulen');
      register('georesource:2', 'georesource.point', 'Kitas');
      register('file:a', 'temporary', 'Datei A');
      register('indicator', 'indicator', 'Indikator');
      register('outline:1', 'outline', 'Bezirke');
      registry.register({
        id: 'outline:2',
        groupId: 'outline',
        title: 'Stadtteile',
        kind: 'vector',
        symbol: { kind: 'outline', color: '#ff0000' },
        layer: {} as LayerRegistration['layer'],
        capabilities: { reorder: false },
      });
      const root = render();

      expect(rowHandles(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_POINT'))).toBe(2);
      expect(rowHandles(group(root, 'MAP_LAYERS.GROUPS.TEMPORARY'))).toBe(0);
      expect(rowHandles(group(root, 'MAP_LAYERS.GROUPS.INDICATOR'))).toBe(0);
      expect(rowHandles(group(root, 'MAP_LAYERS.GROUPS.OUTLINE'))).toBe(1);
      // the drags of the rows; the groups have drags of their own with group ids
      const rowDrag = (id: string) =>
        fixture.debugElement
          .queryAll(By.css('app-layer-row'))
          .map((row) => row.injector.get(CdkDrag))
          .find((drag) => drag.data === id)!;
      expect(['file:a', 'indicator', 'outline:2'].map((id) => rowDrag(id).disabled)).toEqual([
        true,
        true,
        true,
      ]);
      expect(rowDrag('georesource:1').disabled).toBe(false);
    });

    it('moves a dropped layer within its list, and panel and draw order follow', () => {
      register('georesource:1', 'georesource.point', 'Schulen');
      register('georesource:2', 'georesource.point', 'Kitas');
      register('georesource:3', 'georesource.point', 'Parks');
      register('file:a', 'temporary', 'Datei A');
      register('file:b', 'temporary', 'Datei B');
      const root = render();
      expect(rowTitles(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_POINT'))).toEqual([
        'Parks',
        'Kitas',
        'Schulen',
      ]);

      rowList(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_POINT').dropped.emit({
        item: { data: 'georesource:1' },
        previousIndex: 2,
        currentIndex: 0,
      } as unknown as CdkDragDrop<unknown, unknown, string>);
      fixture.detectChanges();

      expect(rowTitles(group(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_POINT'))).toEqual([
        'Schulen',
        'Parks',
        'Kitas',
      ]);
      expect(rowTitles(group(root, 'MAP_LAYERS.GROUPS.TEMPORARY'))).toEqual(['Datei B', 'Datei A']);
      expect(registry.drawOrder()).toEqual([
        'file:b',
        'file:a',
        'georesource:1',
        'georesource:3',
        'georesource:2',
      ]);
    });

    it('gives every sub group a list of its own', () => {
      register('georesource:1', 'georesource.point', 'Schulen');
      register('wms:1', 'georesource.service', 'Luftbild');
      const root = render();

      expect(rowList(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_POINT')).not.toBe(
        rowList(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_SERVICE')
      );
      expect(rowList(root, 'MAP_LAYERS.GROUPS.GEORESOURCE_POINT').connectedTo).toEqual([]);
    });
  });
});
