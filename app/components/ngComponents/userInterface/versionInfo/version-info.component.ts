import { Component } from '@angular/core';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';

@Component({
  selector: 'versionInfo',
  templateUrl: './version-info.component.html',
  styleUrls: ['./version-info.component.scss'],
  imports: [ExpandableBoxComponent],
  standalone: true,
})
export class VersionInfoComponent {}
