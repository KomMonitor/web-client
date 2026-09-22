import {
  CategoricalMappingType,
  DefaultClassificationMappingItemType,
  DefaultClassificationMappingType,
  QualitativeClassificationMappingType,
} from 'models/data-management-api';

export interface Classification {
  name: string;
  id: string;
  imgPath: string;
  description: string;
}

/**
 * Fill color for feature values that match none of the defined categories (the
 * "Sonstige"/other bucket). Kept here as the single source shared by the map
 * styling (VisualStyleHelperServiceNew.styleCategorical) and the legend row, so
 * both color and count the same bucket. Matches the admin overflow default color.
 */
export const CATEGORICAL_OTHER_COLOR = '#c9ced4';

/**
 * What the admin wizard emits for the numeric branch of the discriminator: the
 * generated schema type, but with `items` optional.
 *
 * That one divergence is deliberate. The wizard only sends per-spatial-unit
 * break values for the REGIONAL_DEFAULT method; for the computed methods the
 * field is left out entirely. Emitting `items: []` instead would satisfy the
 * schema but change what goes to the API, so the type follows the payload
 * rather than the other way round. The spec should arguably bind `items` to
 * `classificationMethod` — that is backend work.
 */
export type QuantitativeClassificationMapping = Omit<DefaultClassificationMappingType, 'items'> & {
  items?: DefaultClassificationMappingItemType[];
};

/**
 * Both branches of the backend's `classificationType` discriminator: numeric
 * classes with breaks, or discrete categories. Use this wherever a stored
 * `defaultClassificationMapping` is read or written — the generated types put
 * the *abstract* mapping on `IndicatorOverviewType` and friends, which carries
 * neither branch's fields.
 */
export type ClassificationMapping =
  | QuantitativeClassificationMapping
  | QualitativeClassificationMappingType;

/**
 * Whether a stored classification mapping is qualitative (categorical). Defensive:
 * the backend may not (yet) persist `classificationType`, so a present
 * `categoricalData` array is treated as qualitative too (mirrors the admin
 * wizard's `applyMapping`).
 */
export function isQualitativeMapping(
  mapping: ClassificationMapping | null | undefined
): mapping is QualitativeClassificationMappingType {
  if (!mapping) {
    return false;
  }
  if (mapping.classificationType === 'QUALITATIVE') {
    return true;
  }
  // Legacy mappings may carry the categories without the discriminator.
  const categories = (mapping as { categoricalData?: unknown[] }).categoricalData;
  return !!categories?.length;
}

/**
 * Resolves the fill color for a categorical feature value by matching it against the
 * category definitions (normalized string comparison), returning the shared "other"
 * color ({@link CATEGORICAL_OTHER_COLOR}) when nothing matches. Shared by the map
 * styling (VisualStyleHelperServiceNew.styleCategorical) and the reporting diagram
 * pipeline (DiagramHelperServiceService.getColorForFeature) so both color categorical
 * features identically.
 */
export function resolveCategoricalColor(
  value: unknown,
  categoricalData: CategoricalMappingType[] | null | undefined
): string {
  const normalized = String(value).trim();
  const match = categoricalData?.find(
    (category) => String(category.categoricalValue).trim() === normalized
  );
  return match?.color ?? CATEGORICAL_OTHER_COLOR;
}
