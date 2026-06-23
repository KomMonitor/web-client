import { Injectable, inject } from '@angular/core';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';
import { UPDATE_INTERVAL_LABELS } from 'services/data-exchange-service/data-exchange.constants';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import domtoimage from 'dom-to-image-more';

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  private envConfigService = inject(EnvConfigService);
  private topicHierarchyService = inject(TopicHierarchyService);

  // ─── Public date utilities (also delegated to from DataExchangeService) ─────

  dateToTS(date: Date | undefined): number | undefined {
    if (date) {
      return date.valueOf();
    }
    return undefined;
  }

  tsToDate_withOptionalUpdateInterval(ts: any, updateIntervalApiName: any = undefined): any {
    if (!ts) return '';

    const date = new Date(ts);

    if (updateIntervalApiName) {
      const interval = updateIntervalApiName.toLowerCase();
      if (interval === 'yearly') {
        return date.getFullYear();
      } else if (interval === 'half_yearly' || interval === 'monthly') {
        return date.getMonth() + 1 + '/' + date.getFullYear();
      } else if (interval === 'quarterly') {
        const year = date.getFullYear();
        const month = date.getMonth();
        if (month < 4) return 'Q1/' + year;
        if (month < 7) return 'Q2/' + year;
        if (month < 10) return 'Q3/' + year;
        return 'Q4/' + year;
      }
    }

    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getIndicatorStringFromIndicatorType(indicatorType: string): string | undefined {
    for (const option of this.envConfigService.indicatorTypeOptions) {
      if (indicatorType.includes(option.apiName)) {
        return option.displayName;
      }
    }
    return undefined;
  }

  // ─── Georesource PDF ─────────────────────────────────────────────────────────

  async downloadMetadataPDF_georesource(
    georesourceMetadata: any,
    availableTopics: any[]
  ): Promise<void> {
    const pdfName = georesourceMetadata.datasetName + '.pdf';
    const doc = await this.createMetadataPDF_georesource(
      georesourceMetadata,
      pdfName,
      availableTopics
    );
    doc.save(pdfName);
  }

  async createMetadataPDF_georesource(
    georesource: any,
    pdfName: string,
    availableTopics: any[]
  ): Promise<any> {
    const doc: any = new jsPDF({ unit: 'mm', format: 'a4' });

    const img = new Image();
    img.src = location.pathname + 'logos/KM_Logo1.png';
    doc.addImage(img, 'PNG', 193, 5, 12, 12);

    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bolditalic', 'normal');
    const titleArray = doc.splitTextToSize('Geodatensatz: ' + georesource.datasetName, 180);
    doc.text(titleArray, 14, 25);
    doc.setFontSize(11);

    let initialStartY = 30;
    if (titleArray.length > 1) {
      titleArray.forEach(() => {
        initialStartY += 5;
      });
    }

    const headStyles = { fontStyle: 'bold', fontSize: 12, fillColor: '#337ab7', cellWidth: 'auto' };
    const bodyStyles = { fontStyle: 'normal', fontSize: 11, cellWidth: 'auto' };
    const columnStyles = { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { fontStyle: 'normal' } };

    const topicsString = this._buildTopicsString(georesource.topicReference, availableTopics);

    let category = 'Punkt';
    if (georesource.isLOI) category = 'Linie';
    else if (georesource.isAOI) category = 'Fläche';

    doc.autoTable({
      head: [['Themenfeld', 'Datentyp', 'letzte Aktualisierung']],
      body: [
        [
          topicsString,
          category,
          this.tsToDate_withOptionalUpdateInterval(this.dateToTS(georesource.metadata.lastUpdate)),
        ],
      ],
      theme: 'grid',
      headStyles,
      bodyStyles,
      startY: initialStartY,
    });

    const datesString = this._buildGeoresourceDatesString(georesource.availablePeriodsOfValidity);

    doc.autoTable({
      head: [],
      body: [
        ['Beschreibung', georesource.metadata.description],
        ['Datengrundlage', georesource.metadata.databasis || '-'],
        ['Datenquelle', georesource.metadata.datasource || '-'],
        ['Datenhalter und Kontakt', georesource.metadata.contact || '-'],
        ['Bemerkung', georesource.metadata.note || '-'],
        [
          'Zeitbezug / Fortführungsintervall',
          UPDATE_INTERVAL_LABELS.get(georesource.metadata.updateInterval.toUpperCase()),
        ],
        ['Verfügbare Gültigkeitszeiträume', datesString],
        ['Quellen / Literatur', georesource.metadata.literature || '-'],
      ],
      theme: 'grid',
      headStyles,
      bodyStyles,
      columnStyles,
      startY: doc.autoTable.previous.finalY + 10,
    });

    doc.setProperties({
      title: 'KomMonitor Geodatenblatt',
      subject: pdfName,
      author: 'KomMonitor',
      keywords: 'Geodaten, Metadatenblatt',
      creator: 'KomMonitor',
    });
    return doc;
  }

  async generateGeoresourceMetadataPdf_asBlob(
    georesourceMetadata: any,
    availableTopics: any[]
  ): Promise<Blob> {
    const pdfName = georesourceMetadata.datasetName + '.pdf';
    const doc = await this.createMetadataPDF_georesource(
      georesourceMetadata,
      pdfName,
      availableTopics
    );
    return doc.output('blob', { filename: pdfName });
  }

  async generateAndDownloadGeoresourceZIP(
    georesourceMetadata: any,
    georesourceData: any,
    fileName: string,
    fileEnding: string,
    jsZipOptions: any,
    availableTopics: any[]
  ): Promise<void> {
    const metadataPdf = await this.generateGeoresourceMetadataPdf_asBlob(
      georesourceMetadata,
      availableTopics
    );
    const zip = new JSZip();
    zip.file(fileName + fileEnding, georesourceData, jsZipOptions);
    zip.file(fileName + '_Metadata.pdf', metadataPdf);
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, fileName + '.zip');
    });
  }

  // ─── Indicator PDF ───────────────────────────────────────────────────────────

  async createMetadataPDF_indicator(
    indicator: any,
    availableSpatialUnits: any[],
    availableTopics: any[]
  ): Promise<any> {
    const doc: any = new jsPDF({ unit: 'mm', format: 'a4' });

    const img = new Image();
    img.src = location.pathname + 'logos/KM_Logo1.png';
    doc.addImage(img, 'PNG', 193, 5, 12, 12);

    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bolditalic', 'normal');
    const titleArray = doc.splitTextToSize('Indikator: ' + indicator.indicatorName, 180);
    doc.text(titleArray, 14, 25);

    const hasCharacteristic =
      indicator.characteristicValue &&
      indicator.characteristicValue !== '-' &&
      indicator.characteristicValue !== '';

    if (hasCharacteristic) {
      doc.setFontSize(14);
      doc.text(indicator.characteristicValue, 14, 25);
    }

    doc.setFontSize(11);

    let initialStartY = 30;
    if (titleArray.length > 1) {
      titleArray.forEach(() => {
        initialStartY += 5;
      });
    }
    if (hasCharacteristic) initialStartY += 5;

    const headStyles = { fontStyle: 'bold', fontSize: 12, fillColor: '#337ab7', cellWidth: 'auto' };
    const bodyStyles = { fontStyle: 'normal', fontSize: 11, cellWidth: 'auto' };
    const columnStyles = { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { fontStyle: 'normal' } };

    const topicsString = this._buildTopicsString(indicator.topicReference, availableTopics);
    const category = indicator.isHeadlineIndicator ? 'Leitindikator' : 'Basisindikator';

    doc.autoTable({
      head: [['Themenfeld', 'Kategorie', 'Typ', 'Kennzeichen']],
      body: [
        [
          topicsString,
          category,
          this.getIndicatorStringFromIndicatorType(indicator.indicatorType),
          indicator.abbreviation || '-',
        ],
      ],
      theme: 'grid',
      headStyles,
      bodyStyles,
      startY: initialStartY,
    });

    const linkedIndicatorsString = this._buildLinkedItemsString(
      indicator.referencedIndicators,
      'referencedIndicatorName',
      'referencedIndicatorDescription'
    );
    const linkedGeoresourcesString = this._buildLinkedItemsString(
      indicator.referencedGeoresources,
      'referencedGeoresourceName',
      'referencedGeoresourceDescription'
    );

    const spatialUnitsString = this._buildSpatialUnitsString(indicator, availableSpatialUnits);
    const datesString = this._buildIndicatorDatesString(indicator);

    let imgData: any;
    let imgWidth: number;
    let imgHeight: number;

    if (indicator.processDescription && indicator.processDescription.includes('$')) {
      const node = document.querySelector('#indicatorProcessDescription');
      await domtoimage
        .toJpeg(node, { quality: 1.0 })
        .then((dataUrl: any) => {
          imgData = dataUrl;
        })
        .catch((error: any) => {
          console.error(error);
        });

      if (imgData) {
        const dimensions: any = await this._getImageDimensions(imgData);
        imgWidth = dimensions.w;
        imgHeight = dimensions.h;
      }
    }

    doc.autoTable({
      head: [],
      body: [
        ['Beschreibung', indicator.metadata.description],
        ['Maßeinheit', indicator.unit],
        ['Methodik', indicator.processDescription || '-'],
        ['Interpretation', indicator.interpretation || '-'],
        ['Tags', indicator.tags ? JSON.stringify(indicator.tags) : '-'],
        ['Verknüpfte Indikatoren', linkedIndicatorsString],
        ['Verknüpfte Geodaten', linkedGeoresourcesString],
      ],
      theme: 'grid',
      headStyles,
      bodyStyles,
      columnStyles,
      startY: doc.autoTable.previous.finalY + 10,
      willDrawCell: function (data: any) {
        if (
          imgData &&
          data.row.index === 2 &&
          data.column.index === 1 &&
          data.cell.section === 'body'
        ) {
          data.row.height = 2.5 * data.cell.height;
          data.row.maxCellHeight = 2.5 * data.cell.height;
          data.cell.height = 2.5 * data.cell.height;
          data.cell.text = '';
        }
        if (
          imgData &&
          data.row.index === 2 &&
          data.column.index === 0 &&
          data.cell.section === 'body'
        ) {
          data.row.height = 2.5 * data.cell.height;
          data.row.maxCellHeight = 2.5 * data.cell.height;
          data.cell.height = 2.5 * data.cell.height;
        }
      },
      didDrawCell: function (data: any) {
        if (
          imgData &&
          data.row.index === 2 &&
          data.column.index === 1 &&
          data.cell.section === 'body'
        ) {
          const cellHeight = data.cell.height - data.cell.padding('vertical');
          const cellWidth = data.cell.width - data.cell.padding('horizontal');
          const imgScale = cellHeight / imgHeight;
          const width = Math.min(imgWidth * imgScale, cellWidth);
          doc.addImage(imgData, 'PNG', data.cell.x, data.cell.y, width, cellHeight);
        }
      },
    });

    doc.autoTable({
      head: [],
      body: [
        ['Datengrundlage', indicator.metadata.databasis || '-'],
        ['Datenquelle', indicator.metadata.datasource || '-'],
        ['Datenhalter und Kontakt', indicator.metadata.contact || '-'],
        ['Bemerkung', indicator.metadata.note || '-'],
        ['Raumbezug', spatialUnitsString],
        [
          'Zeitbezug / Fortführungsintervall',
          UPDATE_INTERVAL_LABELS.get(indicator.metadata.updateInterval.toUpperCase()),
        ],
        ['Hinweise zum Referenzdatum', indicator.referenceDateNote || '-'],
        ['Verfügbare Zeitreihen', datesString],
        [
          'Datum der letzten Aktualisierung',
          this.tsToDate_withOptionalUpdateInterval(this.dateToTS(indicator.metadata.lastUpdate)),
        ],
        ['Quellen / Literatur', indicator.metadata.literature || '-'],
      ],
      theme: 'grid',
      headStyles,
      bodyStyles,
      columnStyles,
      startY: doc.autoTable.previous.finalY + 10,
    });

    return doc;
  }

  async generateIndicatorMetadataPdf(
    indicatorMetadata: any,
    pdfName: string,
    availableSpatialUnits: any[],
    availableTopics: any[]
  ): Promise<any> {
    const doc = await this.createMetadataPDF_indicator(
      indicatorMetadata,
      availableSpatialUnits,
      availableTopics
    );
    doc.setProperties({
      title: 'KomMonitor Indikatorenblatt',
      subject: pdfName,
      author: 'KomMonitor',
      keywords: 'Indikator, Metadatenblatt',
      creator: 'KomMonitor',
    });
    return doc;
  }

  async generateIndicatorMetadataPdf_asBlob(
    indicatorMetadata: any,
    availableSpatialUnits: any[],
    availableTopics: any[]
  ): Promise<Blob> {
    const pdfName = indicatorMetadata.indicatorName + '.pdf';
    const doc = await this.generateIndicatorMetadataPdf(
      indicatorMetadata,
      pdfName,
      availableSpatialUnits,
      availableTopics
    );
    return doc.output('blob', { filename: pdfName });
  }

  async generateAndDownloadIndicatorZIP(
    indicatorData: any,
    fileName: string,
    fileEnding: string,
    jsZipOptions: any,
    selectedIndicator: any,
    availableSpatialUnits: any[],
    availableTopics: any[]
  ): Promise<void> {
    const metadataPdf = await this.generateIndicatorMetadataPdf_asBlob(
      selectedIndicator,
      availableSpatialUnits,
      availableTopics
    );
    const zip = new JSZip();
    zip.file(fileName + fileEnding, indicatorData, jsZipOptions);
    zip.file(fileName + '_Metadata.pdf', metadataPdf);
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, fileName + '.zip');
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private _getImageDimensions(file: any): Promise<{ w: number; h: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.width, h: img.height });
      img.src = file;
    });
  }

  private _buildTopicsString(topicReferenceId: any, availableTopics: any[]): string {
    const hierarchy = this.topicHierarchyService.getTopicHierarchyForTopicId(
      availableTopics,
      topicReferenceId
    );
    return hierarchy
      .map((topic: any, index: number) =>
        index === 0 ? topic.topicName : ' '.repeat(2 * index) + topic.topicName
      )
      .join('\n');
  }

  private _buildLinkedItemsString(items: any[], nameKey: string, descKey: string): string {
    if (!items || items.length === 0) return '-';
    return items.map((item: any) => `${item[nameKey]} - \n   ${item[descKey]}`).join('\n\n');
  }

  private _buildSpatialUnitsString(indicator: any, availableSpatialUnits: any[]): string {
    const matched: string[] = [];
    for (const spatialUnit of availableSpatialUnits) {
      for (const applicable of indicator.applicableSpatialUnits) {
        if (spatialUnit.spatialUnitLevel === applicable.spatialUnitName) {
          matched.push(applicable.spatialUnitName);
        }
      }
    }
    return matched.join('\n');
  }

  private _buildGeoresourceDatesString(periods: any[]): string {
    if (periods.length <= 10) {
      return periods
        .map((period: any) => {
          const start = this.tsToDate_withOptionalUpdateInterval(
            this.dateToTS(new Date(period.startDate))
          );
          const end = period.endDate
            ? ' - ' +
              this.tsToDate_withOptionalUpdateInterval(this.dateToTS(new Date(period.endDate)))
            : "- 'null' (demnach gültig bis auf weiteres)";
          return 'Zeitspanne: ' + start + end;
        })
        .join('\n');
    }

    let result = `insgesamt ${periods.length} Zeitspannen\n\n`;
    let earliest: Date | undefined;
    let latest: Date | null | undefined = undefined;

    for (const period of periods) {
      const startDate = new Date(period.startDate);
      if (!earliest || startDate < earliest) earliest = startDate;

      if (latest === undefined) {
        latest = period.endDate ? new Date(period.endDate) : null;
      } else if (latest && period.endDate && new Date(period.endDate) > latest) {
        latest = new Date(period.endDate);
      }
    }

    result +=
      'frühestes Startdatum: ' +
      this.tsToDate_withOptionalUpdateInterval(this.dateToTS(earliest)) +
      '\n';
    result += latest
      ? 'spätestes Enddatum: ' +
        this.tsToDate_withOptionalUpdateInterval(this.dateToTS(latest)) +
        '\n'
      : 'spätestes Enddatum: ohne explizites Enddatum (demnach gültig bis auf weiteres)\n';

    return result;
  }

  private _buildIndicatorDatesString(indicator: any): string {
    const dates: string[] = indicator.applicableDates;
    const interval = indicator.metadata.updateInterval;

    if (dates.length <= 20) {
      return dates
        .map((d: string) =>
          this.tsToDate_withOptionalUpdateInterval(this.dateToTS(new Date(d)), interval)
        )
        .join('    ');
    }

    let result = `Zeitreihe umfasst insgesamt ${dates.length} Zeitpunkte\n\n`;
    result +=
      'frühester Zeitpunkt: ' +
      this.tsToDate_withOptionalUpdateInterval(this.dateToTS(new Date(dates[0])), interval) +
      '\n';
    result +=
      'spätester Zeitpunkt: ' +
      this.tsToDate_withOptionalUpdateInterval(
        this.dateToTS(new Date(dates[dates.length - 1])),
        interval
      );
    return result;
  }
}
