import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

declare const MathJax: any;

export interface ScriptSelectItem {
  displayName: string;
  apiName: string;
}
@Injectable({
  providedIn: 'root',
})
export class ScriptHelperService {
  private httpClient = inject(HttpClient);
  private broadcastService = inject(BroadcastService);
  private envConfigService = inject(EnvConfigService);

  private targetUrlToManagementService =
    this.envConfigService.apiUrl + this.envConfigService.basePath + '/';

  availableScriptDataTypes: ScriptSelectItem[] = [
    {
      displayName: 'Textuell (String)',
      apiName: 'string',
    },
    {
      displayName: 'Wahrheitswert (Boolean)',
      apiName: 'boolean',
    },
    {
      displayName: 'Ganzzahl (Integer)',
      apiName: 'integer',
    },
    {
      displayName: 'Gleitkommazahl (Double)',
      apiName: 'double',
    },
  ];

  availableScriptTypeOptions: ScriptSelectItem[] = [
    {
      displayName: 'Generische Definition',
      apiName: 'generic',
    },
    {
      displayName: 'Indikatoren - Summe aller Indikatoren',
      apiName: 'indicator_sum',
    },
    {
      displayName: 'Indikatoren - Subtraktion von Basis-Indikatoren von einem Referenzindikator',
      apiName: 'indicator_subtract',
    },
    {
      displayName:
        'Indikatoren - Prozentualer Anteil (Quotient zwischen Basis-Indikatoren und einem Referenzindikator)',
      apiName: 'indicator_percentage',
    },
    {
      displayName:
        'Indikatoren - Anteil (Quotient zwischen Basis-Indikatoren und einem Referenzindikator)',
      apiName: 'indicator_share',
    },
    {
      displayName: 'Indikatoren - Division (Quotient zweier Indikatoren)',
      apiName: 'indicator_division',
    },
    {
      displayName: 'Indikatoren - Trend (mittels linearer Regression)',
      apiName: 'indicator_trend',
    },
    {
      displayName: 'Indikatoren - Kontinuität (mittels Pearson Korrelation)',
      apiName: 'indicator_continuity',
    },
    {
      displayName: 'Indikatoren - Veränderung absolut',
      apiName: 'indicator_change_absolute',
    },
    {
      displayName: 'Indikatoren - Veränderung absolut mit festem Referenz-Zeitpunkt',
      apiName: 'indicator_change_absolute_refDate',
    },
    {
      displayName: 'Indikatoren - Veränderung prozentual mit festem Referenz-Zeitpunkt',
      apiName: 'indicator_change_relative_refDate',
    },
    {
      displayName: 'Indikatoren - Veränderung prozentual',
      apiName: 'indicator_change_relative',
    },
    {
      displayName:
        'Indikatoren - Promille-Wert (Quotient zwischen Basis-Indikatoren und einem Referenzindikator)',
      apiName: 'indicator_promille',
    },
    {
      displayName:
        'Leitindikator - verkettete Berechnung (Rank, Min-Max-Normalisierung, Aggregation)',
      apiName: 'indicator_headlineIndicator',
    },
    {
      displayName: 'Indikatoren - Produkt aller Indikatoren',
      apiName: 'indicator_multiplication',
    },
    {
      displayName: 'Georessourcen - Anzahl Punkte in Polygon',
      apiName: 'georesource_pointsInPolygon',
    },
    {
      displayName: 'Georessourcen - Statistiken anhand Objekteigenschaft (Punktdatensätze)',
      apiName: 'georesource_statistics',
    },
    {
      displayName: 'Georessourcen - Prozentualer Anteil anhand Objekteigenschaft (Punktdatensätze)',
      apiName: 'georesource_subsetShare',
    },
    {
      displayName: 'Georessourcen - Summierte Linienlänge je Polygon',
      apiName: 'lineSegmentInPolygon',
    },
  ];

  temporalOptions: ScriptSelectItem[] = [
    {
      apiName: 'YEARS',
      displayName: 'Jahr(e)',
    },
    {
      apiName: 'MONTHS',
      displayName: 'Monat(e)',
    },
    {
      apiName: 'DAYS',
      displayName: 'Tag(e)',
    },
  ];

  requiredIndicators_tmp: any[] = [];
  requiredGeoresources_tmp: any[] = [];
  requiredScriptParameters_tmp: any[] = [];
  scriptCode_base64String = undefined;
  scriptCode_readableString = undefined;

  scriptFormulaHTML = undefined;
  scriptFormulaHTML_successToastDisplay = this.scriptFormulaHTML;
  scriptFormulaHTML_overwriteTargetIndicatorMethod = false;

  scriptFormulaExplanation = '';

  targetIndicatorOldProcessDescription = undefined;

  reset() {
    this.requiredIndicators_tmp = [];
    this.requiredGeoresources_tmp = [];
    this.requiredScriptParameters_tmp = [];
    this.scriptCode_base64String = undefined;
    this.scriptCode_readableString = undefined;
    this.scriptFormulaHTML = undefined;
    this.scriptFormulaHTML_overwriteTargetIndicatorMethod = false;
    this.scriptFormulaExplanation = '';
    this.targetIndicatorOldProcessDescription = undefined;
  }

  addBaseIndicator(indicatorMetadata) {
    if (!indicatorMetadata) {
      return;
    }
    // for (const baseIndicator of this.requiredIndicators_tmp) {
    // 	if (baseIndicator.indicatorId === indicatorMetadata.indicatorId){
    // 		// already inserted as base indicator, hence add not allowed
    // 		return;
    // 	}
    // }
    this.requiredIndicators_tmp.push(indicatorMetadata);
  }

  removeBaseIndicator(indicatorMetadata) {
    for (let index = 0; index < this.requiredIndicators_tmp.length; index++) {
      if (this.requiredIndicators_tmp[index].indicatorId === indicatorMetadata.indicatorId) {
        // remove object
        this.requiredIndicators_tmp.splice(index, 1);
        break;
      }
    }
  }

  addBaseGeoresource(georesourceMetadata) {
    // for (const baseGeoresource of this.requiredGeoresources_tmp) {
    // 	if (baseGeoresource.georesourceId === georesourceMetadata.georesourceId){
    // 		// already inserted as base georesource, hence add not allowed
    // 		return;
    // 	}
    // }
    this.requiredGeoresources_tmp.push(georesourceMetadata);
  }

  removeBaseGeoresource(georesourceMetadata) {
    for (let index = 0; index < this.requiredGeoresources_tmp.length; index++) {
      if (
        this.requiredGeoresources_tmp[index].georesourceId === georesourceMetadata.georesourceId
      ) {
        // remove object
        this.requiredGeoresources_tmp.splice(index, 1);
        break;
      }
    }
  }

  addScriptParameter(
    parameterName,
    parameterDescription,
    parameterDataType,
    parameterDefaultValue,
    parameterNumericMinValue,
    parameterNumericMaxValue
  ) {
    for (const scriptParameter of this.requiredScriptParameters_tmp) {
      if (scriptParameter.name === parameterName) {
        // already inserted as script parameter, hence add not allowed
        return;
      }
    }

    const scriptParameter = {
      name: parameterName,
      description: parameterDescription,
      dataType: parameterDataType.apiName,
      defaultValue: parameterDefaultValue,
      minParameterValueForNumericInputs: parameterNumericMinValue || 0,
      maxParameterValueForNumericInputs: parameterNumericMaxValue || 1,
    };
    this.requiredScriptParameters_tmp.push(scriptParameter);
  }

  removeScriptParameter(scriptParameter) {
    for (let index = 0; index < this.requiredScriptParameters_tmp.length; index++) {
      if (this.requiredScriptParameters_tmp[index].name === scriptParameter.name) {
        // remove object
        this.requiredScriptParameters_tmp.splice(index, 1);
        break;
      }
    }
  }

  removeScriptParameter_byName(scriptParameterName) {
    for (let index = 0; index < this.requiredScriptParameters_tmp.length; index++) {
      if (this.requiredScriptParameters_tmp[index].name === scriptParameterName) {
        // remove object
        this.requiredScriptParameters_tmp.splice(index, 1);
        break;
      }
    }
  }

  prettifyScriptCodePreview(htmlDomElementOrId: HTMLElement | string): void {
    setTimeout(() => {
      $(htmlDomElementOrId as any).removeClass('prettyprinted');

      // todo ?!
      //PR.prettyPrint();
    }, 250);
  }

  buildPatchBody_indicators(targetIndicatorMetadata) {
    const patchBody: any = {
      metadata: {
        note: targetIndicatorMetadata.metadata.note || null,
        literature: targetIndicatorMetadata.metadata.literature || null,
        updateInterval: targetIndicatorMetadata.metadata.updateInterval,
        sridEPSG: targetIndicatorMetadata.metadata.sridEPSG || 4326,
        datasource: targetIndicatorMetadata.metadata.datasource,
        contact: targetIndicatorMetadata.metadata.contact,
        lastUpdate: targetIndicatorMetadata.metadata.lastUpdate,
        description: targetIndicatorMetadata.metadata.description || null,
        databasis: targetIndicatorMetadata.metadata.databasis || null,
      },
      refrencesToOtherIndicators: [], // filled directly after
      permissions: targetIndicatorMetadata.permissions,
      datasetName: targetIndicatorMetadata.indicatorName,
      abbreviation: targetIndicatorMetadata.abbreviation || null,
      characteristicValue: targetIndicatorMetadata.characteristicValue || null,
      tags: targetIndicatorMetadata.tags,
      creationType: targetIndicatorMetadata.creationType,
      unit: targetIndicatorMetadata.unit,
      topicReference: targetIndicatorMetadata.topicReference,
      refrencesToGeoresources: [], // filled directly after
      indicatorType: targetIndicatorMetadata.indicatorType,
      interpretation: targetIndicatorMetadata.interpretation || '',
      isHeadlineIndicator: targetIndicatorMetadata.isHeadlineIndicator || false,
      processDescription: this.scriptFormulaHTML || targetIndicatorMetadata.processDescription,
      lowestSpatialUnitForComputation: targetIndicatorMetadata.lowestSpatialUnitForComputation,
      defaultClassificationMapping: targetIndicatorMetadata.defaultClassificationMapping,
    };

    // REFERENCES

    if (
      targetIndicatorMetadata.referencedIndicators &&
      targetIndicatorMetadata.referencedIndicators.length > 0
    ) {
      patchBody.refrencesToOtherIndicators = [];

      for (const indicRef of targetIndicatorMetadata.referencedIndicators) {
        patchBody.refrencesToOtherIndicators.push({
          indicatorId: indicRef.referencedIndicatorId,
          referenceDescription: indicRef.referencedIndicatorDescription,
        });
      }
    }

    if (
      targetIndicatorMetadata.referencedGeoresources &&
      targetIndicatorMetadata.referencedGeoresources.length > 0
    ) {
      patchBody.refrencesToGeoresources = [];

      for (const geoRef of targetIndicatorMetadata.referencedGeoresources) {
        patchBody.refrencesToGeoresources.push({
          georesourceId: geoRef.referencedGeoresourceId,
          referenceDescription: geoRef.referencedGeoresourceDescription,
        });
      }
    }

    return patchBody;
  }

  async replaceMethodMetadataForTargetIndicator(targetIndicatorMetadata) {
    const patchBody = this.buildPatchBody_indicators(targetIndicatorMetadata);

    this.targetIndicatorOldProcessDescription = targetIndicatorMetadata.processDescription;

    this.httpClient
      .patch(
        this.envConfigService.baseUrlToKomMonitorDataAPI +
          '/indicators/' +
          targetIndicatorMetadata.indicatorId,
        patchBody
      )
      .subscribe({
        next: (_response) => {
          this.broadcastService.broadcast(BroadcastMessage.RefreshIndicatorOverviewTable, [
            'edit',
            targetIndicatorMetadata.indicatorId,
          ]);
        },
      });
  }

  async postNewScript(scriptName, description, associatedIndicatorId: string) {
    console.log('Trying to POST to management service to register new script.');

    /*	POST BODY
    {
        "scriptCodeBase64": "scriptCodeBase64",
        "requiredIndicatorIds": [
          "requiredIndicatorIds",
          "requiredIndicatorIds"
        ],
        "variableProcessParameters": [
          {
          "minParameterValueForNumericInputs": 6.027456183070403,
          "maxParameterValueForNumericInputs": 0.8008281904610115,
          "defaultValue": "defaultValue",
          "dataType": "string",
          "name": "name",
          "description": "description"
          },
          {
          "minParameterValueForNumericInputs": 6.027456183070403,
          "maxParameterValueForNumericInputs": 0.8008281904610115,
          "defaultValue": "defaultValue",
          "dataType": "string",
          "name": "name",
          "description": "description"
          }
        ],
        "associatedIndicatorId": "associatedIndicatorId",
        "name": "name",
        "description": "description",
        "requiredGeoresourceIds": [
          "requiredGeoresourceIds",
          "requiredGeoresourceIds"
        ]
        }
  */

    const postBody = {
      name: scriptName,
      description: description,
      associatedIndicatorId: associatedIndicatorId,
      requiredIndicatorIds: this.requiredIndicators_tmp.map(
        (indicatorMetadata) => indicatorMetadata.indicatorId
      ),
      requiredGeoresourceIds: this.requiredGeoresources_tmp.map(
        (georesourceMetadata) => georesourceMetadata.georesourceId
      ),
      variableProcessParameters: this.requiredScriptParameters_tmp,
      scriptCodeBase64: window.btoa(this.scriptCode_readableString!),
    };

    const header = {
      'Content-Type': 'application/json',
    };

    return await firstValueFrom(
      this.httpClient.post(this.targetUrlToManagementService + 'process-scripts', postBody, {
        headers: header,
      })
    );
  }

  async updateScript(scriptName, description, scriptId) {
    console.log('Trying to POST to importer service to update spatial unit.');

    const putBody = {
      name: scriptName,
      description: description,
      requiredIndicatorIds: this.requiredIndicators_tmp,
      requiredGeoresourceIds: this.requiredGeoresources_tmp,
      variableProcessParameters: this.requiredScriptParameters_tmp,
      scriptCodeBase64: window.btoa(this.scriptCode_readableString!),
    };

    const header = {
      'Content-Type': 'application/json',
    };

    return await this.httpClient
      .post(this.targetUrlToManagementService + 'process-scripts/' + scriptId, putBody, {
        headers: header,
      })
      .subscribe({
        next: (response) => {
          return response;
        },
        error: (error) => {
          console.error('Error while posting to importer service.');
          throw error;
        },
      });
  }

  getAlphabetLetterFromNumber(number) {
    return String.fromCharCode(Number(number) + 'A'.charCodeAt(0));
  }

  styleMathFormula(domOutputElementId) {
    const output: any = document.getElementById(domOutputElementId);
    output.innerHTML = this.scriptFormulaHTML;

    // MathJax.texReset();
    // MathJax.typesetClear();
    MathJax.typesetPromise([output])
      .then(function () {
        /* intentionally empty */
      })
      .catch(function (err) {
        output.innerHTML = '';
        output.appendChild(document.createTextNode(err.message));
        console.error(err);
      })
      .then(function () {
        /* intentionally empty */
      });
  }

  styleMathFormula_forExplanation(domOutputElementId) {
    const output = document.getElementById(domOutputElementId);

    // MathJax.texReset();
    // MathJax.typesetClear();
    MathJax.typesetPromise([output])
      .then(() => {
        setTimeout(() => {
          this.scriptFormulaExplanation = '' + output!.innerHTML;
        });
      })
      .catch((err) => {
        output!.innerHTML = '';
        output!.appendChild(document.createTextNode(err.message));
        console.error(err);
      })
      .then(() => {
        setTimeout(() => {
          this.scriptFormulaExplanation = '' + output!.innerHTML;
        });
      });
  }

  typesetContainerByClass(className) {
    const domElements: any = document.getElementsByClassName(className);

    for (const domElement of domElements) {
      MathJax.typesetPromise([domElement])
        .then(function () {
          setTimeout(() => {
            /* intentionally empty */
          });
        })
        .catch((err) => {
          console.error(err);
        })
        .then(() => {
          setTimeout(() => {
            /* intentionally empty */
          });
        });
    }
  }
}
