import { Component, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { ScriptHelperService } from "services/script-helper-service/script-helper.service";
import { ScriptDefinitionWrapperComponent } from "./script-definition-wrapper/script-definition-wrapper.component";

@Component({
  selector: "app-script-step-content",
  templateUrl: "./script-step-content.component.html",
  styleUrls: ["./script-step-content.component.css"],
  imports: [CommonModule, FormsModule, ScriptDefinitionWrapperComponent],
  standalone: true,
})
export class ScriptStepContentComponent implements OnInit {
  // Script type selection & filter
  selectedScriptType: any = null;
  scriptNameFilter: string = "";

  // Parameters (generic type)
  parameterName_tmp: string = "";
  parameterDescription_tmp: string = "";
  parameterDefaultValue_tmp: any = undefined;
  parameterNumericMinValue_tmp: number = 0;
  parameterNumericMaxValue_tmp: number = 1;
  parameterDataType_tmp: any = null;

  constructor(
    public scriptHelperService: ScriptHelperService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.parameterDataType_tmp =
      this.scriptHelperService.availableScriptDataTypes[0];
  }

  reset(): void {
    this.selectedScriptType = null;
    this.scriptNameFilter = "";
    this.parameterDataType_tmp =
      this.scriptHelperService.availableScriptDataTypes[0];
  }

  getFilteredScriptTypes(): any[] {
    const types = this.scriptHelperService.availableScriptTypeOptions || [];
    if (!this.scriptNameFilter) return types;
    const filter = this.scriptNameFilter.toLowerCase();
    return types.filter((t: any) =>
      t.displayName?.toLowerCase().includes(filter),
    );
  }

  onChangeScriptType(): void {
  }

}
