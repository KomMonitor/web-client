import { Component, AfterViewInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DataExchangeService } from '../../../../../services/data-exchange-service/data-exchange.service';
import { ConfigStorageService, LandingpageConfig } from '../../../../../services/config-storage-service/config-storage.service';
import { firstValueFrom } from 'rxjs';
import * as CodeMirror from 'codemirror';

// CodeMirror module is not loaded properly (why?!), reload necessary files 
import 'codemirror/mode/xml/xml.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';

// import 'codemirror/addon/display/autoRefresh.js';

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
  selector: 'app-admin-landingpage-config',
  templateUrl: './admin-landingpage-config.component.html',
  styleUrls: ['./admin-landingpage-config.component.css']
})
export class AdminLandingpageConfigComponent implements AfterViewInit { 

  loadingData = true;
  codeMirrorEditor!: CodeMirrorEditor;
  templateCodeMirrorEditor!: CodeMirrorEditor;
  currentCodeMirrorEditor!: CodeMirrorEditor;
  newCodeMirrorEditor!: CodeMirrorEditor;
 
  appConfigTmp: string = '';
  appConfigCurrent: string = '';
  appConfigNew: string = '';
  errorMessagePart: string = '';
  
  customTabTitle = window.__env.customLandinPageTitle;
  tab1Title = window.__env.standardInfoModalTabTitle

  configLoaded = false;

  constructor(
    private http: HttpClient,
    private kommonitorConfigStorageService: ConfigStorageService,
    private ajskommonitorDataExchangeService: DataExchangeService
  ) {}


  ngOnInit() {
  }

  ngAfterViewInit() {
    this.init();
  }

  async init() {

    try {
      await this.kommonitorConfigStorageService.getLandingpageConfig().subscribe({
        next: response => {
          this.appConfigCurrent = response;
          this.appConfigNew = response;
          
          this.initCodeEditor();
          this.onChangeAppConfig();
        },
        error: error => {
          console.error('Default landingpageConfig not set, reverting to template');
        }
      });
    } catch (error) {
      console.error('Error initializing landing page config:', error);
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

    const editorElement = document.getElementById("appLandingpageEditor");
    if (!editorElement) {
      console.error('Could not find appLandingpageEditor element');
      return;
    }

    // Initialize main editor
    this.codeMirrorEditor = CodeMirror.fromTextArea(editorElement, {
      lineNumbers: true,
      autoRefresh: true,
      mode: 'htmlmixed'
    });
    this.codeMirrorEditor.setSize(null, 450);
    this.codeMirrorEditor.on('change', (cMirror: any) => {
      this.appConfigTmp = this.codeMirrorEditor.getValue();
      this.onChangeAppConfig();
    });
    this.codeMirrorEditor.setValue(this.appConfigCurrent);
    
  }

  onChangeAppConfig() {
    const configString = this.appConfigTmp;
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

      const config: LandingpageConfig = {
        startPage: JSON.stringify(this.appConfigTmp),
        pageName: ''
      }

      await this.kommonitorConfigStorageService.postLandingpageConfig(config).toPromise();
      this.kommonitorConfigStorageService.getLandingpageConfig().subscribe({
        next: (newCurrentConfig: string) => {
          this.appConfigCurrent = newCurrentConfig;
          if (this.currentCodeMirrorEditor) {
            this.currentCodeMirrorEditor.setValue(newCurrentConfig);
          }
          $("#appLandingpageConfigEditSuccessAlert").show();
          this.loadingData = false;
        },
        error: (error: any) => {
          if (error.data) {
            this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error.data);
          } else {
            this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error);
          }
          $("#appLandingpageConfigEditErrorAlert").show();
          this.loadingData = false; 
        }
      }
     );
    } catch (error: any) {
      if (error.data) {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
      $("#appLandingpageConfigEditErrorAlert").show();
      this.loadingData = false;
    }
  }

  hideSuccessAlert() {
    $("#appLandingpageConfigEditSuccessAlert").hide();
  }

  hideErrorAlert() {
    $("#appLandingpageConfigEditErrorAlert").hide();
  }
}
