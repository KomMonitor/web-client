import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { LayerSymbol } from 'services/map-layer-registry-service/map-layer.model';

import { LayerSymbolComponent } from './layer-symbol.component';

describe('LayerSymbolComponent', () => {
  let fixture: ComponentFixture<LayerSymbolComponent>;

  function render(symbol: LayerSymbol): HTMLElement {
    fixture = TestBed.createComponent(LayerSymbolComponent);
    fixture.componentRef.setInput('symbol', symbol);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.layer-symbol');
  }

  it.each([
    [
      { kind: 'fill', color: '#ff0000' },
      '.layer-symbol__fill',
      'background-color',
      'rgb(255, 0, 0)',
    ],
    [
      { kind: 'point', color: '#00ff00' },
      '.layer-symbol__point',
      'background-color',
      'rgb(0, 255, 0)',
    ],
    [
      { kind: 'line', color: '#0000ff' },
      '.layer-symbol__line',
      'background-color',
      'rgb(0, 0, 255)',
    ],
    [
      { kind: 'outline', color: '#ff0000' },
      '.layer-symbol__outline',
      'border-color',
      'rgb(255, 0, 0)',
    ],
  ] as const)('draws %o in its color', (symbol, part, property, value) => {
    const element = render(symbol as LayerSymbol);

    expect(element.classList).toContain(`layer-symbol--${symbol.kind}`);
    expect((element.querySelector(part) as HTMLElement).style.getPropertyValue(property)).toBe(
      value
    );
  });

  it('draws a dashed outline for a dashed symbol', () => {
    const solid = render({ kind: 'outline', color: '#ff0000' });
    expect((solid.querySelector('.layer-symbol__outline') as HTMLElement).style.borderStyle).toBe(
      'solid'
    );

    const dashed = render({ kind: 'outline', color: '#ff0000', dashed: true });
    expect((dashed.querySelector('.layer-symbol__outline') as HTMLElement).style.borderStyle).toBe(
      'dashed'
    );
  });

  it('draws rings for isochrones', () => {
    expect(render({ kind: 'isochrone' }).querySelector('.layer-symbol__rings')).not.toBeNull();
  });

  it('shows the icon of the service type', () => {
    const wms = render({ kind: 'service', serviceType: 'wms' }).querySelector('i')!;
    expect(wms.classList).toContain('fa-image');

    const wfs = render({ kind: 'service', serviceType: 'wfs' }).querySelector('i')!;
    expect(wfs.classList).toContain('fa-draw-polygon');
  });

  it('is decorative only', () => {
    expect(render({ kind: 'isochrone' }).getAttribute('aria-hidden')).toBe('true');
  });
});
