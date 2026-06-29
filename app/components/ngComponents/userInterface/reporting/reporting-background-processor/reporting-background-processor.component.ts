import { Component } from '@angular/core';
import { ReportingService } from 'services/reporting-service/reporting.service';

@Component({
  selector: 'app-reporting-background-processor',
  standalone: true,
  templateUrl: './reporting-background-processor.component.html',
  imports: [],
})
export class ReportingBackgroundProcessorComponent {
  constructor(protected reportingService: ReportingService) {}

  getElementStyle(pageElement: any): string {
    const dims = pageElement.dimensions;
    const border = pageElement.type.includes('footerHorizontalSpacer-')
      ? pageElement.css || ''
      : 'border: dashed gray 1px;';
    const zIndex = pageElement.type === 'map' ? 20 : 1;
    return (
      `position: absolute; top: ${dims.top}; left: ${dims.left}; ` +
      `width: ${dims.width}; height: ${dims.height}; ${border} z-index: ${zIndex};`
    );
  }
}
