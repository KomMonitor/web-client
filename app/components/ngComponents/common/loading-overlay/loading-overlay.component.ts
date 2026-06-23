import { CommonModule } from "@angular/common";
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";

@Component({
  selector: "app-loading-overlay",
  templateUrl: "./loading-overlay.component.html",
  styleUrls: ["./loading-overlay.component.css"],
  imports: [CommonModule],
  standalone: true,
})
export class LoadingOverlayComponent {
  @Input({ required: true }) loading!: boolean;
  @Input() message?: string;
}
