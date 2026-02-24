import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
  selector: "app-loading-overlay",
  templateUrl: "./loading-overlay.component.html",
  styleUrls: ["./loading-overlay.component.css"],
  imports: [CommonModule],
  standalone: true,
})
export class LoadingOverlayComponent {
  @Input() loading: boolean = false;
  @Input() message?: string;
}
