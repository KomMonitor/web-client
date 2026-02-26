import { Component, TemplateRef } from "@angular/core";
import { NotificationService } from "./notification.service";
import { NgbToastModule } from "@ng-bootstrap/ng-bootstrap";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-notification",
  templateUrl: "./notification.component.html",
  styleUrls: ["./notification.component.css"],
  imports: [NgbToastModule, CommonModule],
  standalone: true,
})
export class NotificationComponent {
  constructor(public notificationService: NotificationService) {}

  isTemplate(textOrTemplate: string | TemplateRef<any>): boolean {
    return textOrTemplate instanceof TemplateRef;
  }
}
