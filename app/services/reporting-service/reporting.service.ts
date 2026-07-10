import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

export interface ReportingData {
  workflowState: WorkflowState;
  selectedTemplateId: number;
  sections: SectionData;
}

export interface SectionData {
  indicators: any[];
  georesources: any[];
}

export enum WorkflowState {
  workflowSelect,
  templateSelect,
  reportingOverview,
  indicatorConfig,
  formatSelect,
  reportGeneration,
}

export interface ConfigData {
  sectionControl: SectionConfig;
  headerFooterControl: HeaderFooterConfig;
  sectionContentControl: SectionContentConfig;
}

export interface SectionContentConfig {
  showMapLabels: boolean;
  baseMapSelect: any;
  showRankingChartPerArea: boolean;
  showRankingMeanLine: boolean;
  showLineChartPerArea: boolean;
  showFreeText: boolean;
  mapLegendBackgroundColor: string;
}

export interface HeaderFooterConfig {
  showTitle: boolean;
  showSubtitle: boolean;
  showLogo: boolean;
  showFooterCreationInfo: boolean;
  showPageNumber: boolean;
}

export interface SectionConfig {
  showOverviewSection_unclassified: boolean;
  showOverviewSection_classified: boolean;
  showBarchartOverview: boolean;
  showLinechartOverview: boolean;
  showBoxplotchartOverview: boolean;
  showOverviewSection_reachability: boolean;
  showAreaSpecific: boolean; // false by default, to improve loading times. Will be changed if selected specificAreas < x, or manually
  showDatatable: boolean;
}

export interface TemplateData {
  id: number;
  name: string;
  displayName: string;
  categoryId: number;
  orientation: string;
  pages: any[];
  echartsRegisteredMapNames?: any;
  absoluteLabelPositions?: any;
  isochronesRangeType?: any;
  isochronesRangeUnits?: any;
}

export interface ImportData {
  pages: any[];
  template: TemplateData;
  templateSections: SectionData[];
}

@Injectable({
  providedIn: 'root',
})
export class ReportingService {
  private envConfigService = inject(EnvConfigService);

  importConfig!: ImportData | undefined;
  workflowStateOptions = WorkflowState;

  reportingBackgroundState: {
    pageToProcess_add: any;
    pageToProcess_overview: any;
  } = {
    pageToProcess_add: undefined,
    pageToProcess_overview: undefined,
  };

  // drives the global "report is being prepared in the background" banner, shown
  // outside the reporting modal too so the user can keep using the app while it runs
  reportGenerationInProgress = false;
  reportStatus: 'preparing' | 'finished' = 'preparing';
  reportProgress = 0;
  reportCountdown = 0;
  reportingModalOpen = false;

  default: ReportingData = {
    workflowState: WorkflowState.workflowSelect,
    selectedTemplateId: 0,
    sections: {
      indicators: [],
      georesources: [],
    },
  };

  generalSettings = {
    creator: 'M. Mustermann',
    commune: 'Testkommune',
    communeLogo: '',
    creationDate: this.getCurrentDate(),
    freeText: 'Text',
  };

  config: ConfigData;

  availableTemplateCategories = [
    {
      id: 1,
      displayName: 'Zeitpunkt',
      collapsed: false,
    },
    {
      id: 2,
      displayName: 'Zeitserie',
      collapsed: true,
    },
    {
      id: 3,
      displayName: 'Erreichbarkeit',
      collapsed: true,
    },
  ];

  reportingDefaultTemplatePageElements = [
    {
      type: 'indicatorTitle-landscape',
      dimensions: {
        top: '15px',
        left: '15px',
        width: '720px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: 'Titel des Indikators [Einheit]',
      text: '',
      css: 'text-align: left; padding-left: 5px; font-weight: bold;',
    },
    {
      type: 'indicatorTitle-portrait',
      dimensions: {
        top: '15px',
        left: '15px',
        width: '470px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: 'Titel des Indikators [Einheit]',
      text: '',
      css: 'text-align: left; padding-left: 5px; font-weight: bold;',
    },
    {
      type: 'dataTimestamp-landscape',
      dimensions: {
        top: '50px',
        left: '15px',
        width: '720px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: 'Datenstand',
      text: '',
      css: 'text-align: left; padding-left: 5px;',
    },
    {
      type: 'dataTimestamp-portrait',
      dimensions: {
        top: '50px',
        left: '15px',
        width: '470px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: 'Datenstand',
      text: '',
      css: 'text-align: left; padding-left: 5px;',
    },
    {
      type: 'dataTimeseries-landscape',
      dimensions: {
        top: '50px',
        left: '15px',
        width: '720px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: 'Zeitreihe von - bis',
      text: '',
      css: 'text-align: left; padding-left: 5px;',
    },
    {
      type: 'dataTimeseries-portrait',
      dimensions: {
        top: '50px',
        left: '15px',
        width: '470px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: 'Zeitreihe von - bis',
      text: '',
      css: 'text-align: left; padding-left: 5px;',
    },
    {
      type: 'reachability-subtitle-landscape',
      dimensions: {
        top: '50px',
        left: '15px',
        width: '720px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: 'Aktueller Datenstand, Fortbewegungsmittel, [Indikator]',
      text: '',
      css: 'text-align: left; padding-left: 5px;',
    },
    {
      type: 'reachability-subtitle-portrait',
      dimensions: {
        top: '50px',
        left: '15px',
        width: '470px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: 'Aktueller Datenstand, Fortbewegungsmittel, [Indikator]',
      text: '',
      css: 'text-align: left; padding-left: 5px;',
    },
    {
      type: 'communeLogo-landscape',
      dimensions: {
        top: '15px',
        left: '740px',
        width: '75px',
        height: '65px',
      },
      isPlaceholder: true,
      placeholderText: 'Logo',
      src: '',
    },
    {
      type: 'communeLogo-portrait',
      dimensions: {
        top: '15px',
        left: '490px',
        width: '75px',
        height: '65px',
      },
      isPlaceholder: true,
      placeholderText: 'Logo',
      src: '',
    },
    {
      type: 'footerHorizontalSpacer-landscape',
      dimensions: {
        top: '535px',
        left: '15px',
        width: '800px',
        height: '0px',
      },
      css: 'border-top: solid rgb(148, 148, 148) 1px;',
    },
    {
      type: 'footerHorizontalSpacer-portrait',
      dimensions: {
        top: '750px',
        left: '15px',
        width: '550px',
        height: '0px',
      },
      css: 'border-top: solid rgb(148, 148, 148) 1px;',
    },

    {
      type: 'footerCreationInfo-landscape',
      dimensions: {
        top: '545px',
        left: '15px',
        width: '720px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: 'Erstellt am [Datum] von [Name d. Bearbeiters], [Name d. Kommune]',
      css: 'text-align: left; padding-left: 5px;',
    },
    {
      type: 'footerCreationInfo-portrait',
      dimensions: {
        top: '760px',
        left: '15px',
        width: '470px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: 'Erstellt am [Datum] von [Name d. Bearbeiters], [Name d. Kommune]',
      css: 'text-align: left; padding-left: 5px;',
    },
    {
      type: 'pageNumber-landscape',
      dimensions: {
        top: '545px',
        left: '740px',
        width: '75px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: '[Seitenzahl]',
      css: 'text-align: right; padding-right: 5px;',
    },
    {
      type: 'pageNumber-portrait',
      dimensions: {
        top: '760px',
        left: '490px',
        width: '75px',
        height: '30px',
      },
      isPlaceholder: true,
      placeholderText: '[Seitenzahl]',
      css: 'text-align: right; padding-right: 5px;',
    },
  ];

  // A basic version of the templates.
  // These are not full-fledged templates yet, but they can serve as a starting point and are adjusted according to user choices dynamically.
  availableTemplates: TemplateData[] = [
    {
      id: 0,
      name: 'A4-landscape-timestamp',
      displayName: 'DIN A4, Querformat',
      categoryId: 1,
      orientation: 'landscape',
      pages: [
        {
          type: 'map_overview_unclassified',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte ohne Klassifizierung.\
                Selektierte Bereiche farblich markiert.\
                Beschriftung: Quote/Anzahl pro Bereich.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion',
            },
          ],
        }, // l
        {
          type: 'map_overview_unclassified',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte ohne Klassifizierung.\
                Selektierte Bereiche farblich markiert.\
                Beschriftung: Quote/Anzahl pro Bereich.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion',
            },
          ],
        }, // p
        {
          type: 'map_overview_classified',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte klassifiziert.\
                Beschriftung: Quote/Anzahl pro Bereich.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion',
            },
            {
              type: 'mapLegend',
              dimensions: {
                top: '400px',
                left: '700px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
          ],
        }, // l
        {
          type: 'map_overview_classified',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte klassifiziert.\
                Beschriftung: Quote/Anzahl pro Bereich.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion',
            },
            {
              type: 'mapLegend',
              dimensions: {
                top: '600px',
                left: '450px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
          ],
        }, // p
        {
          type: 'barchart_overview',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'barchart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Säulendiagramm. Eine Säule pro selektiertem Bereich + Durchschnitt der Gesamtstadt',
            },
          ],
        }, // l
        {
          type: 'barchart_overview',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'barchart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Säulendiagramm. Eine Säule pro selektiertem Bereich + Durchschnitt der Gesamtstadt',
            },
          ],
        }, // p
        // one page for each selected area
        {
          type: 'area_specific',
          orientation: 'landscape',
          area: '', // the area shown on this page or an empty string if it is a placeholder page
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-landscape',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '720px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '400px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte.\
                Detailansicht des Bereichs.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
            },
            {
              type: 'barchart',
              dimensions: {
                top: '90px',
                left: '425px',
                width: '390px',
                height: '140px',
              },
              isPlaceholder: true,
              placeholderText:
                'Säulendiagramm. Vergleich des Bereichs mit dem Durchschnitt 1. aller selektierten Bereiche und 2. der Gesamtstadt.',
            },
            {
              type: 'textInput',
              dimensions: {
                top: '390px',
                left: '425px',
                width: '390px',
                height: '140px',
              },
              isPlaceholder: true,
              placeholderText: 'Freitext',
              css: 'align-self: self-start; margin-bottom: auto; text-align: left;',
            },
          ],
        }, // l
        {
          type: 'area_specific',
          orientation: 'portrait',
          area: '', // the area shown on this page or an empty string if it is a placeholder page
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-portrait',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '470px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '400px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte.\
                Detailansicht des Bereichs.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
            },
            {
              type: 'barchart',
              dimensions: {
                top: '500px',
                left: '15px',
                width: '550px',
                height: '160px',
              },
              isPlaceholder: true,
              placeholderText:
                'Säulendiagramm. Vergleich des Bereichs mit dem Durchschnitt 1. aller selektierten Bereiche und 2. der Gesamtstadt.',
            },
            {
              type: 'textInput',
              dimensions: {
                top: '670px',
                left: '15px',
                width: '550px',
                height: '70px',
              },
              isPlaceholder: true,
              placeholderText: 'Freitext',
              css: 'align-self: self-start; margin-bottom: auto; text-align: left;',
            },
          ],
        }, // p
        // end of area-specific part
        // datatable might need multiple pages
        {
          type: 'datatable',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'datatable',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '300px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Datentabelle (Spalten: Bereich, Wert).\
                Ggf. über mehrere Seiten.',
              columnNames: [],
              tableData: [],
            },
          ],
        }, //l
      ],
    },
    {
      id: 1,
      name: 'A4-portrait-timestamp',
      displayName: 'DIN A4, Hochformat',
      categoryId: 1,
      orientation: 'portrait',
      pages: [
        {
          type: 'map_overview_unclassified',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte ohne Klassifizierung.\
                Selektierte Bereiche farblich markiert.\
                Beschriftung: Quote/Anzahl pro Bereich.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion',
            },
          ],
        }, // p
        {
          type: 'map_overview_unclassified',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte ohne Klassifizierung.\
                Selektierte Bereiche farblich markiert.\
                Beschriftung: Quote/Anzahl pro Bereich.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion',
            },
          ],
        }, // l
        {
          type: 'map_overview_classified',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte klassifiziert.\
                Beschriftung: Quote/Anzahl pro Bereich.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion',
            },
            {
              type: 'mapLegend',
              dimensions: {
                top: '600px',
                left: '450px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
          ],
        }, // p
        {
          type: 'map_overview_classified',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte klassifiziert.\
                Beschriftung: Quote/Anzahl pro Bereich.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion',
            },
            {
              type: 'mapLegend',
              dimensions: {
                top: '400px',
                left: '700px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
          ],
        }, // l
        {
          type: 'barchart_overview',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'barchart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Säulendiagramm. Eine Säule pro selektiertem Bereich + Durchschnitt der Gesamtstadt',
            },
          ],
        }, // p
        {
          type: 'barchart_overview',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'barchart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Säulendiagramm. Eine Säule pro selektiertem Bereich + Durchschnitt der Gesamtstadt',
            },
          ],
        }, // l
        // one page for each selected area
        {
          type: 'area_specific',
          orientation: 'portrait',
          area: '', // the area shown on this page or an empty string if it is a placeholder page
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-portrait',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '470px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '400px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte.\
                Detailansicht des Bereichs.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
            },
            {
              type: 'barchart',
              dimensions: {
                top: '500px',
                left: '15px',
                width: '550px',
                height: '160px',
              },
              isPlaceholder: true,
              placeholderText:
                'Säulendiagramm. Vergleich des Bereichs mit dem Durchschnitt 1. aller selektierten Bereiche und 2. der Gesamtstadt.',
            },
            {
              type: 'textInput',
              dimensions: {
                top: '670px',
                left: '15px',
                width: '550px',
                height: '70px',
              },
              isPlaceholder: true,
              placeholderText: 'Freitext',
              css: 'align-self: self-start; margin-bottom: auto; text-align: left;',
            },
          ],
        }, // p
        {
          type: 'area_specific',
          orientation: 'landscape',
          area: '', // the area shown on this page or an empty string if it is a placeholder page
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-landscape',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '720px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '400px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte.\
                Detailansicht des Bereichs.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
            },
            {
              type: 'barchart',
              dimensions: {
                top: '90px',
                left: '425px',
                width: '390px',
                height: '140px',
              },
              isPlaceholder: true,
              placeholderText:
                'Säulendiagramm. Vergleich des Bereichs mit dem Durchschnitt 1. aller selektierten Bereiche und 2. der Gesamtstadt.',
            },
            {
              type: 'textInput',
              dimensions: {
                top: '390px',
                left: '425px',
                width: '390px',
                height: '140px',
              },
              isPlaceholder: true,
              placeholderText: 'Freitext',
              css: 'align-self: self-start; margin-bottom: auto; text-align: left;',
            },
          ],
        }, // l
        // end of area-specific part
        // datatable might need multiple pages
        {
          type: 'datatable',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'datatable',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '300px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Datentabelle (Spalten: Bereich, Wert).\
                Ggf. über mehrere Seiten.',
              columnNames: [],
              tableData: [],
            },
          ],
        }, // p
      ],
    },
    {
      id: 2,
      name: 'A4-landscape-timeseries',
      displayName: 'DIN A4, Querformat',
      categoryId: 2,
      orientation: 'landscape',
      pages: [
        {
          type: 'map_overview_unclassified',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte ohne Klassifizierung.\
                Selektierte Bereiche farblich markiert.\
                Beschriftung: Quote/Anzahl pro Bereich (aktuellster Wert).\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt (aktuellster Wert)',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion (aktuellster Wert)',
            },
          ],
        }, // l
        {
          type: 'map_overview_unclassified',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte ohne Klassifizierung.\
                Selektierte Bereiche farblich markiert.\
                Beschriftung: Quote/Anzahl pro Bereich (aktuellster Wert).\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt (aktuellster Wert)',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion (aktuellster Wert)',
            },
          ],
        }, // p
        {
          type: 'map_overview_classified',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte, klassifiziert.\
                Veränderung ältester Wert --> aktuellster Wert.\
                Beschriftung: Veränderung in Einheit des Indikators.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
              isTimeseries: true,
            },
            {
              type: 'overallChange',
              dimensions: {
                top: '100px',
                left: '670px',
                width: '130px',
                height: '80px',
              },
              isPlaceholder: true,
              placeholderText: 'Veränderung Gesamtstadt',
            },
            {
              type: 'selectionChange',
              dimensions: {
                top: '200px',
                left: '670px',
                width: '130px',
                height: '80px',
              },
              isPlaceholder: true,
              placeholderText: 'Veränderung Selektion',
            },
            {
              type: 'mapLegend',
              dimensions: {
                top: '400px',
                left: '700px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
          ],
        }, // l
        {
          type: 'map_overview_classified',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte, klassifiziert.\
                Veränderung ältester Wert --> aktuellster Wert.\
                Beschriftung: Veränderung in Einheit des Indikators.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
              isTimeseries: true,
            },
            {
              type: 'overallChange',
              dimensions: {
                top: '100px',
                left: '420px',
                width: '130px',
                height: '80px',
              },
              isPlaceholder: true,
              placeholderText: 'Veränderung Gesamtstadt',
            },
            {
              type: 'selectionChange',
              dimensions: {
                top: '200px',
                left: '420px',
                width: '130px',
                height: '80px',
              },
              isPlaceholder: true,
              placeholderText: 'Veränderung Selektion',
            },
            {
              type: 'mapLegend',
              dimensions: {
                top: '600px',
                left: '450px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
          ],
        }, // p
        {
          type: 'linechart_overview',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'linechart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Eine Linie pro ausgewähltem Bereich + Durchschnitt Gesamtstadt.',
              showAverage: true,
              showAreas: true,
              showBoxplots: false,
            },
          ],
        }, // l
        {
          type: 'linechart_overview',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'linechart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Eine Linie pro ausgewähltem Bereich + Durchschnitt Gesamtstadt.',
              showAverage: true,
              showAreas: true,
              showBoxplots: false,
            },
          ],
        }, // p
        {
          type: 'boxplot_overview',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              // with boxplot at each data point
              type: 'linechart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Durchschnitt Gesamtstadt + Boxplot pro Zeitpunkt',
              showAverage: true,
              showAreas: false,
              showBoxplots: true,
            },
          ],
        }, // l
        {
          type: 'boxplot_overview',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              // with boxplot at each data point
              type: 'linechart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Durchschnitt Gesamtstadt + Boxplot pro Zeitpunkt',
              showAverage: true,
              showAreas: false,
              showBoxplots: true,
            },
          ],
        }, // p
        // one page for each selected area
        {
          type: 'area_specific',
          orientation: 'landscape',
          area: '',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-landscape',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '720px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '400px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte.\
                Detailansicht des Bereichs.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
              isTimeseries: true,
            },
            {
              type: 'linechart',
              dimensions: {
                top: '90px',
                left: '425px',
                width: '390px',
                height: '140px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Vergleich des Bereichs mit dem Durchschnitt der Gesamtstadt.',
              showAverage: true,
              showAreas: true,
              showBoxplots: false,
            },
            {
              type: 'linechart',
              dimensions: {
                top: '240px',
                left: '425px',
                width: '390px',
                height: '140px',
              },
              isPlaceholder: true,
              placeholderText: 'Liniendiagramm. Veränderung zum Vorjahr in Prozent',
              showAverage: true,
              showAreas: true,
              showPercentageChangeToPrevTimestamp: true,
            },
            {
              type: 'textInput',
              dimensions: {
                top: '390px',
                left: '425px',
                width: '390px',
                height: '140px',
              },
              isPlaceholder: true,
              placeholderText: 'Freitext',
              css: 'align-self: self-start; margin-bottom: auto; text-align: left;',
            },
          ],
        }, // l
        {
          type: 'area_specific',
          orientation: 'portrait',
          area: '',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-portrait',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '470px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '400px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte.\
                Detailansicht des Bereichs.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
              isTimeseries: true,
            },
            {
              type: 'linechart',
              dimensions: {
                top: '500px',
                left: '15px',
                width: '270px',
                height: '160px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Vergleich des Bereichs mit dem Durchschnitt der Gesamtstadt.',
              showAverage: true,
              showAreas: true,
              showBoxplots: false,
            },
            {
              type: 'linechart',
              dimensions: {
                top: '500px',
                left: '295px',
                width: '270px',
                height: '160px',
              },
              isPlaceholder: true,
              placeholderText: 'Liniendiagramm. Veränderung zum Vorjahr in Prozent',
              showAverage: true,
              showAreas: true,
              showPercentageChangeToPrevTimestamp: true,
            },
            {
              type: 'textInput',
              dimensions: {
                top: '670px',
                left: '15px',
                width: '550px',
                height: '70px',
              },
              isPlaceholder: true,
              placeholderText: 'Freitext',
              css: 'align-self: self-start; margin-bottom: auto; text-align: left;',
            },
          ],
        }, // p
        // end of area-specific part
        // datatable might need multiple pages
        {
          type: 'datatable',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              // should include data for different timestamps
              type: 'datatable',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '300px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Datentabelle (Spalten: Bereich, Zeitpunkt, Wert).\
                Ggf. über mehrere Seiten.',
              columnNames: [],
              tableData: [],
            },
          ],
        }, // l
      ],
    },
    {
      id: 3,
      name: 'A4-portrait-timeseries',
      displayName: 'DIN A4, Hochformat',
      categoryId: 2,
      orientation: 'portrait',
      pages: [
        {
          type: 'map_overview_unclassified',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte ohne Klassifizierung.\
                Selektierte Bereiche farblich markiert.\
                Beschriftung: Quote/Anzahl pro Bereich (aktuellster Wert).\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt (aktuellster Wert)',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '450px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion (aktuellster Wert)',
            },
          ],
        }, // p
        {
          type: 'map_overview_unclassified',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimestamp-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte ohne Klassifizierung.\
                Selektierte Bereiche farblich markiert.\
                Beschriftung: Quote/Anzahl pro Bereich (aktuellster Wert).\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'overallAverage',
              dimensions: {
                top: '100px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Gesamtstadt (aktuellster Wert)',
            },
            {
              type: 'selectionAverage',
              dimensions: {
                top: '180px',
                left: '700px',
                width: '100px',
                height: '60px',
              },
              isPlaceholder: true,
              placeholderText: 'Durchschnitt Selektion (aktuellster Wert)',
            },
          ],
        }, // l
        {
          type: 'map_overview_classified',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte, klassifiziert.\
                Veränderung ältester Wert --> aktuellster Wert.\
                Beschriftung: Veränderung in Einheit des Indikators.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
              isTimeseries: true,
            },
            {
              type: 'overallChange',
              dimensions: {
                top: '100px',
                left: '420px',
                width: '130px',
                height: '80px',
              },
              isPlaceholder: true,
              placeholderText: 'Veränderung Gesamtstadt',
            },
            {
              type: 'selectionChange',
              dimensions: {
                top: '200px',
                left: '420px',
                width: '130px',
                height: '80px',
              },
              isPlaceholder: true,
              placeholderText: 'Veränderung Selektion',
            },
            {
              type: 'mapLegend',
              dimensions: {
                top: '600px',
                left: '450px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
          ],
        }, // p
        {
          type: 'map_overview_classified',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Übersichtskarte, klassifiziert.\
                Veränderung ältester Wert --> aktuellster Wert.\
                Beschriftung: Veränderung in Einheit des Indikators.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
              isTimeseries: true,
            },
            {
              type: 'overallChange',
              dimensions: {
                top: '100px',
                left: '670px',
                width: '130px',
                height: '80px',
              },
              isPlaceholder: true,
              placeholderText: 'Veränderung Gesamtstadt',
            },
            {
              type: 'selectionChange',
              dimensions: {
                top: '200px',
                left: '670px',
                width: '130px',
                height: '80px',
              },
              isPlaceholder: true,
              placeholderText: 'Veränderung Selektion',
            },
            {
              type: 'mapLegend',
              dimensions: {
                top: '400px',
                left: '700px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
          ],
        }, // l
        {
          type: 'linechart_overview',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'linechart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Eine Linie pro ausgewähltem Bereich + Durchschnitt Gesamtstadt.',
              showAverage: true,
              showAreas: true,
              showBoxplots: false,
            },
          ],
        }, // p
        {
          type: 'linechart_overview',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'linechart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Eine Linie pro ausgewähltem Bereich + Durchschnitt Gesamtstadt.',
              showAverage: true,
              showAreas: true,
              showBoxplots: false,
            },
          ],
        }, // l
        {
          type: 'boxplot_overview',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              // with boxplot at each data point
              type: 'linechart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Durchschnitt Gesamtstadt + Boxplot pro Zeitpunkt',
              showAverage: true,
              showAreas: false,
              showBoxplots: true,
            },
          ],
        }, // p
        {
          type: 'boxplot_overview',
          orientation: 'landscape',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-landscape'),
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              // with boxplot at each data point
              type: 'linechart',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Durchschnitt Gesamtstadt + Boxplot pro Zeitpunkt',
              showAverage: true,
              showAreas: false,
              showBoxplots: true,
            },
          ],
        }, // l
        // one page for each selected area
        {
          type: 'area_specific',
          orientation: 'portrait',
          area: '',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-portrait',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '470px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '400px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte.\
                Detailansicht des Bereichs.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
              isTimeseries: true,
            },
            {
              type: 'linechart',
              dimensions: {
                top: '500px',
                left: '15px',
                width: '270px',
                height: '160px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Vergleich des Bereichs mit dem Durchschnitt der Gesamtstadt.',
              showAverage: true,
              showAreas: true,
              showBoxplots: false,
            },
            {
              type: 'linechart',
              dimensions: {
                top: '500px',
                left: '295px',
                width: '270px',
                height: '160px',
              },
              isPlaceholder: true,
              placeholderText: 'Liniendiagramm. Veränderung zum Vorjahr in Prozent',
              showAverage: true,
              showAreas: true,
              showPercentageChangeToPrevTimestamp: true,
            },
            {
              type: 'textInput',
              dimensions: {
                top: '670px',
                left: '15px',
                width: '550px',
                height: '70px',
              },
              isPlaceholder: true,
              placeholderText: 'Freitext',
              css: 'align-self: self-start; margin-bottom: auto; text-align: left;',
            },
          ],
        }, // p
        {
          type: 'area_specific',
          orientation: 'landscape',
          area: '',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-landscape',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '720px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '400px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte.\
                Detailansicht des Bereichs.\
                Keine Hintergrundkarte.',
              colorScheme: undefined,
              classify: true,
              isTimeseries: true,
            },
            {
              type: 'linechart',
              dimensions: {
                top: '90px',
                left: '425px',
                width: '390px',
                height: '140px',
              },
              isPlaceholder: true,
              placeholderText:
                'Zeitreihendiagramm. Vergleich des Bereichs mit dem Durchschnitt der Gesamtstadt.',
              showAverage: true,
              showAreas: true,
              showBoxplots: false,
            },
            {
              type: 'linechart',
              dimensions: {
                top: '240px',
                left: '425px',
                width: '390px',
                height: '140px',
              },
              isPlaceholder: true,
              placeholderText: 'Liniendiagramm. Veränderung zum Vorjahr in Prozent',
              showAverage: true,
              showAreas: true,
              showPercentageChangeToPrevTimestamp: true,
            },
            {
              type: 'textInput',
              dimensions: {
                top: '390px',
                left: '425px',
                width: '390px',
                height: '140px',
              },
              isPlaceholder: true,
              placeholderText: 'Freitext',
              css: 'align-self: self-start; margin-bottom: auto; text-align: left;',
            },
          ],
        }, // l
        // end of area-specific part
        // datatable might need multiple pages
        {
          type: 'datatable',
          orientation: 'portrait',
          pageElements: [
            this.getDefaultReportingTemplatePageElement('indicatorTitle-portrait'),
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('dataTimeseries-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              // should include data for different timestamps
              type: 'datatable',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '300px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Datentabelle (Spalten: Bereich, Zeitpunkt, Wert).\
                Ggf. über mehrere Seiten.',
              columnNames: [],
              tableData: [],
            },
          ],
        }, // p
      ],
    },
    {
      id: 4,
      name: 'A4-landscape-reachability',
      displayName: 'DIN A4, Querformat',
      categoryId: 3,
      orientation: 'landscape',
      pages: [
        {
          type: 'map_overview_reachability',
          orientation: 'landscape',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-landscape',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '720px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText: 'Entfernungen für [Name POI]',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('reachability-subtitle-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              // isochrones, only show main roads if possible
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte Gesamtstadt mit Isochronen, Grenzen der gewählten Bereiche farblich hervorgehoben. Kartenhintergrund: nur Hauptstraßen.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'mapLegend',
              dimensions: {
                // used for the placeholder only
                top: '400px',
                left: '700px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
            {
              type: 'mapAttribution',
              dimensions: {
                // used for the placeholder only
                top: '495px',
                left: '25px',
                width: '125px',
                height: '25px',
              },
              isPlaceholder: true,
              placeholderText: 'Copyrightvermerk',
            },
          ],
        }, // l
        {
          type: 'map_overview_reachability',
          orientation: 'portrait',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-portrait',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '470px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText: 'Entfernungen für [Name POI]',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('reachability-subtitle-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              // isochrones, only show main roads if possible
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte Gesamtstadt mit Isochronen, Grenzen der gewählten Bereiche farblich hervorgehoben. Kartenhintergrund: nur Hauptstraßen.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'mapLegend',
              dimensions: {
                // used for the placeholder only
                top: '600px',
                left: '450px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
            {
              type: 'mapAttribution',
              dimensions: {
                // used for the placeholder only
                top: '700px',
                left: '25px',
                width: '125px',
                height: '25px',
              },
              isPlaceholder: true,
              placeholderText: 'Copyrightvermerk',
            },
          ],
        }, // p
        // one page for each selected area
        {
          type: 'area_specific',
          orientation: 'landscape',
          area: '',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-landscape',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '720px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Entfernungen für [Name POI], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('reachability-subtitle-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              // isochrones, background map in grayscale
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte Detailansicht Bereich mit Isochronen, Hintergrund OSM-Karte in Graustufen',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'mapLegend',
              dimensions: {
                // used for the placeholder only
                top: '400px',
                left: '700px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
            {
              type: 'mapAttribution',
              dimensions: {
                // used for the placeholder only
                top: '495px',
                left: '25px',
                width: '125px',
                height: '25px',
              },
              isPlaceholder: true,
              placeholderText: 'Copyrightvermerk',
            },
          ],
        }, // l
        {
          type: 'area_specific',
          orientation: 'portrait',
          area: '',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-portrait',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '470px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Entfernungen für [Name POI], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('reachability-subtitle-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              // isochrones, background map in grayscale
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte Detailansicht Bereich mit Isochronen, Hintergrund OSM-Karte in Graustufen',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'mapLegend',
              dimensions: {
                // used for the placeholder only
                top: '600px',
                left: '450px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
            {
              type: 'mapAttribution',
              dimensions: {
                // used for the placeholder only
                top: '700px',
                left: '25px',
                width: '125px',
                height: '25px',
              },
              isPlaceholder: true,
              placeholderText: 'Copyrightvermerk',
            },
          ],
        }, // p
        // end of area-specific part
      ],
    },
    {
      id: 5,
      name: 'A4-portrait-reachability',
      displayName: 'DIN A4, Hochformat',
      categoryId: 3,
      orientation: 'portrait',
      pages: [
        {
          type: 'map_overview_reachability',
          orientation: 'portrait',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-portrait',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '470px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText: 'Entfernungen für [Name POI]',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('reachability-subtitle-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              // isochrones, only show main roads if possible
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte Gesamtstadt mit Isochronen, Grenzen der gewählten Bereiche farblich hervorgehoben. Kartenhintergrund: nur Hauptstraßen.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'mapLegend',
              dimensions: {
                // used for the placeholder only
                top: '600px',
                left: '450px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
            {
              type: 'mapAttribution',
              dimensions: {
                // used for the placeholder only
                top: '700px',
                left: '25px',
                width: '125px',
                height: '25px',
              },
              isPlaceholder: true,
              placeholderText: 'Copyrightvermerk',
            },
          ],
        }, // p
        {
          type: 'map_overview_reachability',
          orientation: 'landscape',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-landscape',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '720px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText: 'Entfernungen für [Name POI]',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('reachability-subtitle-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              // isochrones, only show main roads if possible
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte Gesamtstadt mit Isochronen, Grenzen der gewählten Bereiche farblich hervorgehoben. Kartenhintergrund: nur Hauptstraßen.',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'mapLegend',
              dimensions: {
                // used for the placeholder only
                top: '400px',
                left: '700px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
            {
              type: 'mapAttribution',
              dimensions: {
                // used for the placeholder only
                top: '495px',
                left: '25px',
                width: '125px',
                height: '25px',
              },
              isPlaceholder: true,
              placeholderText: 'Copyrightvermerk',
            },
          ],
        }, // l
        // one page for each selected area
        {
          type: 'area_specific',
          orientation: 'portrait',
          area: '',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-portrait',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '470px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Entfernungen für [Name POI], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-portrait'),
            this.getDefaultReportingTemplatePageElement('reachability-subtitle-portrait'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-portrait'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-portrait'),
            this.getDefaultReportingTemplatePageElement('pageNumber-portrait'),

            {
              // isochrones, background map in grayscale
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '550px',
                height: '650px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte Detailansicht Bereich mit Isochronen, Hintergrund OSM-Karte in Graustufen',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'mapLegend',
              dimensions: {
                // used for the placeholder only
                top: '600px',
                left: '450px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
            {
              type: 'mapAttribution',
              dimensions: {
                // used for the placeholder only
                top: '700px',
                left: '25px',
                width: '125px',
                height: '25px',
              },
              isPlaceholder: true,
              placeholderText: 'Copyrightvermerk',
            },
          ],
        }, // p
        {
          type: 'area_specific',
          orientation: 'landscape',
          area: '',
          pageElements: [
            // different placeholder so we don't use the default here
            {
              type: 'indicatorTitle-landscape',
              dimensions: {
                top: '15px',
                left: '15px',
                width: '720px',
                height: '30px',
              },
              isPlaceholder: true,
              placeholderText:
                'Entfernungen für [Name POI], Bereich (Diese Seite wird für jeden Bereich wiederholt)',
              text: '',
              css: 'text-align: left; padding-left: 5px; font-weight: bold;',
            },
            this.getDefaultReportingTemplatePageElement('communeLogo-landscape'),
            this.getDefaultReportingTemplatePageElement('reachability-subtitle-landscape'),
            this.getDefaultReportingTemplatePageElement('footerHorizontalSpacer-landscape'),
            this.getDefaultReportingTemplatePageElement('footerCreationInfo-landscape'),
            this.getDefaultReportingTemplatePageElement('pageNumber-landscape'),

            {
              // isochrones, background map in grayscale
              type: 'map',
              dimensions: {
                top: '90px',
                left: '15px',
                width: '800px',
                height: '440px',
              },
              isPlaceholder: true,
              placeholderText:
                'Karte Detailansicht Bereich mit Isochronen, Hintergrund OSM-Karte in Graustufen',
              colorScheme: undefined,
              classify: false,
            },
            {
              type: 'mapLegend',
              dimensions: {
                // used for the placeholder only
                top: '400px',
                left: '700px',
                width: '100px',
                height: '120px',
              },
              isPlaceholder: true,
              placeholderText: 'Legende',
            },
            {
              type: 'mapAttribution',
              dimensions: {
                // used for the placeholder only
                top: '495px',
                left: '25px',
                width: '125px',
                height: '25px',
              },
              isPlaceholder: true,
              placeholderText: 'Copyrightvermerk',
            },
          ],
        }, // l
        // end of area-specific part
      ],
    },
  ];

  // THE actual template working on
  selectedTemplate!: any;

  // temp version of selected template, for indicator/poi preview while selecting
  tempTemplate!: any;

  private _reportingData$ = new BehaviorSubject<ReportingData>(this.default);

  // nach außen NUR Observable
  reportingData$: Observable<ReportingData> = this._reportingData$.asObservable();

  constructor() {
    this.config = {
      sectionContentControl: {
        baseMapSelect: {
          layerConfig: {
            name: 'leere Karte',
            url: '',
            layerType: 'TILE_LAYER',
            layerName_WMS: '',
            attribution_html: '',
            minZoomLevel: this.envConfigService.minZoomLevel,
            maxZoomLevel: this.envConfigService.maxZoomLevel,
          },
        },
        mapLegendBackgroundColor: 'rgba(255, 255, 255, 0.75)',
        showMapLabels: true,
        showRankingChartPerArea: true,
        showLineChartPerArea: true,
        showFreeText: true,
        showRankingMeanLine: true,
      },
      headerFooterControl: {
        showTitle: true,
        showSubtitle: true,
        showLogo: true,
        showFooterCreationInfo: true,
        showPageNumber: true,
      },
      sectionControl: {
        showOverviewSection_unclassified: true,
        showOverviewSection_classified: true,
        showBarchartOverview: true,
        showLinechartOverview: true,
        showBoxplotchartOverview: true,
        showAreaSpecific: true,
        showOverviewSection_reachability: true,
        showDatatable: true,
      },
    };

    for (const template of this.availableTemplates) {
      this.iteratePageElements(template, function (page, pageElement) {
        pageElement.isPlaceholder =
          pageElement.type.includes('footerCreationInfo-') ||
          pageElement.type.includes('pageNumber-') ||
          pageElement.type === 'textInput'
            ? false
            : true;
      });
    }

    for (const template of this.availableTemplates) {
      for (const page of template.pages) {
        for (const el of page.pageElements) {
          el.isPlaceholder =
            el.type.includes('footerCreationInfo-') ||
            el.type.includes('pageNumber-') ||
            el.type === 'textInput'
              ? false
              : true;
        }
      }
    }

    this.changeSelectedTemplate(this.default.selectedTemplateId);
  }

  triggerConfigImport(config: ImportData) {
    this.importConfig = config;
    this.changeWorkflowState(this.workflowStateOptions.reportingOverview);
  }

  configImportExists(): boolean {
    if (this.importConfig) return true;

    return false;
  }

  bakeInCustomInfo() {
    // update selected template with general settings
    for (const [idx, page] of this.selectedTemplate.pages.entries()) {
      for (const el of page.pageElements) {
        if (el.type.includes('footerCreationInfo-')) {
          el.text =
            'Erstellt am ' +
            this.generalSettings.creationDate +
            ' von ' +
            this.generalSettings.creator +
            ', ' +
            this.generalSettings.commune;
        }
        if (el.type === 'textInput') {
          el.text = this.generalSettings.freeText;
        }

        // page number is generated by html expression, but we update if anyway for consistency
        if (el.type.includes('pageNumber-')) {
          el.placeholderText = 'Seite ' + this.getPageNumber(idx);
        }
      }
    }
  }

  setTemplateSectionsFromConfig(config: ImportData) {
    this._reportingData$.value.sections.indicators = config.templateSections; // todo, split into geo and indi
  }

  bakeInCustomInfoToClone() {
    // update selected template with general settings
    for (const [idx, page] of this.clonedTemplate.pages.entries()) {
      for (const el of page.pageElements) {
        if (el.type.includes('footerCreationInfo-')) {
          el.text =
            'Erstellt am ' +
            this.generalSettings.creationDate +
            ' von ' +
            this.generalSettings.creator +
            ', ' +
            this.generalSettings.commune;
        }
        if (el.type === 'textInput') {
          el.text = this.generalSettings.freeText;
        }

        // page number is generated by html expression, but we update if anyway for consistency
        if (el.type.includes('pageNumber-')) {
          el.placeholderText = 'Seite ' + this.getPageNumber(idx);
        }
      }
    }
  }

  getSectionsAsArray(): any[] {
    return [
      ...this._reportingData$.value.sections.georesources,
      ...this._reportingData$.value.sections.indicators,
    ];
  }

  bakeInCustomInfoToClonePage(page, index) {
    for (const el of page.pageElements) {
      if (el.type.includes('footerCreationInfo-')) {
        el.text =
          'Erstellt am ' +
          this.generalSettings.creationDate +
          ' von ' +
          this.generalSettings.creator +
          ', ' +
          this.generalSettings.commune;
      }
      if (el.type === 'textInput') {
        el.text = this.generalSettings.freeText;
      }

      // page number is generated by html expression, but we update if anyway for consistency
      if (el.type.includes('pageNumber-')) {
        el.placeholderText = 'Seite ' + (index + 1);
      }
    }

    return page;
  }

  getPageNumber(index) {
    let pageNumber = 1;
    for (let i = 0; i < index; i++) {
      if (this.showThisPage(this.selectedTemplate.pages[i])) {
        pageNumber++;
      }
    }
    return pageNumber;
  }

  showThisPage(page) {
    let pageWillBeShown = false;
    for (const visiblePage of this.filterPagesToShow()) {
      if (visiblePage == page) {
        pageWillBeShown = true;
      }
    }
    return pageWillBeShown;
  }

  filterPagesToShow() {
    const pagesToShow: any[] = [];
    let skipNextPage = false;
    for (let i = 0; i < this.selectedTemplate.pages.length; i++) {
      const page = this.selectedTemplate.pages[i];
      if (this.pageContainsDatatable(i)) {
        pagesToShow.push(page);
        skipNextPage = false;
      } else {
        if (skipNextPage == false) {
          pagesToShow.push(page);
          skipNextPage = true;
        } else {
          skipNextPage = false;
        }
      }
    }
    return pagesToShow;
  }

  pageContainsDatatable(pageID) {
    const page = this.selectedTemplate.pages[pageID];
    let pageContainsDatatable = false;
    for (const pageElement of page.pageElements) {
      if (pageElement.type == 'datatable') {
        pageContainsDatatable = true;
      }
    }
    return pageContainsDatatable;
  }

  iteratePageElements(template, functionToExecute) {
    for (const page of template.pages) {
      for (const pageElement of page.pageElements) {
        functionToExecute(page, pageElement);
      }
    }
  }

  /**
   * reads a file chosen by the user
   * @returns {string} file content
   */
  readSingleFile(e) {
    const srcElement = e.srcElement;
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content: any = reader.result as string;

      // NICHT MEHR NOTWENDIG?!
      // if content is SVG base64 string then convert that to png image
      // as svg is porblemativ when perfirming PDF export later with jsPDF
      /*  if(content.includes("svg")){
        content = this.base64SvgToBase64Png(content, 250);
      } */

      if (srcElement.id === 'reporting-load-commune-logo-button') {
        this.generalSettings.communeLogo = content;
        // set isPlaceholder to false
        for (const template of this.availableTemplates) {
          this.iteratePageElements(template, function (page, pageElement) {
            if (pageElement.type.includes('communeLogo-')) {
              pageElement.isPlaceholder = false;
              pageElement.src = content;
            }
          });
        }
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * converts a base64 encoded data url SVG image to a PNG image
   * @param originalBase64 data url of svg image
   * @param width target width in pixel of PNG image
   * @return {Promise<String>} resolves to png data url of the image
   */
  async base64SvgToBase64Png(originalBase64, width) {
    return await new Promise((resolve) => {
      const img: any = document.createElement('img');
      img.onload = () => {
        document.body.appendChild(img);
        const canvas = document.createElement('canvas');
        const ratio = img.clientWidth / img.clientHeight || 1;
        document.body.removeChild(img);
        canvas.width = width;
        canvas.height = width / ratio;
        const ctx: any = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          const data = canvas.toDataURL('image/png');
          resolve(data);
        } catch {
          resolve(null);
        }
      };
      img.src = originalBase64;
    });
  }

  setValue(val: ReportingData) {
    this._reportingData$.next(val);
  }

  changeWorkflowState(state: WorkflowState) {
    this.setValue({ ...this._reportingData$.value, workflowState: state });
  }

  changeSelectedTemplate(templateId: number) {
    this.setValue({ ...this._reportingData$.value, selectedTemplateId: templateId });
    this.selectedTemplate = structuredClone(
      this.availableTemplates[this._reportingData$.value.selectedTemplateId]
    );
  }

  resetAll() {
    this.setValue({
      ...this._reportingData$.value,
      selectedTemplateId: 0,
      sections: {
        indicators: [],
        georesources: [],
      },
    });

    this.resetTemplateClone();
    this.importConfig = undefined;
  }

  resetTemplateClone() {
    this.tempTemplate = structuredClone(
      this.availableTemplates[this._reportingData$.value.selectedTemplateId]
    );

    this.bakeInCustomInfoToClone();
  }

  get currentValue(): ReportingData {
    return this._reportingData$.value;
  }

  get currentWorkflowState(): WorkflowState {
    return this._reportingData$.value.workflowState;
  }

  get workingTemplate(): any {
    return this.selectedTemplate;
  }

  get clonedTemplate(): any {
    return this.tempTemplate;
  }

  get templateSections(): SectionData {
    return this._reportingData$.value.sections;
  }

  getTemplatePagesForReinsert() {
    return structuredClone(this.selectedTemplate.pages);
  }

  getAreaSpecificPageClone(pageIndex: number): any {
    let page = structuredClone(
      this.availableTemplates[this._reportingData$.value.selectedTemplateId].pages[pageIndex]
    );
    page = this.bakeInCustomInfoToClonePage(page, pageIndex);
    return page;
  }

  getDatatablePageClone(): any {
    let page = structuredClone(
      this.availableTemplates[this._reportingData$.value.selectedTemplateId].pages.at(-1)
    );
    page = this.bakeInCustomInfoToClonePage(page, 0);
    return page;
  }

  // Format: YYYY-MM-DD
  getCurrentDate() {
    let now = new Date();
    const offset = now.getTimezoneOffset();
    now = new Date(now.getTime() - offset * 60 * 1000);
    return now.toISOString().split('T')[0];
  }

  getDefaultReportingTemplatePageElement(type) {
    const result = this.reportingDefaultTemplatePageElements.filter((el) => {
      return el.type === type;
    });
    if (typeof result === 'undefined') {
      throw 'No DefaultReportingTemplatePageElement exists for type ' + type + '.';
    } else {
      return result[0];
    }
  }

  addIndicatorSection(indicatorData) {
    this._reportingData$.value.sections.indicators.push(indicatorData);

    // remove placeholder pages if exist
    this.selectedTemplate.pages = this.selectedTemplate.pages.filter((page) => {
      if (Object.prototype.hasOwnProperty.call(page, 'templateSection')) {
        return Object.prototype.hasOwnProperty.call(page.templateSection, 'indicatorName');
      } else {
        return false;
      }
    });

    // append new section to array
    this.selectedTemplate.pages.push(...this.clonedTemplate.pages);
  }

  addPoiSection(geoData) {
    this._reportingData$.value.sections.georesources.push(geoData);

    // remove placeholder pages if exist
    this.selectedTemplate.pages = this.selectedTemplate.pages.filter((page) => {
      if (Object.prototype.hasOwnProperty.call(page, 'templateSection')) {
        return Object.prototype.hasOwnProperty.call(page.templateSection, 'poiLayerName');
      } else {
        return false;
      }
    });

    // append new section to array
    this.selectedTemplate.pages.push(...this.clonedTemplate.pages);

    console.log(this.selectedTemplate.pages);
  }

  removeGeoresourcesSection(georesourceId) {
    // remove from sections
    const newSectionVal: SectionData = {
      indicators: this._reportingData$.value.sections.indicators,
      georesources: this._reportingData$.value.sections.georesources.filter(
        (e) => e.georesourceId != georesourceId
      ),
    };

    this.setValue({ ...this._reportingData$.value, sections: newSectionVal });

    // remove from template
    this.selectedTemplate.pages = this.selectedTemplate.pages.filter(
      (e) => e.templateSection.georesourceId != georesourceId
    );

    if (this.selectedTemplate.pages.length == 0) this.resetSelectedTemplate();
  }

  removeIndicatorSection(indicatorId) {
    // remove from sections
    const newSectionVal: SectionData = {
      indicators: this._reportingData$.value.sections.indicators.filter(
        (e) => e.indicatorId != indicatorId
      ),
      georesources: this._reportingData$.value.sections.georesources,
    };

    this.setValue({ ...this._reportingData$.value, sections: newSectionVal });

    // remove from template
    this.selectedTemplate.pages = this.selectedTemplate.pages.filter(
      (e) => e.templateSection.indicatorId != indicatorId
    );

    if (this.selectedTemplate.pages.length == 0) this.resetSelectedTemplate();
  }

  resetSelectedTemplate() {
    this.selectedTemplate = structuredClone(
      this.availableTemplates[this._reportingData$.value.selectedTemplateId]
    );
    this.bakeInCustomInfo();
  }
}
