import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { NgbCollapseModule } from "@ng-bootstrap/ng-bootstrap";

export type ExpanableBoxBorderColor = "primary" | "red" | "green" | "cyan";

@Component({
  selector: "expandable-box",
  templateUrl: "./expandable-box.component.html",
  styleUrls: ["./expandable-box.component.scss"],
  imports: [CommonModule, NgbCollapseModule],
  standalone: true,
})
export class ExpandableBoxComponent implements OnInit {
  @Input({ required: true }) title!: string;
  @Input() collapsed: boolean = true;
  @Input() borderColor: ExpanableBoxBorderColor = "primary";
  @Input() isCollapsible: boolean = true;

  constructor() {}

  ngOnInit() {
    if (this.isCollapsible === false) {
      this.collapsed = false;
    }
  }

  onCollapseToggle() {
    if (this.isCollapsible) {
      this.collapsed = !this.collapsed;
    }
  }
}
