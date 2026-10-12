import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

/** One tenant as the panel lists it: its name and how many items it owns. */
export interface MandantOption {
  readonly name: string;
  readonly count: number;
}

/**
 * What the panel counts: the page decides, the panel only picks the wording.
 * Each noun has its own block of texts under `ADMIN_SHARED.MANDANT_PANEL`.
 */
export type MandantPanelNoun = 'HIERARCHY' | 'SPATIAL_UNIT';

const KEYS = 'ADMIN_SHARED.MANDANT_PANEL';

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
 * Toolbar above an admin list: it says which tenant's items are on screen, how
 * many there are, and switches to another tenant — or to the overview across
 * all of them, which is a platform administrator's view.
 *
 * Only a switcher, it holds no state: the selected tenant is bound two-way and
 * the page filters its list from it. What the items are — hierarchies, spatial
 * units — only changes the wording, chosen through `noun`.
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
   * How many items the list below currently shows. Passed in rather than
   * summed up here, so the toolbar can never state a number the list does not.
   */
  readonly count = input(0);
  /** What the page lists, which picks the wording of the counts. */
  readonly noun = input.required<MandantPanelNoun>();

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
    const plural = this.count() === 1 ? '_ONE' : '';
    return `${KEYS}.${this.noun()}.${scope}${plural}`;
  });

  protected readonly summaryParams = computed(() => ({
    count: this.count(),
    mandants: this.mandants().length,
  }));

  /** The one tenant a user without the switcher works in. */
  protected readonly onlyOption = computed(() => this.mandants()[0] ?? null);

  /** The count next to a tenant in the menu, singular included. */
  protected itemCountKey(option: MandantOption): string {
    const plural = option.count === 1 ? '_ONE' : '';
    return `${KEYS}.${this.noun()}.ITEM_COUNT${plural}`;
  }

  protected select(name: string): void {
    this.selected.set(name);
  }
}
