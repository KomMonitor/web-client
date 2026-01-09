import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";
import { ExportItem } from "../models";

@Component({
  selector: "app-export-item-time-selection",
  templateUrl: "./export-item-time-selection.component.html",
  styleUrls: ["./export-item-time-selection.component.css"],
  imports: [NgbNavModule, CommonModule],
  standalone: true,
})
export class ExportItemTimeSelectionComponent implements OnInit {
  start: any;
  end: any;

  @Input({ required: true })
  public exportItem!: ExportItem;

  active = 2;

  constructor() {}

  ngOnInit() {}

  updateRangeStart($event: Event) {
    debugger;
  }

  updateRangeEnd($event: Event) {
    debugger;
  }
}
