import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-script-step-introduction',
  templateUrl: './script-step-introduction.component.html',
  styleUrls: ['./script-step-introduction.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptStepIntroductionComponent {}
