import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-script-definition-wrapper',
  templateUrl: './script-definition-wrapper.component.html',
  styleUrls: ['./script-definition-wrapper.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ScriptDefinitionWrapperComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) content!: TemplateRef<any>;
  @Input() description: string | undefined;

  @Output() validationResult = new EventEmitter<boolean>();

  validate(): boolean {
    const isValid = this.title.trim().length > 0;
    this.validationResult.emit(isValid);
    return isValid;
  }
}
