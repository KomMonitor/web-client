import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-script-step-introduction',
  templateUrl: './script-step-introduction.component.html',
  styleUrls: ['./script-step-introduction.component.scss'],
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptStepIntroductionComponent {}
