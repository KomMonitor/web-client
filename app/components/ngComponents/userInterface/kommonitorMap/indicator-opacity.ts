/**
 * The indicator's transparency lives on its pane, which the transparency
 * slider of the layer panel fades. The configured `defaultFillOpacity` is the
 * slider's start value rather than being baked into the features as well:
 * otherwise the two multiply and the slider never reaches full opacity.
 *
 * The features are drawn relative to this base: a feature styled with the
 * base opacity is drawn opaque inside the pane, the configured opacities of
 * zero, NoData, outlier or filtered features keep their ratio to it. Without
 * `useTransparencyOnIndicator` the base is 1 and the styles stay as they are.
 */
export function indicatorBaseOpacity(
  useTransparencyOnIndicator: unknown,
  defaultFillOpacity: unknown
): number {
  if (!useTransparencyOnIndicator) {
    return 1;
  }
  // the config values come as strings, e.g. "0.7"
  const base = Number(defaultFillOpacity);
  return Number.isFinite(base) && base > 0 && base <= 1 ? base : 1;
}

/**
 * A copy of a Leaflet path style with its fill and stroke opacity relative to
 * `base`, capped at 1; the pane applies the base. Partial styles, e.g. of a
 * highlight, only get the opacities they set.
 */
export function relativeToBaseOpacity<T>(style: T, base: number): T {
  if (base === 1 || !style || typeof style !== 'object') {
    return style;
  }
  const relative = { ...style } as Record<string, unknown>;
  for (const key of ['fillOpacity', 'opacity']) {
    if (relative[key] === undefined || relative[key] === null || relative[key] === '') {
      continue;
    }
    const value = Number(relative[key]);
    if (Number.isFinite(value)) {
      relative[key] = Math.min(1, value / base);
    }
  }
  return relative as T;
}
