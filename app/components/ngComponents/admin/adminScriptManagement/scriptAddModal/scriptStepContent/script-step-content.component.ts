import { Component, EventEmitter, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ScriptHelperService,
  ScriptSelectItem,
} from "services/script-helper-service/script-helper.service";
import { ScriptDefinitionWrapperComponent } from "./script-definition-wrapper/script-definition-wrapper.component";
import { FilterableSelectComponent } from "../../../../common/filterableSelect/filterable-select.component";
import { ScriptGenericComponent } from "./script-types/script-generic/script-generic.component";

@Component({
  selector: "app-script-step-content",
  templateUrl: "./script-step-content.component.html",
  styleUrls: ["./script-step-content.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    ScriptDefinitionWrapperComponent,
    ScriptGenericComponent,
    FilterableSelectComponent,
  ],
  standalone: true,
})
export class ScriptStepContentComponent {
  @Output() allValid: EventEmitter<boolean> = new EventEmitter<boolean>();

  protected selectedScriptType: ScriptSelectItem | undefined = undefined;

  protected scriptTypeOptions: ScriptSelectItem[] =
    this.scriptHelperService.availableScriptTypeOptions;

  constructor(protected scriptHelperService: ScriptHelperService) {}

  // TODO: remove later?
  reset(): void {
    this.selectedScriptType = undefined;
  }

  onChangeScriptType(item: ScriptSelectItem): void {
    this.selectedScriptType = item;
  }
}
