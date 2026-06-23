import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LabelService {
  // TODO:  For now extracted from data exchange service, but should be moved to a more central place and be made available via translation service
  labelAllFeatures = 'alle Raumeinheiten';
  labelFilteredFeatures = 'gefilterte Raumeinheiten';
  labelSelectedFeatures = 'selektierte Raumeinheiten';
  labelNumberOfFeatures = 'Anzahl:';
  labelSum = 'rechnerische Summe:';
  labelMean = 'rechnerisches arith. Mittel:';
  labelSum_regional = 'gesamtregionale Vergleichssumme:';
  labelSpatiallyUnassignable_regional = 'räumlich nicht zuordenbare:';
  labelMean_regional = 'gesamtregionaler Vergleichsmittelwert:';
  labelMin = 'Minimalwert:';
  labelMax = 'Maximalwert';

  rankingChartAverageLabel = 'rechnerisches arithmetisches Mittel';
  rankingChartRegionalReferenceValueLabel = 'gesamtregionaler Vergleichsdurchschnitt';
}
