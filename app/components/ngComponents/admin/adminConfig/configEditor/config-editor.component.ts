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

import { AdminContentViewComponent } from '../../admin-content-view/admin-content-view.component';
import { ExpandableBoxComponent } from '../../../common/expandable-box/expandable-box.component';
import { NotificationService } from '../../../common/notification/notification.service';
import { CodeMirrorEditor, ConfigEditorDescriptor, LintingIssue } from './config-editor.model';

/**
 * The shared editor page behind /administration's app-config and controls-config
 * routes: a read-only template pane, a read-only "currently active" pane, the
 * editable config and a preview of the pending value.
 *
 * Both routes used to be copy-paste twins (~330 lines of TS and an 86-line
 * template each) that differed only in the CodeMirror mode, the linter, the
 * required-keyword list, the i18n prefix and where the config is read from and
 * written to. All of that is now a `ConfigEditorDescriptor` the route supplies.
 */
@Component({
  selector: 'app-config-editor',
  templateUrl: './config-editor.component.html',
  styleUrls: ['./config-editor.component.scss'],
  imports: [TranslateModule, ExpandableBoxComponent, AdminContentViewComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigEditorComponent implements OnInit, AfterViewInit {
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  @Input({ required: true }) descriptor!: ConfigEditorDescriptor;

  // These live in an <ng-template> that admin-content-view renders through an
  // outlet, so they resolve only after the first change detection — never with
  // { static: true }. ngAfterViewInit is therefore the earliest safe point.
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

  private async loadConfigData(): Promise<void> {
    try {
      this.configTemplate = await this.descriptor.loadTemplate();
      const current = await this.descriptor.loadCurrent();
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
    this.codeMirrorEditor.setValue(this.configCurrent);

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
      this.configCurrent = await this.descriptor.save(this.configTmp);
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
