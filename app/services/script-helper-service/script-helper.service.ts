import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { TranslateService } from '@ngx-translate/core';

export interface ScriptSelectItem {
  displayName: string;
  apiName: string;
}

/** A selectable option before its display name is translated. */
interface ScriptSelectOption {
  apiName: string;
  nameKey: string;
}
@Injectable({
  providedIn: 'root',
})
export class ScriptHelperService {
  private httpClient = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);
  private translate = inject(TranslateService);

  private targetUrlToManagementService =
    this.envConfigService.apiUrl + this.envConfigService.basePath + '/';

  /**
   * Selectable options for the script wizard. `apiName` is the contract with the
   * backend and never changes; the display name is resolved from `nameKey` on
   * access, so switching the UI language is reflected without rebuilding the
   * service.
   */
  private static readonly DATA_TYPE_OPTIONS: ScriptSelectOption[] = [
    { apiName: 'string', nameKey: 'ADMIN_SCRIPTS.DATA_TYPES.STRING' },
    { apiName: 'boolean', nameKey: 'ADMIN_SCRIPTS.DATA_TYPES.BOOLEAN' },
    { apiName: 'integer', nameKey: 'ADMIN_SCRIPTS.DATA_TYPES.INTEGER' },
    { apiName: 'double', nameKey: 'ADMIN_SCRIPTS.DATA_TYPES.DOUBLE' },
  ];

  private static readonly SCRIPT_TYPE_OPTIONS: ScriptSelectOption[] = [
    { apiName: 'generic', nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.GENERIC' },
    { apiName: 'indicator_sum', nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_SUM' },
    { apiName: 'indicator_subtract', nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_SUBTRACT' },
    { apiName: 'indicator_percentage', nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_PERCENTAGE' },
    { apiName: 'indicator_share', nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_SHARE' },
    { apiName: 'indicator_division', nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_DIVISION' },
    { apiName: 'indicator_trend', nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_TREND' },
    { apiName: 'indicator_continuity', nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_CONTINUITY' },
    {
      apiName: 'indicator_change_absolute',
      nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_CHANGE_ABSOLUTE',
    },
    {
      apiName: 'indicator_change_absolute_refDate',
      nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_CHANGE_ABSOLUTE_REF_DATE',
    },
    {
      apiName: 'indicator_change_relative_refDate',
      nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_CHANGE_RELATIVE_REF_DATE',
    },
    {
      apiName: 'indicator_change_relative',
      nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_CHANGE_RELATIVE',
    },
    { apiName: 'indicator_promille', nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_PROMILLE' },
    {
      apiName: 'indicator_headlineIndicator',
      nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_HEADLINE_INDICATOR',
    },
    {
      apiName: 'indicator_multiplication',
      nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.INDICATOR_MULTIPLICATION',
    },
    {
      apiName: 'georesource_pointsInPolygon',
      nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.GEORESOURCE_POINTS_IN_POLYGON',
    },
    {
      apiName: 'georesource_statistics',
      nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.GEORESOURCE_STATISTICS',
    },
    {
      apiName: 'georesource_subsetShare',
      nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.GEORESOURCE_SUBSET_SHARE',
    },
    {
      apiName: 'lineSegmentInPolygon',
      nameKey: 'ADMIN_SCRIPTS.SCRIPT_TYPES.LINE_SEGMENT_IN_POLYGON',
    },
  ];

  private static readonly TEMPORAL_UNIT_OPTIONS: ScriptSelectOption[] = [
    { apiName: 'YEARS', nameKey: 'ADMIN_SCRIPTS.TEMPORAL_UNITS.YEARS' },
    { apiName: 'MONTHS', nameKey: 'ADMIN_SCRIPTS.TEMPORAL_UNITS.MONTHS' },
    { apiName: 'DAYS', nameKey: 'ADMIN_SCRIPTS.TEMPORAL_UNITS.DAYS' },
  ];

  get availableScriptDataTypes(): ScriptSelectItem[] {
    return this.toSelectItems(ScriptHelperService.DATA_TYPE_OPTIONS);
  }

  get availableScriptTypeOptions(): ScriptSelectItem[] {
    return this.toSelectItems(ScriptHelperService.SCRIPT_TYPE_OPTIONS);
  }

  get temporalOptions(): ScriptSelectItem[] {
    return this.toSelectItems(ScriptHelperService.TEMPORAL_UNIT_OPTIONS);
  }

  /**
   * Translated options, memoized per option set and language.
   *
   * The identity of the returned array and its items has to be stable: the
   * script-parameters template iterates a getter directly with `track dataType`,
   * so handing out fresh objects on every change-detection run would rebuild
   * those DOM nodes each time. Keyed by the active language so a switch still
   * produces new labels.
   */
  private readonly translatedOptions = new WeakMap<
    ScriptSelectOption[],
    { lang: string; items: ScriptSelectItem[] }
  >();

  private toSelectItems(options: ScriptSelectOption[]): ScriptSelectItem[] {
    const lang = this.translate.currentLang || this.translate.defaultLang || '';
    const cached = this.translatedOptions.get(options);
    if (cached && cached.lang === lang) {
      return cached.items;
    }

    const items = options.map(({ apiName, nameKey }) => ({
      apiName,
      displayName: this.translate.instant(nameKey),
    }));
    this.translatedOptions.set(options, { lang, items });
    return items;
  }

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
