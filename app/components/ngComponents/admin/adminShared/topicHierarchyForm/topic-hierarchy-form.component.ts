import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FormErrorComponent } from '../formError/form-error.component';
import {
  TopicHierarchyFormGroup,
  TopicLevelKey,
  TopicNode,
  topicOptionsFor,
} from './topic-hierarchy-form.model';

/**
 * The four dependent topic selects shared by the georesource add modal, the WMS
 * modals and the indicator wizard. Like `<app-resource-metadata-form>` the
 * typed FormGroup is owned by the host, so its values survive stepper
 * navigation that destroys this component.
 */
@Component({
  selector: 'app-topic-hierarchy-form',
  standalone: true,
  imports: [TranslateModule, ReactiveFormsModule, FormErrorComponent],
  templateUrl: './topic-hierarchy-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicHierarchyFormComponent {
  @Input({ required: true }) form!: TopicHierarchyFormGroup;
  /**
   * Root topics. Must be the same array instance the host resolved its chain
   * from, so the `[ngValue]` object identity of the options holds.
   */
  @Input() availableTopics: TopicNode[] = [];
  /** Prefix for the generated field ids, e.g. `gr-topics`. */
  @Input() idPrefix = 'topics';

  optionsFor(level: TopicLevelKey): readonly TopicNode[] {
    return topicOptionsFor(this.form, level, this.availableTopics);
  }

  hasOptions(level: TopicLevelKey): boolean {
    return this.optionsFor(level).length > 0;
  }
}
