import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { NgbCollapseModule } from "@ng-bootstrap/ng-bootstrap";

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

  constructor() {}

  ngOnInit() {}
}
