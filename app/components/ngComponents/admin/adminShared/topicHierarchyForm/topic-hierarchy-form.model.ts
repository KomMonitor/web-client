import { AbstractControl, FormControl, FormGroup, ValidationErrors } from '@angular/forms';

/**
 * Shared four-level topic cascade used by the georesource add modal, both WMS
 * modals and the indicator wizard. Each control holds the selected topic
 * *object* (the selects bind with `[ngValue]`), and the group takes care of the
 * one rule the hand-written copies all missed: changing a level clears every
 * deeper level, so a stale deep selection can no longer win the reference
 * resolution.
 */

/** Structural subset of a topic node the cascade needs. */
export interface TopicNode {
  topicId: string;
  topicName: string;
  subTopics?: TopicNode[];
  [key: string]: unknown;
}

export const TOPIC_LEVEL_KEYS = ['mainTopic', 'subTopic', 'subsubTopic', 'subsubsubTopic'] as const;
export type TopicLevelKey = (typeof TOPIC_LEVEL_KEYS)[number];

export type TopicHierarchyFormGroup = FormGroup<{
  mainTopic: FormControl<TopicNode | null>;
  subTopic: FormControl<TopicNode | null>;
  subsubTopic: FormControl<TopicNode | null>;
  subsubsubTopic: FormControl<TopicNode | null>;
}>;

export interface TopicHierarchyFormOptions {
  /** Marks `mainTopic` as required (error key `topicRequired`). Default: true. */
  requireMainTopic?: boolean;
}

/**
 * Builds the cascade. The "clear the deeper levels" wiring lives here rather
 * than in the component so it is covered by the model spec and cannot be
 * forgotten by a host.
 */
export function buildTopicHierarchyForm(
  options: TopicHierarchyFormOptions = {}
): TopicHierarchyFormGroup {
  const requireMain = options.requireMainTopic ?? true;

  const form: TopicHierarchyFormGroup = new FormGroup({
    mainTopic: new FormControl<TopicNode | null>(null, requireMain ? [requiredTopicValidator] : []),
    subTopic: new FormControl<TopicNode | null>(null),
    subsubTopic: new FormControl<TopicNode | null>(null),
    subsubsubTopic: new FormControl<TopicNode | null>(null),
  });

  TOPIC_LEVEL_KEYS.forEach((key, index) => {
    const deeperKeys = TOPIC_LEVEL_KEYS.slice(index + 1);
    if (deeperKeys.length === 0) {
      return;
    }
    form.controls[key].valueChanges.subscribe(() => {
      // `emitEvent: false` keeps this from cascading level by level; every
      // deeper level is cleared in one go anyway.
      deeperKeys.forEach((deeperKey) => {
        if (form.controls[deeperKey].value !== null) {
          form.controls[deeperKey].setValue(null, { emitEvent: false });
        }
      });
    });
  });

  return form;
}

/** Required rule with its own error key, so the message reads as a topic hint. */
function requiredTopicValidator(control: AbstractControl): ValidationErrors | null {
  return control.value ? null : { topicRequired: true };
}

/**
 * Applies a resolved topic chain, as returned by
 * `TopicHierarchyService.getTopicHierarchyForTopicId()`. Resolution stays with
 * the host so this model needs no DI.
 */
export function patchTopicHierarchyFromChain(
  form: TopicHierarchyFormGroup,
  chain: readonly TopicNode[] | null | undefined
): void {
  const levels = chain ?? [];
  // Patch shallow-to-deep with events suppressed: an event on a higher level
  // would clear the deeper levels we are about to set.
  TOPIC_LEVEL_KEYS.forEach((key, index) => {
    form.controls[key].setValue(levels[index] ?? null, { emitEvent: false });
  });
  form.updateValueAndValidity();
}

/**
 * The deepest selected topic id — replaces the five-branch if/else the modals
 * each carried a copy of. Returns `''` when nothing is selected, matching the
 * historic POST bodies.
 */
export function topicHierarchyToApi(form: TopicHierarchyFormGroup): string {
  const value = form.getRawValue();
  for (const key of [...TOPIC_LEVEL_KEYS].reverse()) {
    const topic = value[key];
    if (topic) {
      return topic.topicId;
    }
  }
  return '';
}

/** Options to offer for one level: the children of the level above it. */
export function topicOptionsFor(
  form: TopicHierarchyFormGroup,
  level: TopicLevelKey,
  roots: readonly TopicNode[]
): readonly TopicNode[] {
  const index = TOPIC_LEVEL_KEYS.indexOf(level);
  if (index <= 0) {
    return roots ?? [];
  }
  return form.controls[TOPIC_LEVEL_KEYS[index - 1]].value?.subTopics ?? [];
}
