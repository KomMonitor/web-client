import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';

import { ScriptHelperService } from 'services/script-helper-service/script-helper.service';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript.js';

import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-script-code',
  templateUrl: './script-code.component.html',
  styleUrls: ['./script-code.component.scss'],
  standalone: true,
  imports: [TranslateModule, ExpandableBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptCodeComponent {
  private scriptHelperService = inject(ScriptHelperService);

  @ViewChild('scriptCodeMirrorContainer')
  scriptCodeMirrorContainerEl?: ElementRef<HTMLElement>;

  // Signals: written from the async FileReader callback (OnPush). Setting
  // rawScriptCode must also re-render before the CodeMirror init timeout runs,
  // so the @if container element exists in the DOM.
  rawScriptCode = signal('');
  indicatorScriptCodeImportError = signal('');
  showScriptCodeErrorAlert = signal(false);

  private codeMirrorEditor: any = null;

  private readonly SCRIPT_KEYWORDS = [
    'KmHelper',
    'computeIndicator',
    'aggregateIndicator',
    'module.exports.computeIndicator',
  ];

  onScriptCodeFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.parseScriptCodeFromFile(input.files[0]);
  }

  private fileStringIncludesScriptKeywords(content: string): boolean {
    return this.SCRIPT_KEYWORDS.every((keyword) => content.includes(keyword));
  }

  private parseScriptCodeFromFile(file: File): void {
    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result || !this.fileStringIncludesScriptKeywords(result)) {
        this.indicatorScriptCodeImportError.set(
          'Uploaded Script Code File is null or does not follow script template.'
        );
        this.showScriptCodeErrorAlert.set(true);
        return;
      }

      this.scriptHelperService.prettifyScriptCodePreview(result);
      this.rawScriptCode.set(result);

      // Nach Angular Change Detection warten, damit das *ngIf-Element im DOM erscheint
      setTimeout(() => this.initOrUpdateCodeMirror(result), 0);
    };
    fileReader.readAsText(file);
  }

  private initOrUpdateCodeMirror(code: string): void {
    if (!this.scriptCodeMirrorContainerEl?.nativeElement) return;

    if (this.codeMirrorEditor) {
      this.codeMirrorEditor.setValue(code);
    } else {
      this.codeMirrorEditor = (CodeMirror as any)(this.scriptCodeMirrorContainerEl.nativeElement, {
        value: code,
        mode: 'javascript',
        lineNumbers: true,
        readOnly: true,
        theme: 'panda-syntax',
        lineWrapping: false,
      });
      this.codeMirrorEditor.setSize(null, 450);
    }
  }

  hideScriptCodeErrorAlert(): void {
    this.showScriptCodeErrorAlert.set(false);
  }
}
