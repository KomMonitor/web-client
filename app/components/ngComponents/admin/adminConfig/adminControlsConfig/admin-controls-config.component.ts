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
  selector: 'admin-controls-config-new',
  templateUrl: './admin-controls-config.component.html',
  styleUrls: ['./admin-controls-config.component.css']
})
export class AdminControlsConfigComponent implements OnInit, AfterViewInit {
  @ViewChild('controlsConfigEditor') controlsConfigEditor!: ElementRef;

  loadingData = true;
  codeMirrorEditor!: CodeMirrorEditor;
  templateCodeMirrorEditor!: CodeMirrorEditor;
  currentCodeMirrorEditor!: CodeMirrorEditor;
  newCodeMirrorEditor!: CodeMirrorEditor;
  missingRequiredParameters: string[] = [];
  missingRequiredParameters_string = '';
  keywordsInConfig = ["id", "groups", "indicatorConfig", "poi", "dataImport", "filter", 
    "measureOfValueClassification", "balance", "diagrams", "radarDiagram", "regressionDiagram", 
    "reachability", "processing", "indicatorLegendExportButtons", "reportingButton", "diagramExportButtons",
    "georesourceExportButtons"];
  controlsConfigTemplate: string = '';
  controlsConfigTmp: string = '';
  controlsConfigCurrent: string = '';
  controlsConfigNew: string = '';
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
    // Initialize CodeMirror editors
    this.initCodeEditor();
  }

  async init() {
    try {
      if (!this.kommonitorScriptHelperService) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await firstValueFrom(this.http.get('./config/controls-config_backup_forAdminViewExplanation.txt', { responseType: 'text' }));
      if (typeof response === 'string') {
        this.controlsConfigTemplate = response;
        if (this.kommonitorScriptHelperService) {
          this.kommonitorScriptHelperService.prettifyScriptCodePreview("controlsConfig_backupTemplate");
        }

        // set in app.js
        this.controlsConfigTmp = JSON.stringify((window as any).__env.controlsConfig, null, "    ");
        this.controlsConfigCurrent = JSON.stringify((window as any).__env.controlsConfig, null, "    ");
        this.controlsConfigNew = JSON.stringify((window as any).__env.controlsConfig, null, "    ");
        if (this.kommonitorScriptHelperService) {
          this.kommonitorScriptHelperService.prettifyScriptCodePreview("controlsConfig_current");
        }
        this.onChangeControlsConfig();
      }
    } catch (error) {
      console.error('Error initializing controls config:', error);
      if (error instanceof HttpErrorResponse) {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error.error);
      } else {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
      $("#controlsConfigEditErrorAlert").show();
    } finally {
      this.loadingData = false;
    }
  }

  initCodeEditor() {
    const editorElement = document.getElementById("controlsConfigEditor");
    if (!editorElement) {
      console.error('Could not find controlsConfigEditor element');
      return;
    }

    // Initialize main editor
    this.codeMirrorEditor = CodeMirror.fromTextArea(editorElement, {
      lineNumbers: true,
      autoRefresh: true,
      mode: "application/json",
      gutters: ["CodeMirror-lint-markers"],
      lint: {
        "getAnnotations": this.validateCode.bind(this),
        "async": true
      }
    });
    this.codeMirrorEditor.setSize(null, 450);
    this.codeMirrorEditor.on('change', (cMirror: any) => {
      this.controlsConfigTmp = this.codeMirrorEditor.getValue();
    });
    this.codeMirrorEditor.setValue(this.controlsConfigCurrent);

    // Initialize template editor
    const templateElement = document.getElementById("templateCodeMirror");
    if (templateElement) {
      this.templateCodeMirrorEditor = CodeMirror(templateElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: "application/json",
        readOnly: true,
        theme: "panda-syntax",
        lineWrapping: true
      });
      this.templateCodeMirrorEditor.setSize(null, 450);
      this.templateCodeMirrorEditor.setValue(this.controlsConfigTemplate);
    }

    // Initialize current editor
    const currentElement = document.getElementById("currentCodeMirror");
    if (currentElement) {
      this.currentCodeMirrorEditor = CodeMirror(currentElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: "application/json",
        readOnly: true,
        theme: "panda-syntax",
        lineWrapping: true
      });
      this.currentCodeMirrorEditor.setSize(null, 450);
      this.currentCodeMirrorEditor.setValue(this.controlsConfigCurrent);
    }

    // Initialize new editor
    const newElement = document.getElementById("newCodeMirror");
    if (newElement) {
      this.newCodeMirrorEditor = CodeMirror(newElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: "application/json",
        readOnly: true,
        theme: "panda-syntax",
        lineWrapping: true
      });
      this.newCodeMirrorEditor.setSize(null, 450);
      this.newCodeMirrorEditor.setValue(this.controlsConfigNew);
    }
  }

  validateCode(cm: any, updateLinting: (issues: LintingIssue[]) => void, options: any) {
    try {
      this.lintingIssues = CodeMirror.lint.json(cm, options);
      updateLinting(this.lintingIssues);
    } catch (error) {
      console.error("Error while linting controls config json code. Error is: \n" + error);
    }
    this.onChangeControlsConfig();
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

  onChangeControlsConfig() {
    const configString = this.controlsConfigTmp;
    this.configSettingInvalid = this.isConfigSettingInvalid(configString);
    setTimeout(() => {
      this.controlsConfigNew = configString;
      if (this.newCodeMirrorEditor) {
        this.newCodeMirrorEditor.setValue(configString);
      }
    });
  }

  async editControlsConfig() {
    this.loadingData = true;
    this.errorMessagePart = '';
    try {
      await firstValueFrom(this.kommonitorConfigStorageService.postControlsConfig(this.controlsConfigTmp));
      // Call getControlsConfig which will update the service's controlsConfig property
      this.kommonitorConfigStorageService.getControlsConfig();
      // Use the updated controlsConfig from the service
      this.controlsConfigCurrent = JSON.stringify(this.kommonitorConfigStorageService.controlsConfig, null, "    ");
      if (this.currentCodeMirrorEditor) {
        this.currentCodeMirrorEditor.setValue(this.controlsConfigCurrent);
      }
      $("#controlsConfigEditSuccessAlert").show();
    } catch (error) {
      console.error('Error editing controls config:', error);
      if (error instanceof HttpErrorResponse) {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error.error);
      } else {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
      $("#controlsConfigEditErrorAlert").show();
    } finally {
      this.loadingData = false;
    }
  }

  hideSuccessAlert() {
    $("#controlsConfigEditSuccessAlert").hide();
  }

  hideErrorAlert() {
    $("#controlsConfigEditErrorAlert").hide();
  }
}

angular.module('kommonitorAdmin')
  .directive('adminControlsConfig',
    downgradeComponent({ component: AdminControlsConfigComponent })); 