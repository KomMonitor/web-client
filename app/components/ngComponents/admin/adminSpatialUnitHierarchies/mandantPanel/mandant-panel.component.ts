import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

/** One tenant as the panel lists it: its name and how many hierarchies it owns. */
export interface MandantOption {
  readonly name: string;
  readonly hierarchyCount: number;
}

/**
 * The two letters a tenant's badge shows, as in the design draft: "Stadt Essen"
 * → ES, "Kreis Recklinghausen" → RE. The last word carries the name, the ones
 * before it only name the legal form.
 */
export function mandantInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words[words.length - 1] ?? '').slice(0, 2).toUpperCase();
}

/**
 * Toolbar above the hierarchy list: it says which tenant's hierarchies are on
 * screen, how many there are, and switches to another tenant — or to the
 * overview across all of them, which is a platform administrator's view.
 *
 * Only a switcher, it holds no state: the selected tenant is bound two-way and
 * the page filters its list from it.
 */
@Component({
  selector: 'app-mandant-panel',
  templateUrl: './mandant-panel.component.html',
  styleUrls: ['./mandant-panel.component.scss'],
  imports: [TranslateModule, NgbDropdownModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MandantPanelComponent {
  /** The tenants to choose from, in registry order. */
  readonly mandants = input.required<readonly MandantOption[]>();
  /**
   * Whether the tenant may be switched at all. With a single tenant and no
   * overview to jump to, the panel is a label rather than a dropdown.
   */
  readonly canSwitch = input(false);
  /** Two-way bindable via `[(selected)]`; the empty string is the overview. */
  readonly selected = model('');
  /**
   * How many hierarchies the list below currently shows. Passed in rather than
   * summed up here, so the toolbar can never state a number the list does not.
   */
  readonly hierarchyCount = input(0);

  protected readonly initials = mandantInitials;

  /** The chosen tenant, or null while the overview across all of them is on. */
  protected readonly selectedOption = computed(
    () => this.mandants().find((mandant) => mandant.name === this.selected()) ?? null
  );

  /**
   * The summary next to the picker. Four wordings — one tenant or all of them,
   * each singular or plural — are picked by key instead of by four template
   * branches.
   */
  protected readonly summaryKey = computed(() => {
    const scope = this.selected() ? 'COUNT' : 'COUNT_ALL';
    const plural = this.hierarchyCount() === 1 ? '_ONE' : '';
    return `ADMIN_SPATIAL_UNIT_HIERARCHIES.MANDANT_PANEL.${scope}${plural}`;
  });

  protected readonly summaryParams = computed(() => ({
    count: this.hierarchyCount(),
    mandants: this.mandants().length,
  }));

  /** The one tenant a user without the switcher works in. */
  protected readonly onlyOption = computed(() => this.mandants()[0] ?? null);

  protected select(name: string): void {
    this.selected.set(name);
  }
}
