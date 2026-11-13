import { TestBed } from '@angular/core/testing';

import {
  MAP_LAYERS_PANEL_STORAGE_KEY,
  MapLayersPanelUiState,
} from './map-layers-panel-ui-state.service';

describe('MapLayersPanelUiState', () => {
  beforeEach(() => localStorage.removeItem(MAP_LAYERS_PANEL_STORAGE_KEY));
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.removeItem(MAP_LAYERS_PANEL_STORAGE_KEY);
  });

  it('starts with every group expanded', () => {
    expect(TestBed.inject(MapLayersPanelUiState).isExpanded('georesource')).toBe(true);
  });

  it('toggles a group and keeps the state for the next instance', () => {
    const uiState = TestBed.inject(MapLayersPanelUiState);

    uiState.toggle('georesource');
    TestBed.tick();

    expect(uiState.isExpanded('georesource')).toBe(false);
    expect(JSON.parse(localStorage.getItem(MAP_LAYERS_PANEL_STORAGE_KEY)!)).toEqual({
      collapsedGroups: ['georesource'],
    });

    TestBed.resetTestingModule();
    expect(TestBed.inject(MapLayersPanelUiState).isExpanded('georesource')).toBe(false);
  });

  it('works without storage, it just forgets', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const uiState = TestBed.inject(MapLayersPanelUiState);

    uiState.toggle('indicator');
    TestBed.tick();

    expect(uiState.isExpanded('indicator')).toBe(false);
  });
});
