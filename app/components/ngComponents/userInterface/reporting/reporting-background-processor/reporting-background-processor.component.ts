import { Component, inject } from '@angular/core';
import { ReportGenerationProgressService } from 'services/report-generation-progress-service/report-generation-progress.service';

@Component({
  selector: 'app-reporting-background-processor',
  standalone: true,
  templateUrl: './reporting-background-processor.component.html',
  imports: [],
})
export class ReportingBackgroundProcessorComponent {
  protected reportGenerationProgressService = inject(ReportGenerationProgressService);

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
