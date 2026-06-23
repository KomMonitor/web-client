import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";
import { ExportItem, sortTimestamps } from "../models";

@Component({
  selector: "app-export-item-time-selection",
  templateUrl: "./export-item-time-selection.component.html",
  styleUrls: ["./export-item-time-selection.component.scss"],
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

  get sortedTimestamps(): string[] {
    return sortTimestamps(this.exportItem.dataset.availableTimestamps, "asc");
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

  get filteredStartTimestamps(): string[] {
    const end = this.rangeEnd;
    return end
      ? this.sortedTimestamps.filter((ts) => ts <= end)
      : this.sortedTimestamps;
  }

  get filteredEndTimestamps(): string[] {
    const start = this.rangeStart;
    return start
      ? this.sortedTimestamps.filter((ts) => ts >= start)
      : this.sortedTimestamps;
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
    const validEnd = end && value && value > end ? "" : end;
    this.exportItem.selectedTargetTime = { mode: "range", start: value, end: validEnd };
  }

  updateRangeEnd($event: Event) {
    const value = ($event.target as HTMLSelectElement).value;
    const current = this.exportItem.selectedTargetTime;
    const start = current?.mode === "range" ? current.start : "";
    this.exportItem.selectedTargetTime = { mode: "range", start, end: value };
  }

  setEarliestStart() {
    const timestamps = this.sortedTimestamps;
    if (!timestamps.length) return;
    const current = this.exportItem.selectedTargetTime;
    const end = current?.mode === "range" ? current.end : "";
    this.exportItem.selectedTargetTime = { mode: "range", start: timestamps[0], end };
  }

  setLatestEnd() {
    const timestamps = this.sortedTimestamps;
    if (!timestamps.length) return;
    const current = this.exportItem.selectedTargetTime;
    const start = current?.mode === "range" ? current.start : "";
    this.exportItem.selectedTargetTime = { mode: "range", start, end: timestamps[timestamps.length - 1] };
  }
}
