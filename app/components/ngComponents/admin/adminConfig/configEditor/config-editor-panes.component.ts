import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import CodeMirror from 'codemirror';

import 'codemirror/mode/css/css.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/xml/xml.js';

import { NotificationService } from '../../../common/notification/notification.service';
import { CodeMirrorEditor, ConfigEditorDescriptor, LintingIssue } from './config-editor.model';

/**
 * Coerce a descriptor's value into something CodeMirror accepts.
 *
 * `setValue()` throws on anything but a string, and the panes are built in one
 * sequence — so a single non-string would leave *all four* panes of the page
 * empty. Descriptors read from runtime config that is not guaranteed to be
 * populated, so an empty pane is the intended degradation here.
 */
function asEditorText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return value == null ? '' : String(value);
}

/**
 * The four editor panes every config page shares: a read-only template pane, a
 * read-only "currently active" pane, the editable config and a preview of the
 * pending value — plus the save button and the validation hints.
 *
 * The component is embedded by every page that edits a configuration — app
 * config, controls config and, below its overview grid, the filter config.
 * Each of them brings its own page frame and passes a `ConfigEditorDescriptor`
 * saying what to load, lint and save.
 */
@Component({
  selector: 'app-config-editor-panes',
  templateUrl: './config-editor-panes.component.html',
  styleUrls: ['./config-editor-panes.component.scss'],
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigEditorPanesComponent implements OnInit, AfterViewInit {
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  @Input({ required: true }) descriptor!: ConfigEditorDescriptor;

  // Hosts are resolved in ngAfterViewInit, never with { static: true }: the
  // embedding pages render this component inside an <ng-template> that
  // admin-content-view pulls through an outlet, so the view exists only after
  // the first change detection.
  @ViewChild('configEditor') configEditor!: ElementRef;
  @ViewChild('templateCodeMirror') templateCodeMirrorElement!: ElementRef;
  @ViewChild('currentCodeMirror') currentCodeMirrorElement!: ElementRef;
  @ViewChild('newCodeMirror') newCodeMirrorElement!: ElementRef;

  // Signals: written from awaits and CodeMirror lint callbacks, both outside
  // Angular's template-event path (OnPush).
  loadingData = signal(true);
  configSettingInvalid = signal(false);
  missingRequiredParameters = signal<string[]>([]);
  missingRequiredParameters_string = signal('');

  configTemplate = '';
  configTmp = '';
  configCurrent = '';
  configNew = '';

  private codeMirrorEditor!: CodeMirrorEditor;
  private templateCodeMirrorEditor!: CodeMirrorEditor;
  private currentCodeMirrorEditor!: CodeMirrorEditor;
  private newCodeMirrorEditor!: CodeMirrorEditor;

  private lintingIssues: LintingIssue[] = [];

  /** Set by setStoredConfig() before the editor exists; applied by initCodeEditor(). */
  private pendingStoredConfig: string | null = null;

  /** Resolves once template and current config are in `configTemplate`/`configCurrent`. */
  private dataReady!: Promise<void>;

  get i18n(): string {
    return this.descriptor.i18nPrefix;
  }

  ngOnInit(): void {
    // Start the fetch as early as possible; ngAfterViewInit awaits it below.
    this.dataReady = this.loadConfigData();
  }

  async ngAfterViewInit(): Promise<void> {
    // Awaiting here rather than polling for a `dataLoaded` flag: the view exists
    // by now, and the continuation runs in a microtask after this hook, so the
    // signal writes triggered by the initial setValue cannot land mid-check.
    await this.dataReady;
    this.initCodeEditor();
    this.onChangeConfig();
  }

  /**
   * Adopts `value` as the stored configuration: the editable pane and the
   * "current" pane both take it over.
   *
   * For pages that change the configuration outside this component —
   * adminFilterConfig deletes filters from its overview grid and writes the
   * result back to the config storage service.
   */
  setStoredConfig(value: string): void {
    const text = asEditorText(value);
    this.configTmp = text;
    this.configCurrent = text;

    if (!this.codeMirrorEditor) {
      this.pendingStoredConfig = text;
      return;
    }

    this.codeMirrorEditor.setValue(text);
    this.currentCodeMirrorEditor?.setValue(text);
    this.onChangeConfig();
  }

  private async loadConfigData(): Promise<void> {
    try {
      this.configTemplate = asEditorText(await this.descriptor.loadTemplate());
      const current = asEditorText(await this.descriptor.loadCurrent());
      this.configTmp = current;
      this.configCurrent = current;
      this.configNew = current;
    } catch (error: any) {
      this.showError('MSG.LOAD_FAILED', error);
    } finally {
      this.loadingData.set(false);
    }
  }

  private initCodeEditor(): void {
    if (!this.configEditor?.nativeElement) {
      console.error('Could not find the config editor textarea');
      return;
    }

    const mode = this.descriptor.mode;

    this.codeMirrorEditor = CodeMirror.fromTextArea(this.configEditor.nativeElement, {
      lineNumbers: true,
      autoRefresh: true,
      mode,
      // No theme on purpose: CodeMirror's light default sets the one editable
      // pane apart from the three dark read-only panes.
      lineWrapping: true,
      gutters: ['CodeMirror-lint-markers'],
      lint: {
        getAnnotations: this.validateCode.bind(this),
        async: true,
      },
    });
    this.codeMirrorEditor.setSize(null, 450);
    this.codeMirrorEditor.on('change', () => {
      this.configTmp = this.codeMirrorEditor.getValue();
      this.onChangeConfig();
    });
    this.codeMirrorEditor.setValue(this.pendingStoredConfig ?? this.configCurrent);
    this.pendingStoredConfig = null;

    this.templateCodeMirrorEditor = this.initReadOnlyPane(
      this.templateCodeMirrorElement,
      this.configTemplate
    );
    this.currentCodeMirrorEditor = this.initReadOnlyPane(
      this.currentCodeMirrorElement,
      this.configCurrent
    );
    this.newCodeMirrorEditor = this.initReadOnlyPane(this.newCodeMirrorElement, this.configNew);
  }

  /** One of the three read-only preview panes. */
  private initReadOnlyPane(host: ElementRef | undefined, value: string): CodeMirrorEditor {
    if (!host?.nativeElement) {
      return undefined as unknown as CodeMirrorEditor;
    }

    const editor: CodeMirrorEditor = CodeMirror(host.nativeElement, {
      lineNumbers: true,
      autoRefresh: true,
      mode: this.descriptor.mode,
      readOnly: true,
      theme: 'panda-syntax',
      lineWrapping: true,
    });
    editor.setSize(null, 450);
    editor.setValue(value);
    return editor;
  }

  validateCode(cm: any, updateLinting: (issues: LintingIssue[]) => void, options: any): void {
    try {
      this.lintingIssues = this.descriptor.lint(cm, options);
      updateLinting(this.lintingIssues);
    } catch (error) {
      console.error(
        `Error while linting the ${this.descriptor.formatLabel} config. Error is: \n${error}`
      );
    }
    this.onChangeConfig();
  }

  /** A config is invalid while a required keyword is missing or the linter errors. */
  isConfigSettingInvalid(configString: string): boolean {
    const missing = this.descriptor.requiredKeywords.filter(
      (keyword) => !configString.includes(keyword)
    );
    this.missingRequiredParameters.set(missing);
    this.missingRequiredParameters_string.set(JSON.stringify(missing));

    if (missing.length > 0) {
      return true;
    }

    return this.lintingIssues.some((issue) => issue.severity === 'error');
  }

  onChangeConfig(): void {
    const configString = this.configTmp;
    this.configSettingInvalid.set(this.isConfigSettingInvalid(configString));
    this.configNew = configString;
    this.newCodeMirrorEditor?.setValue(configString);
  }

  async saveConfig(): Promise<void> {
    this.loadingData.set(true);
    try {
      this.configCurrent = asEditorText(await this.descriptor.save(this.configTmp));
      this.currentCodeMirrorEditor?.setValue(this.configCurrent);
      this.notificationService.showSuccess(this.translate.instant(`${this.i18n}.MSG.SAVED`));
    } catch (error: any) {
      this.showError('MSG.SAVE_FAILED', error);
    } finally {
      this.loadingData.set(false);
    }
  }

  private showError(messageKey: string, error: any): void {
    console.error(`${this.i18n}.${messageKey}`, error);
    this.notificationService.showError(
      this.translate.instant(`${this.i18n}.${messageKey}`, {
        error:
          error?.error?.message ||
          error?.data ||
          error?.message ||
          this.translate.instant('ADMIN_SHARED.UNKNOWN_ERROR'),
      }),
      { autohide: false }
    );
  }
}
