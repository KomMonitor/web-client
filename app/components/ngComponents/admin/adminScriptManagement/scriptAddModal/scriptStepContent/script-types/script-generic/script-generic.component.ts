import { Component, OnInit, inject } from '@angular/core';
import { ScriptHelperService } from 'services/script-helper-service/script-helper.service';

import { ScriptIndicatorsComponent } from '../segments/script-indicators/script-indicators.component';
import { ScriptGeoresourcesComponent } from '../segments/script-georesources/script-georesources.component';
import { ScriptParametersComponent } from '../segments/script-parameters/script-parameters.component';
import { ScriptCodeComponent } from '../segments/script-code/script-code.component';

@Component({
  selector: 'app-script-generic',
  templateUrl: './script-generic.component.html',
  standalone: true,
  imports: [
    ScriptIndicatorsComponent,
    ScriptGeoresourcesComponent,
    ScriptParametersComponent,
    ScriptCodeComponent,
  ],
})
export class ScriptGenericComponent implements OnInit {
  private scriptHelperService = inject(ScriptHelperService);

  ngOnInit(): void {
    this.scriptHelperService.reset();
  }
}
