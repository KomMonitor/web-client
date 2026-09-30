import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import domtoimage from 'dom-to-image-more';
import { saveAs } from 'file-saver';

import { KommonitorMapComponent } from './kommonitor-map.component';

jest.mock('dom-to-image-more', () => ({ __esModule: true, default: { toBlob: jest.fn() } }));
jest.mock('file-saver', () => ({ saveAs: jest.fn() }));

describe('KommonitorMapComponent', () => {
  let component: KommonitorMapComponent;
  let fixture: ComponentFixture<KommonitorMapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KommonitorMapComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(KommonitorMapComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filterForScreenshot', () => {
    // dom-to-image walks every child node, including plain text nodes, whose
    // `className` is `undefined` rather than a string - a prior version called
    // `.includes` on it unconditionally and crashed the whole export on any
    // map text (labels, popups, attribution).
    it('keeps a text node instead of throwing on its missing className', () => {
      const textNode = document.createTextNode('some label text');

      expect(() => component.filterForScreenshot(textNode)).not.toThrow();
      expect(component.filterForScreenshot(textNode)).toBe(true);
    });

    it('excludes a leaflet control element', () => {
      const control = document.createElement('div');
      control.className = 'leaflet-control-zoom leaflet-control';

      expect(component.filterForScreenshot(control)).toBe(false);
    });

    it('keeps a plain map element', () => {
      const tile = document.createElement('img');
      tile.className = 'leaflet-tile';

      expect(component.filterForScreenshot(tile)).toBe(true);
    });

    it('excludes buttons and links regardless of their class', () => {
      expect(component.filterForScreenshot(document.createElement('button'))).toBe(false);
      expect(component.filterForScreenshot(document.createElement('a'))).toBe(false);
    });
  });

  describe('exportMap', () => {
    let ngMapNode: HTMLDivElement;

    beforeEach(() => {
      jest.useFakeTimers();
      // #ngMap is only rendered by the component's own template, which these
      // specs never trigger (no fixture.detectChanges()) - a bare stand-in is
      // enough since exportMap only reads it via document.getElementById.
      ngMapNode = document.createElement('div');
      ngMapNode.id = 'ngMap';
      document.body.appendChild(ngMapNode);
      (component as unknown as { map: unknown }).map = { getSize: () => ({ x: 10, y: 10 }) };
      component.loadingData = false;
      (domtoimage.toBlob as jest.Mock).mockReset();
      (saveAs as jest.Mock).mockReset();
    });

    afterEach(() => {
      document.body.removeChild(ngMapNode);
      jest.useRealTimers();
    });

    it('shows the loading overlay while the screenshot is generated and hides it again on success', async () => {
      const blob = new Blob();
      (domtoimage.toBlob as jest.Mock).mockResolvedValue(blob);

      const exported = component.exportMap();
      expect(component.loadingData).toBe(true);

      await exported;
      jest.advanceTimersByTime(250);

      expect(saveAs).toHaveBeenCalledWith(blob, 'KomMonitor-Screenshot.png');
      expect(component.loadingData).toBe(false);
    });

    it('hides the loading overlay again when the screenshot fails', async () => {
      (domtoimage.toBlob as jest.Mock).mockRejectedValue(new Error('tainted canvas'));

      const exported = component.exportMap();
      expect(component.loadingData).toBe(true);

      await exported;
      jest.advanceTimersByTime(250);

      expect(saveAs).not.toHaveBeenCalled();
      expect(component.loadingData).toBe(false);
    });
  });
});
