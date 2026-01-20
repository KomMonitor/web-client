import { Component, Input, OnInit } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

@Component({
  selector: "small-box",
  templateUrl: "./small-box.component.html",
  styleUrls: ["./small-box.component.scss"],
  imports: [BrowserModule],
  standalone: true,
})
export class SmallBoxComponent {
  @Input({ required: true }) titleText!: string;
  @Input() descriptionText: string = "";
  @Input() boxColor: string = "#fff";
  @Input() textColor: string = "#000";
  @Input() iconClass: string | undefined;
}
