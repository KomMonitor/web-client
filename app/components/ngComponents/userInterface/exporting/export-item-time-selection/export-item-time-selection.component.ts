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
  @Input({ required: true })
  public exportItem!: ExportItem;

  active = 1;

  constructor() {}

  ngOnInit() {}

  onTabChange(tabId: number) {
    this.exportItem.selectedTargetTime = undefined;
  }

  get singleValue(): string {
    const t = this.exportItem.selectedTargetTime;
    return t?.mode === "point" ? t.value : "";
  }

  get rangeStart(): string {
    const t = this.exportItem.selectedTargetTime;
    return t?.mode === "range" ? t.start : "";
  }

  get rangeEnd(): string {
    const t = this.exportItem.selectedTargetTime;
    return t?.mode === "range" ? t.end : "";
  }

  updateSingleTimestamp($event: Event) {
    const value = ($event.target as HTMLSelectElement).value;
    this.exportItem.selectedTargetTime = value
      ? { mode: "point", value }
      : undefined;
  }

  updateRangeStart($event: Event) {
    const value = ($event.target as HTMLSelectElement).value;
    const current = this.exportItem.selectedTargetTime;
    const end = current?.mode === "range" ? current.end : "";
    this.exportItem.selectedTargetTime = { mode: "range", start: value, end };
  }

  updateRangeEnd($event: Event) {
    const value = ($event.target as HTMLSelectElement).value;
    const current = this.exportItem.selectedTargetTime;
    const start = current?.mode === "range" ? current.start : "";
    this.exportItem.selectedTargetTime = { mode: "range", start, end: value };
  }
}
