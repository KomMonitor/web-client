import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KommonitorIndicatorDataExchangeService } from 'services/adminIndicatorUnit/kommonitor-data-exchange.service';

export interface ScriptDataTypeOption {
  apiName: 'string' | 'integer' | 'double' | 'boolean';
  displayName: string;
}

export interface ScriptParameter {
  name: string;
  description: string;
  dataType: ScriptDataTypeOption['apiName'] | string;
  defaultValue: any;
  minParameterValueForNumericInputs?: number | null;
  maxParameterValueForNumericInputs?: number | null;
}

export interface IndicatorSummary {
  indicatorId: string;
  indicatorName: string;
  unit?: string;
  metadata?: any;
}

export interface GeoresourceSummary {
  georesourceId: string;
  datasetName: string;
  metadata?: any;
}

@Injectable({ providedIn: 'root' })
export class KommonitorScriptHelperService {

  // State exposed to component/template
  targetIndicator: IndicatorSummary | null = null;
  requiredIndicators_tmp: IndicatorSummary[] = [];
  requiredGeoresources_tmp: GeoresourceSummary[] = [];
  requiredScriptParameters_tmp: ScriptParameter[] = [];

  scriptCode_readableString: string | undefined = undefined;

  scriptFormulaHTML_overwriteTargetIndicatorMethod: boolean = false;
  scriptFormulaHTML: string = '';

  // Options
  availableScriptDataTypes: ScriptDataTypeOption[] = [
    { apiName: 'string', displayName: 'Text' },
    { apiName: 'integer', displayName: 'Ganzzahl' },
    { apiName: 'double', displayName: 'Gleitkommazahl' },
    { apiName: 'boolean', displayName: 'Boolean' }
  ];

  availableScriptTypeOptions: any[] = [];

  constructor(
    private http: HttpClient,
    private indicatorExchange: KommonitorIndicatorDataExchangeService
  ) {}

  // Lifecycle
  reset(): void {
    this.targetIndicator = null;
    this.requiredIndicators_tmp = [];
    this.requiredGeoresources_tmp = [];
    this.requiredScriptParameters_tmp = [];
    this.scriptCode_readableString = undefined;
    this.scriptFormulaHTML_overwriteTargetIndicatorMethod = false;
    this.scriptFormulaHTML = '';
  }

  // Indicators
  addBaseIndicator(indicator: IndicatorSummary): void {
    if (!indicator) { return; }
    const exists = this.requiredIndicators_tmp.some(x => x?.indicatorId === indicator?.indicatorId);
    if (!exists) {
      this.requiredIndicators_tmp = [...this.requiredIndicators_tmp, indicator];
    }
  }

  removeBaseIndicator(indicator: IndicatorSummary): void {
    if (!indicator) { return; }
    this.requiredIndicators_tmp = (this.requiredIndicators_tmp || []).filter(x => x?.indicatorId !== indicator?.indicatorId);
  }

  // Georesources
  addBaseGeoresource(geo: GeoresourceSummary): void {
    if (!geo) { return; }
    const exists = this.requiredGeoresources_tmp.some(x => x?.georesourceId === geo?.georesourceId);
    if (!exists) {
      this.requiredGeoresources_tmp = [...this.requiredGeoresources_tmp, geo];
    }
  }

  removeBaseGeoresource(geo: GeoresourceSummary): void {
    if (!geo) { return; }
    this.requiredGeoresources_tmp = (this.requiredGeoresources_tmp || []).filter(x => x?.georesourceId !== geo?.georesourceId);
  }

  // Parameters
  addScriptParameter(
    name: string,
    description: string,
    dataType: ScriptParameter['dataType'],
    defaultValue: any,
    minParameterValueForNumericInputs: number | null,
    maxParameterValueForNumericInputs: number | null
  ): void {
    const param: ScriptParameter = {
      name,
      description,
      dataType,
      defaultValue,
      minParameterValueForNumericInputs: minParameterValueForNumericInputs ?? undefined,
      maxParameterValueForNumericInputs: maxParameterValueForNumericInputs ?? undefined
    };
    // replace if same name exists
    const idx = this.requiredScriptParameters_tmp.findIndex(p => p.name === name);
    if (idx >= 0) {
      const copy = [...this.requiredScriptParameters_tmp];
      copy[idx] = param;
      this.requiredScriptParameters_tmp = copy;
    } else {
      this.requiredScriptParameters_tmp = [...this.requiredScriptParameters_tmp, param];
    }
  }

  removeScriptParameter(param: ScriptParameter): void {
    if (!param) { return; }
    this.requiredScriptParameters_tmp = (this.requiredScriptParameters_tmp || []).filter(p => p.name !== param.name);
  }

  removeScriptParameter_byName(name: string): void {
    if (!name) { return; }
    this.requiredScriptParameters_tmp = (this.requiredScriptParameters_tmp || []).filter(p => p.name !== name);
  }

  // Remote operations (temporarily delegate to legacy helper if available)
  async postNewScript(datasetName: string, description: string, targetIndicator: any): Promise<any> {
    const baseUrl = this.getManagementServiceBaseUrl();
    if (!baseUrl) { throw new Error('Management service baseUrl not configured'); }
    if (!this.scriptCode_readableString) { throw new Error('Script code is empty'); }

    const postBody = {
      name: datasetName,
      description,
      associatedIndicatorId: targetIndicator?.indicatorId,
      requiredIndicatorIds: (this.requiredIndicators_tmp || []).map(ind => ind.indicatorId),
      requiredGeoresourceIds: (this.requiredGeoresources_tmp || []).map(geo => geo.georesourceId),
      variableProcessParameters: this.requiredScriptParameters_tmp || [],
      scriptCodeBase64: this.encodeBase64(this.scriptCode_readableString)
    } as any;

    return await this.http.post(`${baseUrl}process-scripts`, postBody, {
      headers: { 'Content-Type': 'application/json' }
    }).toPromise();
  }

  async replaceMethodMetadataForTargetIndicator(targetIndicator: any): Promise<any> {
    const baseDataApi = this.indicatorExchange.baseUrlToKomMonitorDataAPI;
    if (!baseDataApi) { throw new Error('Data API baseUrl not configured'); }
    if (!targetIndicator?.indicatorId) { throw new Error('Target indicator is missing id'); }

    const patchBody = this.buildIndicatorPatchBody(targetIndicator);
    return await this.http.patch(`${baseDataApi}/indicators/${targetIndicator.indicatorId}`, patchBody).toPromise();
  }

  // Helpers
  prettifyScriptCodePreview(htmlDomElementId: string): void {
    try {
      setTimeout(() => {
        try {
          const PR: any = (window as any).PR;
          if (!PR || !PR.prettyPrint) { return; }
          const el = document.querySelector(htmlDomElementId) as HTMLElement | null;
          if (el) { el.classList.remove('prettyprinted'); }
          PR.prettyPrint();
        } catch {}
      }, 250);
    } catch {}
  }

  private getManagementServiceBaseUrl(): string {
    try {
      const env: any = (window as any).__env || {};
      const apiUrl: string = env.apiUrl || '';
      const basePath: string = env.basePath || '';
      const base = `${apiUrl}${basePath}/`;
      return base;
    } catch { return ''; }
  }

  private encodeBase64(data: string): string {
    try { return window.btoa(data); } catch { return ''; }
  }

  private buildIndicatorPatchBody(targetIndicatorMetadata: any): any {
    const md = targetIndicatorMetadata?.metadata || {};
    const patchBody: any = {
      metadata: {
        note: md.note ?? null,
        literature: md.literature ?? null,
        updateInterval: md.updateInterval,
        sridEPSG: md.sridEPSG ?? 4326,
        datasource: md.datasource,
        contact: md.contact,
        lastUpdate: md.lastUpdate,
        description: md.description ?? null,
        databasis: md.databasis ?? null
      },
      refrencesToOtherIndicators: [],
      permissions: targetIndicatorMetadata?.permissions,
      datasetName: targetIndicatorMetadata?.indicatorName,
      abbreviation: targetIndicatorMetadata?.abbreviation ?? null,
      characteristicValue: targetIndicatorMetadata?.characteristicValue ?? null,
      tags: targetIndicatorMetadata?.tags,
      creationType: targetIndicatorMetadata?.creationType,
      unit: targetIndicatorMetadata?.unit,
      topicReference: targetIndicatorMetadata?.topicReference,
      refrencesToGeoresources: [],
      indicatorType: targetIndicatorMetadata?.indicatorType,
      interpretation: targetIndicatorMetadata?.interpretation ?? '',
      isHeadlineIndicator: targetIndicatorMetadata?.isHeadlineIndicator ?? false,
      processDescription: this.scriptFormulaHTML || targetIndicatorMetadata?.processDescription,
      lowestSpatialUnitForComputation: targetIndicatorMetadata?.lowestSpatialUnitForComputation,
      defaultClassificationMapping: targetIndicatorMetadata?.defaultClassificationMapping
    };

    const refInds = targetIndicatorMetadata?.referencedIndicators || [];
    for (const indicRef of refInds) {
      patchBody.refrencesToOtherIndicators.push({
        indicatorId: indicRef.referencedIndicatorId,
        referenceDescription: indicRef.referencedIndicatorDescription
      });
    }

    const refGeos = targetIndicatorMetadata?.referencedGeoresources || [];
    for (const geoRef of refGeos) {
      patchBody.refrencesToGeoresources.push({
        georesourceId: geoRef.referencedGeoresourceId,
        referenceDescription: geoRef.referencedGeoresourceDescription
      });
    }

    return patchBody;
  }
}


