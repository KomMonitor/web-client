/**
 * Filling the placeholders in a process' `dynamicLegend`.
 *
 * The legend is the methodology text a schedule produces: prose with `${…}`
 * placeholders and LaTeX between `$$…$$`. The placeholders name either an input
 * of the process or one of five derived selections. Every placeholder that
 * occurs across the demo instance's 19 UI processes is covered here.
 */

export interface LegendContext {
  /** Raw input values of the draft, keyed by input name. */
  inputs: Record<string, unknown>;
  /** Human-readable value of an enum input, e.g. `MEAN` → "Arithmetisches Mittel". */
  enumLabel: (inputKey: string, apiName: string) => string;
  indicatorName: (indicatorId: string) => string;
  indicatorUnit: (indicatorId: string) => string;
  georesourceName: (georesourceId: string) => string;
}

/** `A`, `B`, … — the symbol a base indicator carries in the formula. */
function formulaLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * Renders `dynamicFormula`, the LaTeX line above the legend.
 *
 * It carries no `${…}` placeholders; the two tokens it uses are written bare
 * and expand to the base indicators joined by an operator.
 */
export function renderFormula(
  template: string | undefined,
  inputs: Record<string, unknown>
): string {
  if (!template) {
    return '';
  }
  const ids = baseIndicatorIds(inputs);
  const letters = ids.map((_, index) => formulaLetter(index));
  return template
    .replaceAll('sum_baseIndicators', letters.join(' + '))
    .replaceAll('prod_baseIndicators', letters.join(' \\times '));
}

/** Base indicator ids, whether they carry a polarity or not. */
function baseIndicatorIds(inputs: Record<string, unknown>): string[] {
  const plain = (inputs['computation_ids'] as string[]) ?? [];
  if (plain.length > 0) {
    return plain;
  }
  const withPolarity = (inputs['computation_ids_with_polarity'] as unknown[]) ?? [];
  return withPolarity
    .map((entry) => (entry as { value?: { ID?: string } })?.value?.ID)
    .filter((id): id is string => !!id);
}

/** Placeholders that are not plain inputs but derived from a selection. */
/**
 * How the operators read in the legend. The legend template itself is German
 * and comes that way from the server, so these labels are not translated —
 * their translated twins live under `ADMIN_SCRIPTS.ADD_MODAL.FILTER_OPERATORS`
 * and belong to the dialog's own select.
 */
const OPERATOR_LABELS: Record<string, string> = {
  Equal: 'gleich (=)',
  Unequal: 'ungleich (!=)',
  Greater_than: 'größer als (>)',
  Greater_than_or_equal: 'größer als oder gleich (>=)',
  Less_than: 'kleiner als (<)',
  Less_than_or_equal: 'kleiner als oder gleich (<=)',
};

/**
 * The filter in words, as the legend sentence "Filterkriterium: …" expects.
 * An unset filter reads as a dash, like on master.
 *
 * `Range` and `Contains` both keep their several values in the one field the
 * process declares — bounds joined by `-`, list members by `,`.
 */
function describeFilter(filter: unknown): string {
  const value = (filter ?? {}) as Record<string, string>;
  const property = value['compFilterProp'];
  const operator = value['compFilterOperator'];
  const propertyValue = value['compFilterPropVal'];

  if (!property || !operator || !propertyValue) {
    return '-';
  }
  if (operator === 'Range') {
    const separator = propertyValue.indexOf('-', 1);
    const from = separator < 0 ? propertyValue : propertyValue.slice(0, separator);
    const to = separator < 0 ? '' : propertyValue.slice(separator + 1);
    return `'${property}' im Wertebereich von '>=${from} bis <${to}'`;
  }
  if (operator === 'Contains') {
    const values = propertyValue
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return `'${property}' 'enthält' '${values.join(', ')}'`;
  }
  return `'${property}' '${OPERATOR_LABELS[operator] ?? operator}' '${propertyValue}'`;
}

function derived(key: string, context: LegendContext): string | undefined {
  const inputs = context.inputs;

  switch (key) {
    case 'compIndicatorSelection.indicatorName':
      return context.indicatorName(String(inputs['computation_id'] ?? ''));
    case 'compIndicatorSelection.unit':
      return context.indicatorUnit(String(inputs['computation_id'] ?? ''));
    case 'refIndicatorSelection.indicatorName':
      return context.indicatorName(String(inputs['reference_id'] ?? ''));
    case 'refIndicatorSelection.unit':
      return context.indicatorUnit(String(inputs['reference_id'] ?? ''));
    case 'georesourceSelection.datasetName':
      return context.georesourceName(String(inputs['georesource_id'] ?? ''));
    case 'list_baseIndicators': {
      const ids = (inputs['computation_ids'] as string[]) ?? [];
      return ids
        .map(
          (id, index) =>
            `$${formulaLetter(index)}$: ${context.indicatorName(id)} [${context.indicatorUnit(id)}]`
        )
        .join('<br/>');
    }
    case 'list_baseIndicators_withPolarity': {
      const entries = (inputs['computation_ids_with_polarity'] as unknown[]) ?? [];
      return entries
        .map((entry, index) => {
          const value = (entry as { value?: { ID?: string; POLARITY?: string } })?.value;
          const id = value?.ID ?? '';
          const polarity = context.enumLabel('POLARITY', value?.POLARITY ?? 'NORMAL');
          return (
            `$${formulaLetter(index)}$: <b>${context.indicatorName(id)}</b> ` +
            `<i>[${context.indicatorUnit(id)}]</i> ; <b>Polarität</b>: ${polarity}`
          );
        })
        .join('<br/>');
    }
    default:
      return undefined;
  }
}

/**
 * Replaces every `${…}` in the template. An unknown placeholder is left in
 * place rather than blanked — a visible `${foo}` says "this text is incomplete",
 * an empty gap does not.
 */
export function renderLegend(template: string | undefined, context: LegendContext): string {
  if (!template) {
    return '';
  }

  // One token in the server's legends is written bare rather than as `${…}`.
  const withFilter = template.replaceAll(
    'georesource_filter_legend',
    describeFilter(context.inputs['comp_filter'])
  );

  return withFilter.replace(/\$\{([^}]+)\}/g, (match, key: string) => {
    const fromDerived = derived(key.trim(), context);
    if (fromDerived !== undefined) {
      return fromDerived;
    }

    const value = context.inputs[key.trim()];
    if (value === undefined || value === null || value === '') {
      return match;
    }
    if (typeof value === 'string') {
      // Enum inputs hold the apiName; the legend should read the label.
      return context.enumLabel(key.trim(), value);
    }
    return String(value);
  });
}
