import { IndicatorMetadataPATCHInputType, IndicatorOverviewType } from 'models/data-management-api';

/**
 * Builds the body that writes a generated methodology onto an indicator.
 *
 * `PATCH /indicators/{id}` is not a partial update: the spec says it "replaces
 * the formerly stored metadata" and marks eight fields required. So the body
 * has to carry the indicator's current metadata, with only
 * `processDescription` exchanged — sending `{ processDescription }` alone
 * would either be rejected or blank out name, unit, tags and topic.
 *
 * The copy is a whitelist, which is what keeps `permissions` out of the body.
 * Master built the same body field by field and had to be repaired once
 * because it carried permissions along (`b37d60ec`); a whitelist cannot
 * reintroduce that, and it also leaves out `ownerId`, `isPublic` and the
 * read-only fields the overview carries.
 */
export function buildIndicatorMethodologyPatchBody(
  indicator: IndicatorOverviewType,
  processDescription: string
): IndicatorMetadataPATCHInputType {
  const body: IndicatorMetadataPATCHInputType = {
    // The eight required fields, taken as they stand today.
    abbreviation: indicator.abbreviation ?? '',
    interpretation: indicator.interpretation ?? '',
    isHeadlineIndicator: indicator.isHeadlineIndicator ?? false,
    metadata: indicator.metadata,
    tags: indicator.tags ?? [],
    topicReference: indicator.topicReference ?? '',
    unit: indicator.unit ?? '',
    // The one field this patch is about.
    processDescription,
    // The name is `indicatorName` on the way out and `datasetName` on the way in.
    datasetName: indicator.indicatorName,
  };

  // The optional fields are only set when the indicator has them: an explicit
  // `undefined` would travel as `null` through JSON and overwrite a value.
  assignIfPresent(body, 'characteristicValue', indicator.characteristicValue);
  assignIfPresent(body, 'creationType', indicator.creationType);
  assignIfPresent(body, 'indicatorType', indicator.indicatorType);
  assignIfPresent(body, 'defaultClassificationMapping', indicator.defaultClassificationMapping);
  assignIfPresent(body, 'regionalReferenceValues', indicator.regionalReferenceValues);
  assignIfPresent(body, 'displayOrder', indicator.displayOrder);
  assignIfPresent(body, 'precision', indicator.precision);
  assignIfPresent(body, 'referenceDateNote', indicator.referenceDateNote);
  assignIfPresent(
    body,
    'lowestSpatialUnitForComputation',
    indicator.lowestSpatialUnitForComputation
  );

  // The references are named differently on either side, and describe
  // themselves with the referenced dataset's name in the answer but with its id
  // in the body.
  if (indicator.referencedIndicators) {
    body.refrencesToOtherIndicators = indicator.referencedIndicators.map((reference) => ({
      indicatorId: reference.referencedIndicatorId,
      referenceDescription: reference.referencedIndicatorDescription,
    }));
  }
  if (indicator.referencedGeoresources) {
    body.refrencesToGeoresources = indicator.referencedGeoresources.map((reference) => ({
      georesourceId: reference.referencedGeoresourceId,
      referenceDescription: reference.referencedGeoresourceDescription,
    }));
  }

  return body;
}

function assignIfPresent<K extends keyof IndicatorMetadataPATCHInputType>(
  body: IndicatorMetadataPATCHInputType,
  key: K,
  value: IndicatorMetadataPATCHInputType[K] | undefined
): void {
  if (value !== undefined && value !== null) {
    body[key] = value;
  }
}
