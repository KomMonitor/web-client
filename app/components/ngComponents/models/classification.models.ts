import { DefaultClassificationMappingType } from 'models/data-management-api';

export interface Classification {
  name: string;
  id: string;
  imgPath: string;
  description: string;
}

/** Numeric (sequential/diverging) vs categorical (qualitative) classification. */
export type ClassificationType = 'QUANTITATIVE' | 'QUALITATIVE';

/** One category of a qualitative classification: its value, color and label. */
export interface CategoricalClassificationItem {
  categoricalValue: string;
  color: string;
  label: string;
}

/**
 * Fill color for feature values that match none of the defined categories (the
 * "Sonstige"/other bucket). Kept here as the single source shared by the map
 * styling (VisualStyleHelperServiceNew.styleCategorical) and the legend row, so
 * both color and count the same bucket. Matches the admin overflow default color.
 */
export const CATEGORICAL_OTHER_COLOR = '#c9ced4';

/**
 * Client-side extension of the backend `DefaultClassificationMappingType` with the
 * fields introduced by the step-5 redesign prototype that are not (yet) part of the
 * generated OpenAPI schema: the numeric/categorical type switch, per-class labels,
 * explicit individual colors, and the categorical data.
 *
 * These field names are provisional. The forward mapping lives in exactly one place
 * ({@link IndicatorClassificationStateService.buildDefaultClassificationMapping}) and
 * the reverse in `applyMapping`; adjust both plus this type once the backend schema
 * is finalized.
 */
export interface ExtendedDefaultClassificationMapping extends Omit<
  DefaultClassificationMappingType,
  'classificationMethod' | 'items'
> {
  classificationType: ClassificationType;
  /** Only present for numeric classification. */
  classificationMethod?: DefaultClassificationMappingType['classificationMethod'];
  /** Per-spatial-unit break values; only present for the regional default method. */
  items?: DefaultClassificationMappingType['items'];
  /** Per-class-position labels (numeric classification). */
  labels?: string[];
  /** Explicit per-class colors when `colorBrewerSchemeName` is `INDIVIDUAL`. */
  individualColors?: string[];
  /** Category definitions for categorical classification. */
  categoricalData?: CategoricalClassificationItem[];
}

/**
 * Whether a stored classification mapping is qualitative (categorical). Defensive:
 * the backend may not (yet) persist `classificationType`, so a present
 * `categoricalData` array is treated as qualitative too (mirrors the admin
 * wizard's `applyMapping`).
 */
export function isQualitativeMapping(
  mapping: Partial<ExtendedDefaultClassificationMapping> | null | undefined
): boolean {
  return mapping?.classificationType === 'QUALITATIVE' || !!mapping?.categoricalData?.length;
}
