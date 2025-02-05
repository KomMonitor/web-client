import { Component } from '@angular/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
NgbAccordionModule

@Component({
  selector: 'versionInfo',
  templateUrl: './version-info.component.html',
  styleUrls: ['./version-info.component.css'],
  imports: [NgbAccordionModule],
  standalone: true
})
export class VersionInfoComponent {

}
