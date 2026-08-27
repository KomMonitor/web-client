import { Injectable, NgZone, inject } from '@angular/core';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';
import { ReachabilityStateService } from 'services/reachability-state-service/reachability-state.service';

// Assuming dom-to-image-more is imported or available globally
declare let _domtoimage: any;

@Injectable({
  providedIn: 'root',
})
export class ReachabilityCoverageReportsHelperService {
  private kommonitorReachabilityHelperService = inject(ReachabilityStateService);
  private kommonitorReachabilityMapHelperService = inject(ReachabilityMapHelperService);
  private zone = inject(NgZone);
  private indicatorValueService = inject(IndicatorValueService);
  private envConfigService = inject(EnvConfigService);
  private selectionState = inject(SelectionStateService);

  // Resolve the indicator precision from the current selection before
  // delegating to IndicatorValueService.
  private getIndicatorValue_asFormattedText(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asFormattedText(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  public reportInProgress_totalCoverage = false;
  public reportInProgress_poiCoverage = false;
  public progressText_poiCoverage = '';
  public reportInProgress_spatialUnitCoverage = false;

  private readonly leafletContainer_height_px = 675;
  private readonly leafletContainer_width_px = 675;
  private readonly leafletContainer_resolution =
    this.leafletContainer_width_px / this.leafletContainer_height_px;

  private readonly pdfLeafletImageWidth = 190;
  private readonly pdfLeafletImageHeight =
    this.pdfLeafletImageWidth / this.leafletContainer_resolution;

  private readonly domToImageMoreSettings = {
    quality: 0.95,
    width: this.leafletContainer_width_px,
    height: this.leafletContainer_height_px,
  };

  private readonly fontName = 'Helvetica';
  private readonly fontSize_default = 12;
  private readonly initY = 10;
  private readonly initX = 10;

  private readonly headStyles = {
    fontStyle: 'bold',
    fontSize: 12,
    fillColor: '#337ab7',
    cellWidth: 'auto' as const,
    halign: 'center' as const,
    valign: 'middle' as const,
  };

  private readonly bodyStyles = {
    fontStyle: 'normal',
    fontSize: 11,
    cellWidth: 'auto' as const,
    halign: 'center' as const,
    valign: 'middle' as const,
  };

  private readonly bodyStyles_spatialUnitPoiCoverage = {
    fontStyle: 'normal',
    fontSize: 11,
    cellWidth: 'auto' as const,
    halign: 'right' as const,
    valign: 'middle' as const,
  };

  private weightStrategyText = '';
  private weightStrategyExplanationText = '';

  private nextLineY = this.initY;

  generateReachabilityIndicatorStatisticsReport_focusSpatialUnitCoverage(
    _indicatorStatistic: any
  ): void {
    // write pdf report with several sections:
    // 1. first page with general information and total overview (map of whole indicator area and all isochrones and all points)
    // 2. for each indicator area create one page to focus that specific area (all points whose isochrones intersect with it)
    //	  summarize affected POIs and summarize POI coverage of this specific area
    // 3. Data table summarizing most important infos per spatial unit area as one line ranked by most coverage
  }

  insertLogo(doc: jsPDF): jsPDF {
    const img = new Image();
    const subPath = location.pathname;
    img.src = subPath + 'logos/KM_Logo1.png';
    doc.addImage(img, 'PNG', 193, 5, 12, 12);
    return doc;
  }

  setupDoc(): jsPDF {
    const doc: any = new jsPDF({ unit: 'mm', format: 'a4' });
    /*  const doc = new jsPDF({
      margin: 0,
      unit: 'mm',
      format: 'a4',
      orientation: "portrait"
    }); */

    doc.setProperties({
      title: 'KomMonitor Report Erreichbarkeitsversorgung',
      subject: 'KomMonitor Report Erreichbarkeitsversorgung',
      author: 'KomMonitor',
      keywords: 'Indikator, Erreichbarkeitsversorgung, Erreichbarkeitsanalyse',
      creator: 'KomMonitor',
    });

    return doc;
  }

  async generateTotalCoverageReport_focusPoiCoverage(
    reachabilityScenario: any,
    indicatorStatistic: any
  ): Promise<void> {
    this.reportInProgress_totalCoverage = true;
    this.zone.run(() => {
      /* intentionally empty: trigger change detection only */
    });

    const doc = this.setupDoc();
    this.insertLogo(doc);

    doc.setDrawColor(148, 148, 148);
    doc.setFont(this.fontName, 'normal', 'normal');
    doc.setFontSize(this.fontSize_default);

    this.nextLineY = this.initY;

    this.insertTitle(doc);
    this.insertTable_indicator_poi_information(
      doc,
      reachabilityScenario,
      indicatorStatistic,
      false
    );
    this.nextLineY = (doc as any).autoTable.previous.finalY + 5;

    this.insertCoverageType(doc, indicatorStatistic);
    this.nextLineY = (doc as any).autoTable.previous.finalY + 5;

    this.insertSectionSeparator(doc);

    await this.addCoverageInformation_totalCoverage(doc, reachabilityScenario, indicatorStatistic);

    doc.save('KomMonitor-Report_Erreichbarkeits_Coverage_Gesamtgebiet.pdf');

    this.reportInProgress_totalCoverage = false;
    this.zone.run(() => {
      /* intentionally empty: trigger change detection only */
    });
  }

  async addCoverageInformation_totalCoverage(
    doc: jsPDF,
    reachabilityScenario: any,
    indicatorStatistic: any
  ): Promise<jsPDF> {
    doc.setFont(this.fontName, 'bolditalic');
    doc.setFontSize(12);
    const totalCoverageTitle = doc.splitTextToSize(
      'Gesamtergebnis - Versorgung über alle Raumeinheiten',
      180
    );
    doc.text(totalCoverageTitle, this.initX, this.nextLineY, { baseline: 'top' });
    doc.setFont(this.fontName, 'normal', 'normal');
    doc.setFontSize(this.fontSize_default);

    this.nextLineY += 10;

    const totalCoverage_tableArray: any[] = [];

    for (const overallCoverageEntry of indicatorStatistic.coverageResult.overallCoverage) {
      let range = overallCoverageEntry.range;
      if (this.kommonitorReachabilityHelperService.settings.focus === 'time') {
        range = Number(range) / 60 + ' [Minuten]';
      } else {
        range = range + ' [Meter]';
      }

      const coverage_absolute =
        this.getIndicatorValue_asFormattedText(overallCoverageEntry.coverage[0].absoluteCoverage) +
        ' von ' +
        this.getIndicatorValue_asFormattedText(
          indicatorStatistic.coverageResult.timeseries[0].value
        ) +
        ' [' +
        indicatorStatistic.indicator.unit +
        ']';
      const coverage_relative =
        this.getIndicatorValue_asFormattedText(
          overallCoverageEntry.coverage[0].relativeCoverage * 100
        ) + ' [%]';

      totalCoverage_tableArray.push([range, coverage_absolute, coverage_relative]);
    }

    (doc as any).autoTable({
      head: [['Einzugsgebiet', 'geschätzte absolute Versorgung', 'geschätzter Anteil']],
      body: totalCoverage_tableArray,
      theme: 'grid',
      headStyles: this.headStyles,
      bodyStyles: this.bodyStyles,
      startY: this.nextLineY,
    });

    const leafletMapDomId = 'leaflet_map_total_indicator_coverage';
    this.appendLeafletContainer(leafletMapDomId);

    await this.initTotalCoverageLeafletMap(
      leafletMapDomId,
      reachabilityScenario,
      indicatorStatistic
    );
    await new Promise((resolve) => setTimeout(resolve, 750));

    this.kommonitorReachabilityMapHelperService.zoomToIndicatorLayer(leafletMapDomId);
    await new Promise((resolve) => setTimeout(resolve, 750));

    this.nextLineY = (doc as any).autoTable.previous.finalY + 5;
    const remainingSpaceY = 297 - this.nextLineY - 5;

    const leafletMapScreenshot =
      await this.kommonitorReachabilityMapHelperService.takeScreenshot_image(
        leafletMapDomId,
        this.domToImageMoreSettings
      );

    if (remainingSpaceY < this.pdfLeafletImageHeight) {
      doc.addPage();
      this.insertLogo(doc);
      this.insertTitle(doc);

      doc.setFont(this.fontName, 'bolditalic');
      doc.setFontSize(12);
      const totalCoverageTitle = doc.splitTextToSize(
        'Gesamtergebnis - Versorgung über alle Raumeinheiten',
        180
      );
      doc.text(totalCoverageTitle, this.initX, this.nextLineY, { baseline: 'top' });
      doc.setFont(this.fontName, 'normal', 'normal');
      doc.setFontSize(this.fontSize_default);

      this.nextLineY += 10;
    }

    if (leafletMapScreenshot) {
      doc.addImage(
        leafletMapScreenshot,
        'JPEG',
        this.initX,
        this.nextLineY,
        this.pdfLeafletImageWidth,
        this.pdfLeafletImageHeight,
        '',
        'MEDIUM'
      );
    }

    this.removeLeafletContainer(leafletMapDomId);

    return doc;
  }

  insertSectionSeparator(doc: jsPDF): jsPDF {
    doc.line(this.initX, this.nextLineY, 180, this.nextLineY);
    this.nextLineY += 5;
    return doc;
  }

  insertTitle(doc: jsPDF): jsPDF {
    doc.setFont(this.fontName, 'bolditalic');
    doc.setFontSize(14);
    const titleArray = doc.splitTextToSize('Geschätzte Versorgung durch Punkteinzugsgebiete', 180);
    doc.text(titleArray, this.initX, this.initY, { baseline: 'top' });
    doc.setFont(this.fontName, 'normal', 'normal');
    doc.setFontSize(this.fontSize_default);

    this.nextLineY = this.initY;
    for (const _item of titleArray) {
      this.nextLineY += 10;
    }

    return doc;
  }

  insertTable_indicator_poi_information(
    doc: jsPDF,
    reachabilityScenario: any,
    indicatorStatistic: any,
    insertCoverageTypeShortInformation: boolean
  ): jsPDF {
    const headerArray = ['Eingangsdaten', 'Name', 'Zeitschnitt'];
    const bodyArray = [
      [
        'Punktdatensatz',
        reachabilityScenario.poiDataset.poiName,
        reachabilityScenario.poiDataset.poiDate,
      ],
      [
        'Indikator',
        `${indicatorStatistic.indicator.indicatorName} [ ${indicatorStatistic.indicator.unit} ]\n - \n${indicatorStatistic.spatialUnit.spatialUnitName}`,
        indicatorStatistic.timestamp,
      ],
    ];

    if (insertCoverageTypeShortInformation) {
      this.setWeightStrategyTexts(indicatorStatistic);
      bodyArray.push(['Gewichtungstyp', this.weightStrategyText, '-']);
    }

    (doc as any).autoTable({
      head: [headerArray],
      body: bodyArray,
      theme: 'grid',
      headStyles: this.headStyles,
      bodyStyles: this.bodyStyles,
      startY: this.nextLineY,
    });

    return doc;
  }

  setWeightStrategyTexts(indicatorStatistic: any): void {
    this.weightStrategyText = '';
    this.weightStrategyExplanationText = '';
    if (indicatorStatistic.weightStrategy.apiName === 'residential_areas') {
      this.weightStrategyText += 'versorgte Wohnfläche';
      this.weightStrategyExplanationText +=
        'Pro Raumebene wird nur die Wohnfläche mit den Einzugsgebieten eines Punktes räumlich verschnitten. Die geschätzte Gesamtversorgung einer Raumebene ergibt sich dann aus dem durch die Punkteinzugsgebiete insgesamt überlappenden Anteil an der Wohnfläche innerhalb der Raumebene. Dieses Verfahren berücksichtigt demnach nur die Wohnfläche und liefert daher einen genaueren Schätzwert als der einfache Gesamtflächenanteil. Da keine Einzelpersonen im Verfahren verücksichtigt werden, ist das Ergebnis ausdrücklich als Schätzwert zu interpretieren.';
    } else {
      this.weightStrategyText += 'einfacher Gesamtflächenanteil';
      this.weightStrategyExplanationText +=
        'Pro Raumebene wird die Gesamtfläche mit den Einzugsgebieten eines Punktes räumlich verschnitten. Die geschätzte Gesamtversorgung einer Raumebene ergibt sich dann aus dem durch die Punkteinzugsgebiete insgesamt überlappenden Anteil an der Gesamtfläche der Raumebene. Da keine Einzelpersonen im Verfahren verücksichtigt werden, ist das Ergebnis ausdrücklich als Schätzwert zu interpretieren.';
    }
  }

  insertCoverageType(doc: jsPDF, indicatorStatistic: any): jsPDF {
    this.setWeightStrategyTexts(indicatorStatistic);

    (doc as any).autoTable({
      head: [['Gewichtungstyp', 'Hinweis zu Berechnung']],
      body: [[this.weightStrategyText, this.weightStrategyExplanationText]],
      theme: 'grid',
      headStyles: this.headStyles,
      bodyStyles: this.bodyStyles,
      startY: this.nextLineY,
    });

    return doc;
  }

  async generateFeatureCoverageReport_focusPoiCoverage(
    reachabilityScenario: any,
    indicatorStatistic: any
  ): Promise<void> {
    this.reportInProgress_poiCoverage = true;
    this.progressText_poiCoverage =
      '0 / ' +
      this.kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability
        .features.length;
    this.zone.run(() => {
      /* intentionally empty: trigger change detection only */
    });

    const doc = this.setupDoc();

    doc.setDrawColor(148, 148, 148);
    doc.setFont(this.fontName, 'normal', 'normal');
    doc.setFontSize(this.fontSize_default);

    this.nextLineY = this.initY;

    const leafletMapDomId = 'leaflet_map_poi_individual_indicator_coverage';
    this.appendLeafletContainer(leafletMapDomId);

    await this.initPoiIndividualLeafletMap(
      leafletMapDomId,
      reachabilityScenario,
      indicatorStatistic
    );

    const mapParts =
      this.kommonitorReachabilityMapHelperService.getMapParts_byDomId(leafletMapDomId);
    const poiLayer = mapParts.indicatorStatistics.poiLayer;
    const poiLayer_array = this.sortPoiLayer_byTotalCoverageDesc(poiLayer);

    for (let index = 0; index < poiLayer_array.length; index++) {
      const markerLayer = poiLayer_array[index];
      await this.insertPoiIndividualPage(
        doc,
        reachabilityScenario,
        indicatorStatistic,
        markerLayer,
        leafletMapDomId
      );

      this.progressText_poiCoverage = `${index + 1} / ${poiLayer_array.length}`;
      this.zone.run(() => {
        /* intentionally empty: trigger change detection only */
      });

      if (index < poiLayer_array.length - 1) {
        doc.addPage();
      }
    }

    this.removeLeafletContainer(leafletMapDomId);
    doc.save('KomMonitor-Report_Erreichbarkeits_Coverage_Einzelpunkte-Karte.pdf');

    this.reportInProgress_poiCoverage = false;
    this.zone.run(() => {
      /* intentionally empty: trigger change detection only */
    });
  }

  sortPoiLayer_byTotalCoverageDesc(poiLayer: any): any[] {
    const poiArray_sorted: any[] = [];
    for (const poiLayerKey in poiLayer._layers) {
      if (Object.prototype.hasOwnProperty.call(poiLayer._layers, poiLayerKey)) {
        const markerLayer = poiLayer._layers[poiLayerKey];
        poiArray_sorted.push(markerLayer);
      }
    }

    poiArray_sorted.sort((a, b) => {
      const isochroneStatistics_a = a.feature.properties.individualIsochronePruneResults;
      const absoluteCoverage_a =
        isochroneStatistics_a[isochroneStatistics_a.length - 1].overallCoverage[0].absoluteCoverage;

      const isochroneStatistics_b = b.feature.properties.individualIsochronePruneResults;
      const absoluteCoverage_b =
        isochroneStatistics_b[isochroneStatistics_b.length - 1].overallCoverage[0].absoluteCoverage;

      return absoluteCoverage_b - absoluteCoverage_a;
    });

    return poiArray_sorted;
  }

  async insertSpatialUnitIndividualPage(
    doc: jsPDF,
    reachabilityScenario: any,
    indicatorStatistic: any,
    spatialUnitLayer: any,
    domId: string
  ): Promise<jsPDF> {
    const feature = spatialUnitLayer.feature;
    this.kommonitorReachabilityMapHelperService.zoomToIndicatorFeature(domId, feature);

    await new Promise((resolve) => setTimeout(resolve, 750));

    this.insertLogo(doc);
    this.insertTitle(doc);
    this.insertTable_indicator_poi_information(doc, reachabilityScenario, indicatorStatistic, true);

    this.nextLineY = (doc as any).autoTable.previous.finalY + 5;

    this.insertSectionSeparator(doc);

    await this.addCoverageInformation_spatialUnitIndividualCoverage(
      doc,
      reachabilityScenario,
      indicatorStatistic,
      spatialUnitLayer,
      domId
    );

    return doc;
  }

  async addCoverageInformation_spatialUnitIndividualCoverage(
    doc: jsPDF,
    reachabilityScenario: any,
    indicatorStatistic: any,
    spatialUnitLayer: any,
    domId: string
  ): Promise<jsPDF> {
    doc.setFont(this.fontName, 'bolditalic');
    doc.setFontSize(12);
    const poiCoverageTitle = doc.splitTextToSize(
      `Versorgung der Raumebene "${spatialUnitLayer.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]}"`,
      180
    );
    doc.text(poiCoverageTitle, this.initX, this.nextLineY, { baseline: 'top' });
    doc.setFont(this.fontName, 'normal', 'normal');
    doc.setFontSize(this.fontSize_default);

    this.nextLineY += 10;

    const coverages_perRange = spatialUnitLayer.feature.properties.overallCoverages;
    const poiCoverage_tableArray: any[] = [];

    for (const coverage_perRange in coverages_perRange) {
      let range = coverages_perRange[coverage_perRange].range;
      if (this.kommonitorReachabilityHelperService.settings.focus === 'time') {
        range = Number(range) + ' [Minuten]';
      } else {
        range = range + ' [Meter]';
      }

      const coverage_total_absolute =
        this.getIndicatorValue_asFormattedText(
          coverages_perRange[coverage_perRange].absoluteCoverage
        ) +
        ' von ' +
        this.getIndicatorValue_asFormattedText(
          spatialUnitLayer.feature.properties[
            this.envConfigService.indicatorDatePrefix + indicatorStatistic.timestamp
          ]
        ) +
        ' [' +
        indicatorStatistic.indicator.unit +
        ']';
      const coverage_total_relative =
        this.getIndicatorValue_asFormattedText(
          coverages_perRange[coverage_perRange].relativeCoverage * 100
        ) + ' [%]';

      poiCoverage_tableArray.push([
        range,
        coverage_total_absolute,
        coverage_total_relative,
        coverages_perRange[coverage_perRange].poiFeatureIds.length,
      ]);
    }

    (doc as any).autoTable({
      head: [
        [
          'Einzugsgebiet',
          'geschätzte absolute Versorgung',
          'geschätzter Anteil',
          'Anzahl beteiligter Punktdaten',
        ],
      ],
      body: poiCoverage_tableArray,
      theme: 'grid',
      headStyles: this.headStyles,
      bodyStyles: this.bodyStyles,
      startY: this.nextLineY,
    });

    this.nextLineY = (doc as any).autoTable.previous.finalY + 5;
    const remainingSpaceY = 297 - this.nextLineY - 5;

    const leafletMapScreenshot =
      await this.kommonitorReachabilityMapHelperService.takeScreenshot_image(
        domId,
        this.domToImageMoreSettings
      );

    if (remainingSpaceY < this.pdfLeafletImageHeight) {
      doc.addPage();
      this.insertLogo(doc);
      this.insertTitle(doc);

      doc.setFont(this.fontName, 'bolditalic');
      doc.setFontSize(12);
      const poiCoverageTitle = doc.splitTextToSize(
        `Versorgung der Raumebene "${spatialUnitLayer.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]}"`,
        180
      );
      doc.text(poiCoverageTitle, this.initX, this.nextLineY, { baseline: 'top' });
      doc.setFont(this.fontName, 'normal', 'normal');
      doc.setFontSize(this.fontSize_default);

      this.nextLineY += 10;
    }

    if (leafletMapScreenshot) {
      doc.addImage(
        leafletMapScreenshot,
        'JPEG',
        this.initX,
        this.nextLineY,
        this.pdfLeafletImageWidth,
        this.pdfLeafletImageHeight,
        '',
        'MEDIUM'
      );
    }

    return doc;
  }

  async insertPoiIndividualPage(
    doc: jsPDF,
    reachabilityScenario: any,
    indicatorStatistic: any,
    marker: any,
    domId: string
  ): Promise<jsPDF> {
    const feature = marker.feature;
    const poiIsochroneLayer =
      this.kommonitorReachabilityMapHelperService.generateSinglePoiIsochroneLayer(feature);
    this.kommonitorReachabilityMapHelperService.removeSinglePoiIsochroneLayer(domId);
    this.kommonitorReachabilityMapHelperService.addSinglePoiIsochroneLayer(
      domId,
      feature,
      poiIsochroneLayer,
      true
    );

    await new Promise((resolve) => setTimeout(resolve, 750));

    this.insertLogo(doc);
    this.insertTitle(doc);
    this.insertTable_indicator_poi_information(doc, reachabilityScenario, indicatorStatistic, true);

    this.nextLineY = (doc as any).autoTable.previous.finalY + 5;

    this.insertSectionSeparator(doc);

    await this.addCoverageInformation_poiIndividualCoverage(
      doc,
      reachabilityScenario,
      indicatorStatistic,
      marker,
      domId
    );

    return doc;
  }

  async addCoverageInformation_poiIndividualCoverage(
    doc: jsPDF,
    reachabilityScenario: any,
    indicatorStatistic: any,
    marker: any,
    domId: string
  ): Promise<jsPDF> {
    doc.setFont(this.fontName, 'bolditalic');
    doc.setFontSize(12);
    const poiCoverageTitle = doc.splitTextToSize(
      `Versorgung durch Punkt "${marker.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]}"`,
      180
    );
    doc.text(poiCoverageTitle, this.initX, this.nextLineY, { baseline: 'top' });
    doc.setFont(this.fontName, 'normal', 'normal');
    doc.setFontSize(this.fontSize_default);

    this.nextLineY += 10;

    const poiIsochroneStatistics = marker.feature.properties.individualIsochronePruneResults;
    const poiCoverage_tableArray: any[] = [];
    const spatialUnitPoiCoverage_tableArray: any[] = [];

    for (const poiIsochroneStatistic of poiIsochroneStatistics) {
      let range: any = Number(poiIsochroneStatistic.poiFeatureId.split('_')[1]);
      if (this.kommonitorReachabilityHelperService.settings.focus === 'time') {
        range = Number(range) + ' [Minuten]';
      } else {
        range = range + ' [Meter]';
      }

      const coverage_total_absolute =
        this.getIndicatorValue_asFormattedText(
          poiIsochroneStatistic.overallCoverage[0].absoluteCoverage
        ) +
        ' von ' +
        this.getIndicatorValue_asFormattedText(
          indicatorStatistic.coverageResult.timeseries[0].value
        ) +
        ' [' +
        indicatorStatistic.indicator.unit +
        ']';
      const coverage_total_relative =
        this.getIndicatorValue_asFormattedText(
          poiIsochroneStatistic.overallCoverage[0].relativeCoverage * 100
        ) + ' [%]';

      poiCoverage_tableArray.push([range, coverage_total_absolute, coverage_total_relative]);

      let coverage_spatialUnit_range = '';
      for (const spatialUnitCoverageEntry of poiIsochroneStatistic.spatialUnitCoverage) {
        const indicatorGeoJSON = indicatorStatistic.indicator.geoJSON;
        const spatialUnitFeatureId = spatialUnitCoverageEntry.spatialUnitFeatureId;
        const indicatorFeature =
          this.kommonitorReachabilityMapHelperService.getIndicatorFeature_forSpatialUnitFeatureId(
            indicatorGeoJSON,
            spatialUnitFeatureId
          );
        const spatialUnitFeatureName =
          indicatorFeature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME];

        coverage_spatialUnit_range += `${spatialUnitFeatureName}\n${this.getIndicatorValue_asFormattedText(spatialUnitCoverageEntry.coverage[0].absoluteCoverage)} von ${indicatorFeature.properties[this.envConfigService.indicatorDatePrefix + indicatorStatistic.timestamp]} [${indicatorStatistic.indicator.unit}]  =>  entspricht ${this.getIndicatorValue_asFormattedText(spatialUnitCoverageEntry.coverage[0].relativeCoverage * 100)} [%]\n\n`;
      }

      coverage_spatialUnit_range = coverage_spatialUnit_range.slice(0, -2);
      spatialUnitPoiCoverage_tableArray.push([range, coverage_spatialUnit_range]);
    }

    (doc as any).autoTable({
      head: [['Einzugsgebiet', 'geschätzte absolute Versorgung', 'geschätzter Anteil']],
      body: poiCoverage_tableArray,
      theme: 'grid',
      headStyles: this.headStyles,
      bodyStyles: this.bodyStyles,
      startY: this.nextLineY,
    });

    this.nextLineY = (doc as any).autoTable.previous.finalY + 5;

    (doc as any).autoTable({
      head: [['Einzugsgebiet', 'anteilig versorgte Raumebenen']],
      body: spatialUnitPoiCoverage_tableArray,
      theme: 'grid',
      headStyles: this.headStyles,
      bodyStyles: this.bodyStyles_spatialUnitPoiCoverage,
      startY: this.nextLineY,
    });

    this.nextLineY = (doc as any).autoTable.previous.finalY + 5;
    const remainingSpaceY = 297 - this.nextLineY - 5;

    const leafletMapScreenshot =
      await this.kommonitorReachabilityMapHelperService.takeScreenshot_image(
        domId,
        this.domToImageMoreSettings
      );

    if (remainingSpaceY < this.pdfLeafletImageHeight) {
      doc.addPage();
      this.insertLogo(doc);
      this.insertTitle(doc);

      doc.setFont(this.fontName, 'bolditalic');
      doc.setFontSize(12);
      const poiCoverageTitle = doc.splitTextToSize(
        `Versorgung durch Punkt "${marker.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]}"`,
        180
      );
      doc.text(poiCoverageTitle, this.initX, this.nextLineY, { baseline: 'top' });
      doc.setFont(this.fontName, 'normal', 'normal');
      doc.setFontSize(this.fontSize_default);

      this.nextLineY += 10;
    }

    if (leafletMapScreenshot) {
      doc.addImage(
        leafletMapScreenshot,
        'JPEG',
        this.initX,
        this.nextLineY,
        this.pdfLeafletImageWidth,
        this.pdfLeafletImageHeight,
        '',
        'MEDIUM'
      );
    }

    return doc;
  }

  async initTotalCoverageLeafletMap(
    leafletMapDomId: string,
    reachabilityScenario: any,
    indicatorStatistic: any
  ): Promise<void> {
    this.kommonitorReachabilityMapHelperService.initReachabilityIndicatorStatisticsGeoMap(
      leafletMapDomId
    );

    this.kommonitorReachabilityMapHelperService.replaceIsochroneGeoJSON(
      leafletMapDomId,
      this.kommonitorReachabilityHelperService.settings.selectedStartPointLayer.datasetName,
      this.kommonitorReachabilityHelperService.currentIsochronesGeoJSON,
      this.kommonitorReachabilityHelperService.settings.transitMode,
      this.kommonitorReachabilityHelperService.settings.focus,
      this.kommonitorReachabilityHelperService.settings.rangeArray,
      this.kommonitorReachabilityHelperService.settings.useMultipleStartPoints,
      this.kommonitorReachabilityHelperService.settings.dissolveIsochrones
    );

    const poiDataset = this.kommonitorReachabilityHelperService.settings.selectedStartPointLayer;
    const original_nonDissolved_isochrones =
      this.kommonitorReachabilityHelperService.original_nonDissolved_isochrones;
    await this.kommonitorReachabilityMapHelperService.replaceReachabilityIndicatorStatisticsOnMap(
      leafletMapDomId,
      poiDataset,
      original_nonDissolved_isochrones,
      indicatorStatistic
    );

    this.kommonitorReachabilityMapHelperService.zoomToIndicatorLayer(leafletMapDomId);
  }

  async initPoiIndividualLeafletMap(
    leafletMapDomId: string,
    reachabilityScenario: any,
    indicatorStatistic: any
  ): Promise<void> {
    this.kommonitorReachabilityMapHelperService.initReachabilityIndicatorStatisticsGeoMap(
      leafletMapDomId
    );

    const poiDataset = this.kommonitorReachabilityHelperService.settings.selectedStartPointLayer;
    const original_nonDissolved_isochrones =
      this.kommonitorReachabilityHelperService.original_nonDissolved_isochrones;
    await this.kommonitorReachabilityMapHelperService.replaceReachabilityIndicatorStatisticsOnMap(
      leafletMapDomId,
      poiDataset,
      original_nonDissolved_isochrones,
      indicatorStatistic
    );
  }

  async initSpatialUnitIndividualLeafletMap(
    leafletMapDomId: string,
    reachabilityScenario: any,
    indicatorStatistic: any
  ): Promise<void> {
    this.kommonitorReachabilityMapHelperService.initReachabilityIndicatorStatisticsGeoMap(
      leafletMapDomId
    );

    this.kommonitorReachabilityMapHelperService.replaceIsochroneGeoJSON(
      leafletMapDomId,
      this.kommonitorReachabilityHelperService.settings.selectedStartPointLayer.datasetName,
      this.kommonitorReachabilityHelperService.currentIsochronesGeoJSON,
      this.kommonitorReachabilityHelperService.settings.transitMode,
      this.kommonitorReachabilityHelperService.settings.focus,
      this.kommonitorReachabilityHelperService.settings.rangeArray,
      this.kommonitorReachabilityHelperService.settings.useMultipleStartPoints,
      this.kommonitorReachabilityHelperService.settings.dissolveIsochrones
    );

    const poiDataset = this.kommonitorReachabilityHelperService.settings.selectedStartPointLayer;
    const original_nonDissolved_isochrones =
      this.kommonitorReachabilityHelperService.original_nonDissolved_isochrones;
    await this.kommonitorReachabilityMapHelperService.replaceReachabilityIndicatorStatisticsOnMap(
      leafletMapDomId,
      poiDataset,
      original_nonDissolved_isochrones,
      indicatorStatistic
    );
  }

  appendLeafletContainer(domId: string): void {
    const divContainer = document.createElement('div');
    divContainer.setAttribute('id', domId);
    divContainer.setAttribute(
      'style',
      `height: ${this.leafletContainer_height_px}px; width: ${this.leafletContainer_width_px}px;`
    );
    document.body.appendChild(divContainer);
  }

  removeLeafletContainer(domId: string): void {
    document.getElementById(domId)?.remove();
  }

  async generateCoverageDataTableReport_focusPoiCoverage(
    _doc: jsPDF,
    _indicatorStatistic: any
  ): Promise<void> {
    /* intentionally empty: no-op placeholder for future data-table report */
  }

  async generateFeatureCoverageReport_focusSpatialUnitCoverage(
    reachabilityScenario: any,
    indicatorStatistic: any
  ): Promise<void> {
    this.reportInProgress_spatialUnitCoverage = true;
    this.zone.run(() => {
      /* intentionally empty: trigger change detection only */
    });

    const doc = this.setupDoc();
    this.insertLogo(doc);

    doc.setDrawColor(148, 148, 148);
    doc.setFont(this.fontName, 'normal', 'normal');
    doc.setFontSize(this.fontSize_default);

    this.nextLineY = this.initY;

    const leafletMapDomId = 'leaflet_map_spatialUnit_individual_indicator_coverage';
    this.appendLeafletContainer(leafletMapDomId);

    await this.initSpatialUnitIndividualLeafletMap(
      leafletMapDomId,
      reachabilityScenario,
      indicatorStatistic
    );

    const mapParts =
      this.kommonitorReachabilityMapHelperService.getMapParts_byDomId(leafletMapDomId);
    const poiLayer = mapParts.indicatorStatistics.poiLayer;
    const indicatorLayer = mapParts.indicatorStatistics.indicatorLayer;

    const indicatorLayer_array = this.aggregatePoisForSpatialUnits(indicatorLayer, poiLayer);

    for (let index = 0; index < indicatorLayer_array.length; index++) {
      const spatialUnitLayer = indicatorLayer_array[index];
      await this.insertSpatialUnitIndividualPage(
        doc,
        reachabilityScenario,
        indicatorStatistic,
        spatialUnitLayer,
        leafletMapDomId
      );
      if (index < indicatorLayer_array.length - 1) {
        doc.addPage();
      }
    }

    this.removeLeafletContainer(leafletMapDomId);
    doc.save('KomMonitor-Report_Erreichbarkeits_Coverage_Raumebenen-Karte.pdf');

    this.reportInProgress_spatialUnitCoverage = false;
    this.zone.run(() => {
      /* intentionally empty: trigger change detection only */
    });
  }

  aggregatePoisForSpatialUnits(indicatorLayer: any, poiLayer: any): any[] {
    const poiArray: any[] = [];
    for (const poiLayerKey in poiLayer._layers) {
      if (Object.prototype.hasOwnProperty.call(poiLayer._layers, poiLayerKey)) {
        const markerLayer = poiLayer._layers[poiLayerKey];
        poiArray.push(markerLayer);
      }
    }

    const indicatorArray: any[] = [];
    for (const indicatorLayerKey in indicatorLayer._layers) {
      if (Object.prototype.hasOwnProperty.call(indicatorLayer._layers, indicatorLayerKey)) {
        const layer = indicatorLayer._layers[indicatorLayerKey];
        let indicatorFeature = layer.feature;
        indicatorFeature = this.aggregatePoiCoverage(indicatorFeature, poiArray);
        layer.feature = indicatorFeature;
        indicatorArray.push(layer);
      }
    }

    indicatorArray.sort((a, b) => {
      if (!a.feature.properties.overallCoverages) {
        return -1;
      }
      if (!b.feature.properties.overallCoverages) {
        return 0;
      }

      const ranges_a = Object.keys(a.feature.properties.overallCoverages).map((item) =>
        Number(item)
      );
      const ranges_b = Object.keys(b.feature.properties.overallCoverages).map((item) =>
        Number(item)
      );
      const maxRange_a = Math.max(...ranges_a);
      const maxRange_b = Math.max(...ranges_b);
      const coverage_a =
        a.feature.properties.overallCoverages['' + maxRange_a].absoluteCoverage || 0;
      const coverage_b =
        b.feature.properties.overallCoverages['' + maxRange_b].absoluteCoverage || 0;
      return coverage_b - coverage_a;
    });

    return indicatorArray;
  }

  aggregatePoiCoverage(indicatorFeature: any, poiLayerArray: any[]): any {
    indicatorFeature.properties.overallCoverages = {};

    for (const poiLayer of poiLayerArray) {
      const poiFeature = poiLayer.feature;
      const poiIsochroneStatistics = poiFeature.properties.individualIsochronePruneResults;

      for (const poiIsochroneStatistic of poiIsochroneStatistics) {
        const range = Number(poiIsochroneStatistic.poiFeatureId.split('_')[1]);

        for (const spatialUnitCoverageEntry of poiIsochroneStatistic.spatialUnitCoverage) {
          const spatialUnitFeatureId = spatialUnitCoverageEntry.spatialUnitFeatureId;

          if (
            spatialUnitFeatureId ==
            indicatorFeature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
          ) {
            if (indicatorFeature.properties.overallCoverages[range]) {
              indicatorFeature.properties.overallCoverages[range].absoluteCoverage +=
                spatialUnitCoverageEntry.coverage[0].absoluteCoverage;
              indicatorFeature.properties.overallCoverages[range].relativeCoverage +=
                spatialUnitCoverageEntry.coverage[0].relativeCoverage;
              if (
                !indicatorFeature.properties.overallCoverages[range].poiFeatureIds.includes(
                  poiFeature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
                )
              ) {
                indicatorFeature.properties.overallCoverages[range].poiFeatureIds.push(
                  poiFeature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
                );
              }
            } else {
              indicatorFeature.properties.overallCoverages[range] = {
                absoluteCoverage: spatialUnitCoverageEntry.coverage[0].absoluteCoverage,
                relativeCoverage: spatialUnitCoverageEntry.coverage[0].relativeCoverage,
                range: range,
                poiFeatureIds: [
                  poiFeature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME],
                ],
              };
            }
          }
        }
      }
    }
    return indicatorFeature;
  }
}
