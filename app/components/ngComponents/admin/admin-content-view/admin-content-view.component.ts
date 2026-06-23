import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-admin-content-view',
  templateUrl: './admin-content-view.component.html',
  styleUrls: ['./admin-content-view.component.scss'],
  imports: [CommonModule],
  standalone: true,
})
export class AdminContentViewComponent {
  @Input({ required: true }) title!: string;
  @Input() description: string | undefined;

  @Input({ required: true }) contentTemplate!: TemplateRef<any>;
  @Input() controlsTemplate: TemplateRef<any> | undefined;
}
