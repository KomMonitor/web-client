import { Component, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ScriptHelperService } from "services/script-helper-service/script-helper.service";
import { ExpandableBoxComponent } from "components/ngComponents/common/expandable-box/expandable-box.component";
import CodeMirror from "codemirror";
import "codemirror/mode/javascript/javascript.js";

@Component({
  selector: "app-script-code",
  templateUrl: "./script-code.component.html",
  styleUrls: ["./script-code.component.scss"],
  standalone: true,
  imports: [CommonModule, ExpandableBoxComponent],
})
export class ScriptCodeComponent {
  @ViewChild("scriptCodeMirrorContainer")
  scriptCodeMirrorContainerEl?: ElementRef<HTMLElement>;

  rawScriptCode: string = "";
  indicatorScriptCodeImportError: string = "";
  showScriptCodeErrorAlert: boolean = false;

  private codeMirrorEditor: any = null;

  private readonly SCRIPT_KEYWORDS = [
    "KmHelper",
    "computeIndicator",
    "aggregateIndicator",
    "module.exports.computeIndicator",
  ];

  constructor(private scriptHelperService: ScriptHelperService) {}

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
        this.indicatorScriptCodeImportError =
          "Uploaded Script Code File is null or does not follow script template.";
        this.showScriptCodeErrorAlert = true;
        return;
      }

      this.scriptHelperService.prettifyScriptCodePreview(result);
      this.rawScriptCode = result;

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
      this.codeMirrorEditor = (CodeMirror as any)(
        this.scriptCodeMirrorContainerEl.nativeElement,
        {
          value: code,
          mode: "javascript",
          lineNumbers: true,
          readOnly: true,
          theme: "panda-syntax",
          lineWrapping: false,
        },
      );
      this.codeMirrorEditor.setSize(null, 450);
    }
  }

  hideScriptCodeErrorAlert(): void {
    this.showScriptCodeErrorAlert = false;
  }
}
