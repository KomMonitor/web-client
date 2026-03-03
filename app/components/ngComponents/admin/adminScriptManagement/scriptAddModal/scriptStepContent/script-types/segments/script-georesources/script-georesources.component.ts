import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ScriptHelperService } from "services/script-helper-service/script-helper.service";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { ExpandableBoxComponent } from "components/ngComponents/common/expandable-box/expandable-box.component";
import { FilterableSelectComponent } from "components/ngComponents/common/filterableSelect/filterable-select.component";
import { GeoresourcesDataset } from "../../../../../../../models/georesources.models";

@Component({
  selector: "app-script-georesources",
  templateUrl: "./script-georesources.component.html",
  styleUrls: ["./script-georesources.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ExpandableBoxComponent,
    FilterableSelectComponent,
  ],
})
export class ScriptGeoresourcesComponent {
  selectedGeoresource: GeoresourcesDataset | undefined = undefined;

  constructor(
    protected scriptHelperService: ScriptHelperService,
    protected dataExchangeService: DataExchangeService,
  ) {}

  onChangeGeoressource($event: GeoresourcesDataset) {
    this.selectedGeoresource = $event;
  }
}
