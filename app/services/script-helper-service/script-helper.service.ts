import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

export interface ScriptSelectItem {
  displayName: string;
  apiName: string;
}
@Injectable({
  providedIn: 'root',
})
export class ScriptHelperService {
  private httpClient = inject(HttpClient);
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

  reset() {
    this.requiredIndicators_tmp = [];
    this.requiredGeoresources_tmp = [];
    this.requiredScriptParameters_tmp = [];
    this.scriptCode_base64String = undefined;
    this.scriptCode_readableString = undefined;
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

  async postNewScript(scriptName, description, associatedIndicatorId: string) {
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
}
