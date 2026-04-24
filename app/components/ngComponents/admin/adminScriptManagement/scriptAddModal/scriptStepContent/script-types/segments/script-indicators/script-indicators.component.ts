import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ScriptHelperService } from "services/script-helper-service/script-helper.service";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { ExpandableBoxComponent } from "components/ngComponents/common/expandable-box/expandable-box.component";
import { FilterableSelectComponent } from "components/ngComponents/common/filterableSelect/filterable-select.component";
import { IndicatorsDataset } from "../../../../../../../models/indicators.models";

@Component({
  selector: "app-script-indicators",
  templateUrl: "./script-indicators.component.html",
  styleUrls: ["./script-indicators.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ExpandableBoxComponent,
    FilterableSelectComponent,
  ],
})
export class ScriptIndicatorsComponent {
  selectedIndicator: IndicatorsDataset | undefined = undefined;

  constructor(
    protected scriptHelperService: ScriptHelperService,
    protected dataExchangeService: DataExchangeService,
  ) {}

  onChangeIndicator($event: IndicatorsDataset) {
    this.selectedIndicator = $event;
  }
}
