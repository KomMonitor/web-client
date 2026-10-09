import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import {
  availableTemplateCategories,
  availableTemplates,
} from 'services/reporting-service/report-templates.data';

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
  // lives here rather than on the generating component: that component (indicator-add /
  // reporting-overview) can be destroyed and recreated while its preparation loop keeps
  // running in the background (closing/reopening the reporting modal), so an abort request
  // from a freshly-created component instance or the global banner needs a flag the
  // still-running loop actually reads, independent of which component instance is live.
  abortPreparation = false;

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

  availableTemplateCategories = availableTemplateCategories;
  availableTemplates: TemplateData[] = availableTemplates;

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

  // shared by bakeInCustomInfo/bakeInCustomInfoToClone/bakeInCustomInfoToClonePage -- only the
  // page-number text differs between them (see each caller), everything else about baking in
  // the commune/creator/free-text settings is identical
  private bakeInCustomInfoForElement(el: any) {
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
  }

  bakeInCustomInfo() {
    // update selected template with general settings
    for (const [idx, page] of this.selectedTemplate.pages.entries()) {
      for (const el of page.pageElements) {
        this.bakeInCustomInfoForElement(el);

        // page number is generated by html expression, but we update if anyway for consistency
        if (el.type.includes('pageNumber-')) {
          el.placeholderText = 'Seite ' + this.getPageNumber(idx);
        }
      }
    }
  }

  setTemplateSectionsFromConfig(config: ImportData) {
    // templateSections is a flat array of mixed indicator/POI section objects (see
    // getSectionsAsArray, which produces it on export) -- split back out by which
    // id each section carries, the same distinction removeIndicatorSection/
    // removeGeoresourcesSection use.
    const indicators = (config.templateSections as any[]).filter(
      (section: any) => !!section.indicatorId
    );
    const georesources = (config.templateSections as any[]).filter(
      (section: any) => !!section.georesourceId
    );
    this.setValue({
      ...this._reportingData$.value,
      sections: { indicators, georesources },
    });
  }

  bakeInCustomInfoToClone() {
    // update selected template with general settings
    for (const [idx, page] of this.clonedTemplate.pages.entries()) {
      for (const el of page.pageElements) {
        this.bakeInCustomInfoForElement(el);

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
      this.bakeInCustomInfoForElement(el);

      // this page is a standalone clone not yet inserted into selectedTemplate.pages, so
      // getPageNumber() (which looks the page up by position there) isn't usable here
      if (el.type.includes('pageNumber-')) {
        el.placeholderText = 'Seite ' + (index + 1);
      }
    }

    return page;
  }

  // `pages` defaults to the working template's pages, but callers operating on a different
  // pages array (e.g. indicator-add's clonedTemplate.pages) can pass their own.
  getPageNumber(index, pages = this.selectedTemplate.pages) {
    let pageNumber = 1;
    for (let i = 0; i < index; i++) {
      if (this.showThisPage(pages[i], pages)) {
        pageNumber++;
      }
    }
    return pageNumber;
  }

  showThisPage(page, pages = this.selectedTemplate.pages) {
    if (page.hidden) {
      return false;
    }

    let pageWillBeShown = false;
    for (const visiblePage of this.filterPagesToShow(pages)) {
      // compare by id, not reference: `pages` elements can get spliced out/in (e.g. datatable
      // continuation pages), which would silently break a reference-equality check
      if (visiblePage.id == page.id) {
        pageWillBeShown = true;
      }
    }
    return pageWillBeShown;
  }

  filterPagesToShow(pages = this.selectedTemplate.pages) {
    const pagesToShow: any[] = [];
    let skipNextPage = false;
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (this.pageContainsDatatable(i, pages)) {
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

  pageContainsDatatable(pageID, pages = this.selectedTemplate.pages) {
    const page = pages[pageID];
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

  // Assigns unique ids to pages spliced into clonedTemplate.pages while a section is being
  // configured (continuation pages etc.) - only needs to be unique within that one workflow,
  // which is why it resets to 1 per indicator-add.component.ts's reset().
  private templatePageIdCounter = 1;

  nextTemplatePageId(): number {
    return this.templatePageIdCounter++;
  }

  resetTemplatePageIdCounter(): void {
    this.templatePageIdCounter = 1;
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

  addIndicatorSection(indicatorData) {
    const newSectionVal: SectionData = {
      indicators: [...this._reportingData$.value.sections.indicators, indicatorData],
      georesources: this._reportingData$.value.sections.georesources,
    };
    this.setValue({ ...this._reportingData$.value, sections: newSectionVal });

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
    const newSectionVal: SectionData = {
      indicators: this._reportingData$.value.sections.indicators,
      georesources: [...this._reportingData$.value.sections.georesources, geoData],
    };
    this.setValue({ ...this._reportingData$.value, sections: newSectionVal });

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
