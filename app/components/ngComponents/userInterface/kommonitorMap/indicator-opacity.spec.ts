import { indicatorBaseOpacity, relativeToBaseOpacity } from './indicator-opacity';

describe('indicatorBaseOpacity', () => {
  it('is the configured default fill opacity, also given as a string', () => {
    expect(indicatorBaseOpacity(true, '0.7')).toBe(0.7);
    expect(indicatorBaseOpacity(true, 0.5)).toBe(0.5);
  });

  it('is 1 without transparency on the indicator', () => {
    expect(indicatorBaseOpacity(false, '0.7')).toBe(1);
    expect(indicatorBaseOpacity(undefined, '0.7')).toBe(1);
  });

  it('is 1 for a missing or unusable value', () => {
    expect(indicatorBaseOpacity(true, undefined)).toBe(1);
    expect(indicatorBaseOpacity(true, 'abc')).toBe(1);
    expect(indicatorBaseOpacity(true, '0')).toBe(1);
    expect(indicatorBaseOpacity(true, '1.5')).toBe(1);
  });
});

describe('relativeToBaseOpacity', () => {
  it('draws the base opacity opaque and keeps the ratio of the others', () => {
    expect(relativeToBaseOpacity({ fillOpacity: '0.7', opacity: 0.7 }, 0.7)).toEqual({
      fillOpacity: 1,
      opacity: 1,
    });
    expect(relativeToBaseOpacity({ fillOpacity: 0.35, color: 'red' }, 0.7)).toEqual({
      fillOpacity: 0.5,
      color: 'red',
    });
  });

  it('caps opacities above the base at 1', () => {
    expect(relativeToBaseOpacity({ fillOpacity: 0.8 }, 0.7)).toEqual({ fillOpacity: 1 });
  });

  it('only touches the opacities a partial style sets', () => {
    expect(relativeToBaseOpacity({ weight: 3, fillOpacity: 0.7 }, 0.7)).toEqual({
      weight: 3,
      fillOpacity: 1,
    });
  });

  it('leaves the style alone for base 1 and does not change the given style', () => {
    const style = { fillOpacity: 0.7 };

    expect(relativeToBaseOpacity(style, 1)).toBe(style);
    relativeToBaseOpacity(style, 0.7);
    expect(style).toEqual({ fillOpacity: 0.7 });
  });
});
