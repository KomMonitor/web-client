import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, Inject } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import * as angular from 'angular';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DataExchangeService } from '../../../../../services/data-exchange-service/data-exchange.service';
import { ConfigStorageService } from '../../../../../services/config-storage-service/config-storage.service';
import { firstValueFrom } from 'rxjs';

declare var CodeMirror: any;
declare var PR: any;
declare var $: any;

interface CodeMirrorEditor {
  getValue(): string;
  setValue(value: string): void;
  setSize(width: number | null, height: number): void;
  on(event: string, callback: (cm: any) => void): void;
}

interface LintingIssue {
  severity: 'error' | 'warning';
  message: string;
  from: { line: number; ch: number };
  to: { line: number; ch: number };
}

@Component({
  selector: 'admin-app-config-new',
  templateUrl: './admin-app-config.component.html',
  styleUrls: ['./admin-app-config.component.css']
})
export class AdminAppConfigComponent implements OnInit, AfterViewInit {
  @ViewChild('appConfigEditor') appConfigEditor!: ElementRef;

  loadingData = true;
  codeMirrorEditor!: CodeMirrorEditor;
  templateCodeMirrorEditor!: CodeMirrorEditor;
  currentCodeMirrorEditor!: CodeMirrorEditor;
  newCodeMirrorEditor!: CodeMirrorEditor;
  missingRequiredParameters: string[] = [];
  missingRequiredParameters_string = '';
  keywordsInConfig = [
    "window.__env", "window.__env.appTitle", "window.__env.enableKeycloakSecurity", "window.__env.encryption",
    "window.__env.FEATURE_ID_PROPERTY_NAME", "window.__env.FEATURE_NAME_PROPERTY_NAME",
    "window.__env.VALID_START_DATE_PROPERTY_NAME", "window.__env.VALID_END_DATE_PROPERTY_NAME", "window.__env.indicatorDatePrefix",
    "window.__env.apiUrl", "window.__env.targetUrlToProcessingEngine", "window.__env.targetUrlToReachabilityService_ORS",
    "window.__env.targetUrlToImporterService", "window.__env.simplifyGeometriesParameterName", "window.__env.simplifyGeometriesOptions",
    "window.__env.simplifyGeometries", "window.__env.numberOfDecimals", "window.__env.initialLatitude", "window.__env.initialLongitude",
    "window.__env.initialZoomLevel", "window.__env.minZoomLevel", "window.__env.maxZoomLevel", "window.__env.baseLayers", "window.__env.initialIndicatorId",
    "window.__env.initialSpatialUnitName", "window.__env.useTransparencyOnIndicator", "window.__env.useOutlierDetectionOnIndicator",
    "window.__env.classifyZeroSeparately", "window.__env.classifyUsingWholeTimeseries", "window.__env.updateIntervalOptions",
    "window.__env.indicatorCreationTypeOptions", "window.__env.indicatorUnitOptions", "window.__env.indicatorTypeOptions",
    "window.__env.wmsDatasets", "window.__env.wfsDatasets", "window.__env.isAdvancedMode", "window.__env.showAdvancedModeSwitch",
    "window.__env.customLogoURL", "window.__env.customLogo_onClickURL", "window.__env.customLogoWidth", "window.__env.customGreetingsContact_name",
    "window.__env.customGreetingsContact_organisation", "window.__env.customGreetingsContact_mail"
  ];
  appConfigTemplate: string = '';
  appConfigTmp: string = '';
  appConfigCurrent: string = '';
  appConfigNew: string = '';
  configSettingInvalid = false;
  errorMessagePart: string = '';
  lintingIssues: LintingIssue[] = [];

  constructor(
    private http: HttpClient,
    private kommonitorDataExchangeService: DataExchangeService,
    private kommonitorConfigStorageService: ConfigStorageService,
    @Inject('kommonitorScriptHelperService') private kommonitorScriptHelperService: any,
    @Inject('kommonitorDataExchangeService') private ajskommonitorDataExchangeService: any
  ) {
    if (!this.kommonitorScriptHelperService) {
      console.error('kommonitorScriptHelperService is not available');
    }
  }

  ngOnInit() {
    this.init();
  }

  ngAfterViewInit() {
    // Initialize any adminLTE box widgets
    $('.box').boxWidget();
  }

  async init() {
    try {
      if (!this.kommonitorScriptHelperService) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await firstValueFrom(this.http.get('./config/env_backup.js', { responseType: 'text' }));
      if (typeof response === 'string') {
        this.appConfigTemplate = response;
        if (this.kommonitorScriptHelperService) {
          this.kommonitorScriptHelperService.prettifyScriptCodePreview("appConfig_backupTemplate");
        }

        // set in app.js
        this.appConfigTmp = (window as any).__env.appConfig;
        this.appConfigCurrent = (window as any).__env.appConfig;
        this.appConfigNew = (window as any).__env.appConfig;
        if (this.kommonitorScriptHelperService) {
          this.kommonitorScriptHelperService.prettifyScriptCodePreview("appConfig_current");
        }
        this.initCodeEditor();
        this.onChangeAppConfig();
      }
    } catch (error) {
      console.error('Error initializing app config:', error);
      if (error instanceof HttpErrorResponse) {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error.error);
      } else {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
      $("#appConfigEditErrorAlert").show();
    } finally {
      this.loadingData = false;
    }
  }

  initCodeEditor() {
    const editorElement = document.getElementById("appConfigEditor");
    if (!editorElement) {
      console.error('Could not find appConfigEditor element');
      return;
    }

    // Initialize main editor
    this.codeMirrorEditor = CodeMirror.fromTextArea(editorElement, {
      lineNumbers: true,
      autoRefresh: true,
      mode: "javascript",
      gutters: ["CodeMirror-lint-markers"],
      lint: {
        "getAnnotations": this.validateCode.bind(this),
        "async": true
      }
    });
    this.codeMirrorEditor.setSize(null, 450);
    this.codeMirrorEditor.on('change', (cMirror: any) => {
      this.appConfigTmp = this.codeMirrorEditor.getValue();
    });
    this.codeMirrorEditor.setValue(this.appConfigCurrent);

    // Initialize template editor
    const templateElement = document.getElementById("templateCodeMirror");
    if (templateElement) {
      this.templateCodeMirrorEditor = CodeMirror(templateElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: "javascript",
        readOnly: true,
        theme: "panda-syntax",
        lineWrapping: true
      });
      this.templateCodeMirrorEditor.setSize(null, 450);
      this.templateCodeMirrorEditor.setValue(this.appConfigTemplate);
    }

    // Initialize current editor
    const currentElement = document.getElementById("currentCodeMirror");
    if (currentElement) {
      this.currentCodeMirrorEditor = CodeMirror(currentElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: "javascript",
        readOnly: true,
        theme: "panda-syntax",
        lineWrapping: true
      });
      this.currentCodeMirrorEditor.setSize(null, 450);
      this.currentCodeMirrorEditor.setValue(this.appConfigCurrent);
    }

    // Initialize new editor
    const newElement = document.getElementById("newCodeMirror");
    if (newElement) {
      this.newCodeMirrorEditor = CodeMirror(newElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: "javascript",
        readOnly: true,
        theme: "panda-syntax",
        lineWrapping: true
      });
      this.newCodeMirrorEditor.setSize(null, 450);
      this.newCodeMirrorEditor.setValue(this.appConfigNew);
    }
  }

  validateCode(cm: any, updateLinting: (issues: LintingIssue[]) => void, options: any) {
    try {
      this.lintingIssues = CodeMirror.lint.javascript(cm, options);
      updateLinting(this.lintingIssues);
    } catch (error) {
      console.error("Error while linting app config script code. Error is: \n" + error);
    }
    this.onChangeAppConfig();
  }

  isConfigSettingInvalid(configString: string): boolean {
    let isInvalid = true;
    isInvalid = !this.keywordsInConfig.every(keyword => configString.includes(keyword));
    this.missingRequiredParameters = this.keywordsInConfig.filter(keyword => !configString.includes(keyword));
    this.missingRequiredParameters_string = JSON.stringify(this.missingRequiredParameters);
    if (this.lintingIssues && this.lintingIssues.length > 0) {
      const errors = this.lintingIssues.filter(issue => issue.severity === 'error');
      if (errors && errors.length > 0) {
        isInvalid = true;
      }
    }
    return isInvalid;
  }

  onChangeAppConfig() {
    const configString = this.appConfigTmp;
    this.configSettingInvalid = this.isConfigSettingInvalid(configString);
    setTimeout(() => {
      this.appConfigNew = configString;
      if (this.newCodeMirrorEditor) {
        this.newCodeMirrorEditor.setValue(configString);
      }
    });
  }

  async editAppConfig() {
    this.loadingData = true;
    this.errorMessagePart = '';
    try {
      await this.kommonitorConfigStorageService.postAppConfig(this.appConfigTmp).toPromise();
      this.kommonitorConfigStorageService.getAppConfig().subscribe({
        next: (newCurrentConfig: string) => {
          this.appConfigCurrent = newCurrentConfig;
          if (this.currentCodeMirrorEditor) {
            this.currentCodeMirrorEditor.setValue(newCurrentConfig);
          }
          $("#appConfigEditSuccessAlert").show();
          this.loadingData = false;
        },
        error: (error: any) => {
          if (error.data) {
            this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error.data);
          } else {
            this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error);
          }
          $("#appConfigEditErrorAlert").show();
          this.loadingData = false;
        }
      });
    } catch (error: any) {
      if (error.data) {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
      $("#appConfigEditErrorAlert").show();
      this.loadingData = false;
    }
  }

  hideSuccessAlert() {
    $("#appConfigEditSuccessAlert").hide();
  }

  hideErrorAlert() {
    $("#appConfigEditErrorAlert").hide();
  }
}

// Downgrade the component
angular.module('adminAppConfig')
  .directive('adminAppConfigNew',
    downgradeComponent({ component: AdminAppConfigComponent }) as angular.IDirectiveFactory
  ); 