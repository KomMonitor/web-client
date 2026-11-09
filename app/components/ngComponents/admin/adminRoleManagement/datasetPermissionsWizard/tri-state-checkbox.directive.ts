import { Directive, input } from '@angular/core';

import { TriState } from './dataset-permissions.model';

/**
 * A checkbox standing for many: checked when all are set, indeterminate when
 * some are, clear when none are. `indeterminate` exists only as a DOM
 * property, so it cannot be bound from a template without this.
 *
 * The host's `(change)` decides what a click does; the state then flows back
 * in. Disable the box where a click cannot change the state (nothing to
 * select), or its DOM value drifts from the bound one.
 *
 * ```html
 * <input type="checkbox" [appTriState]="state" (change)="toggle()" />
 * ```
 */
@Directive({
  selector: 'input[type=checkbox][appTriState]',
  standalone: true,
  host: {
    '[checked]': "appTriState() === 'all'",
    '[indeterminate]': "appTriState() === 'some'",
  },
})
export class TriStateCheckboxDirective {
  readonly appTriState = input.required<TriState>();
}
