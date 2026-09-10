import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { AdminFilterEditModalComponent, TopicTreeNode } from './admin-filter-edit-modal.component';

/** Builds a node with the flags defaulted, so tests only state what matters. */
function node(topicId: string, subTopics: TopicTreeNode[] = []): TopicTreeNode {
  return { topicId, subTopics, level: 0, selected: false, disabled: false, expanded: false };
}

/**
 *   root
 *   ├── childA
 *   │   └── grandchild
 *   └── childB
 */
function buildTree(): { tree: TopicTreeNode[]; find: (id: string) => TopicTreeNode } {
  const grandchild = node('grandchild');
  const childA = node('childA', [grandchild]);
  const childB = node('childB');
  const root = node('root', [childA, childB]);
  const byId = new Map([
    ['root', root],
    ['childA', childA],
    ['childB', childB],
    ['grandchild', grandchild],
  ]);
  return { tree: [root], find: (id) => byId.get(id)! };
}

describe('AdminFilterEditModalComponent', () => {
  let component: AdminFilterEditModalComponent;
  let fixture: ComponentFixture<AdminFilterEditModalComponent>;
  let storedConfig: any[];
  let postedConfig: string | undefined;
  let configStorageStub: Partial<ConfigStorageService>;

  beforeEach(() => {
    storedConfig = [];
    postedConfig = undefined;
    configStorageStub = {
      getFilterConfig: () => of(storedConfig),
      postFilterConfig: (jsonString: string) => {
        postedConfig = jsonString;
        return of('ok');
      },
    };

    TestBed.configureTestingModule({
      imports: [AdminFilterEditModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
        { provide: ConfigStorageService, useValue: configStorageStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AdminFilterEditModalComponent);
    component = fixture.componentInstance;
  });

  describe('saveAdminFilter', () => {
    it('appends a new entry when no filter is being edited (add mode)', async () => {
      storedConfig = [
        {
          name: 'existing',
          indicatorTopics: [],
          indicators: [],
          georesourceTopics: [],
          georesources: [],
        },
      ];
      component.filterName = 'new filter';
      component.selectedIndicatorIds = ['indicator-1'];
      component.selectedGeoresourceTopicEditIds = ['topic-1'];

      await component.saveAdminFilter();

      expect(component.isAddMode).toBe(true);
      expect(JSON.parse(postedConfig!)).toEqual([
        storedConfig[0],
        {
          name: 'new filter',
          indicatorTopics: [],
          indicators: ['indicator-1'],
          georesourceTopics: ['topic-1'],
          georesources: [],
        },
      ]);
    });

    it('replaces the edited entry in edit mode', async () => {
      storedConfig = [
        {
          name: 'first',
          indicatorTopics: [],
          indicators: [],
          georesourceTopics: [],
          georesources: [],
        },
        {
          name: 'second',
          indicatorTopics: [],
          indicators: [],
          georesourceTopics: [],
          georesources: [],
        },
      ];
      component.selectedItem = 1;
      component.filterName = 'renamed';
      component.selectedIndicatorIds = ['indicator-1'];

      await component.saveAdminFilter();

      const posted = JSON.parse(postedConfig!);
      expect(posted).toHaveLength(2);
      expect(posted[0].name).toBe('first');
      expect(posted[1]).toEqual({
        name: 'renamed',
        indicatorTopics: [],
        indicators: ['indicator-1'],
        georesourceTopics: [],
        georesources: [],
      });
    });

    it('rejects a name another filter already uses', async () => {
      storedConfig = [
        {
          name: 'taken',
          indicatorTopics: [],
          indicators: [],
          georesourceTopics: [],
          georesources: [],
        },
      ];
      const notificationService = TestBed.inject(NotificationService);
      const showError = jest.spyOn(notificationService, 'showError');
      component.filterName = 'taken';
      component.selectedIndicatorIds = ['indicator-1'];

      await component.saveAdminFilter();

      expect(postedConfig).toBeUndefined();
      expect(showError).toHaveBeenCalled();
    });

    it('keeps its own name in edit mode', async () => {
      storedConfig = [
        {
          name: 'taken',
          indicatorTopics: [],
          indicators: [],
          georesourceTopics: [],
          georesources: [],
        },
      ];
      component.selectedItem = 0;
      component.filterName = 'taken';
      component.selectedIndicatorIds = ['indicator-1'];

      await component.saveAdminFilter();

      expect(postedConfig).toBeDefined();
    });

    it('does nothing without a name', async () => {
      component.filterName = '   ';

      await component.saveAdminFilter();

      expect(postedConfig).toBeUndefined();
    });

    it('reports a failed save and stops the loading state', async () => {
      configStorageStub.postFilterConfig = () => throwError(() => new Error('boom'));
      const notificationService = TestBed.inject(NotificationService);
      const showError = jest.spyOn(notificationService, 'showError');
      component.filterName = 'new filter';
      component.selectedIndicatorIds = ['indicator-1'];

      await component.saveAdminFilter();

      expect(showError).toHaveBeenCalled();
      expect(component.loadingData()).toBe(false);
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('template', () => {
    // The wizard's steps had no content at all until the create button was
    // wired up, so this renders them through the real DOM once.
    function seedStores(): void {
      TestBed.inject(TopicMetadataStoreService).availableTopics = [
        {
          topicId: 'main-1',
          topicName: 'Main',
          topicResource: 'indicator',
          topicType: 'main',
          subTopics: [
            {
              topicId: 'sub-1',
              topicName: 'Sub',
              topicResource: 'indicator',
              topicType: 'sub',
              subTopics: [],
            },
          ],
        },
      ] as any;
      TestBed.inject(IndicatorMetadataStoreService).availableIndicators = [
        { indicatorId: 'i-1', indicatorName: 'Indicator One', metadata: { description: 'desc' } },
      ] as any;
    }

    it('lists the available indicators on the first step', () => {
      seedStores();

      fixture.detectChanges();

      expect(fixture.nativeElement.innerHTML).toContain('Indicator One');
    });

    it('renders the topic tree and cascades a selection to the sub-topics', () => {
      seedStores();
      fixture.detectChanges();
      component.stepper.goTo(2);
      fixture.detectChanges();

      // sub-topics stay hidden until their parent is expanded
      expect(fixture.nativeElement.innerHTML).toContain('Main');
      expect(fixture.nativeElement.innerHTML).not.toContain('Sub');

      fixture.nativeElement.querySelector('.topic-toggle').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.innerHTML).toContain('Sub');

      const rootCheckbox = fixture.nativeElement.querySelector('#topic-indicator-main-1');
      rootCheckbox.checked = true;
      rootCheckbox.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.selectedIndicatorTopicEditIds).toEqual(['main-1']);
      expect(component.indicatorTopicsEditTree[0].subTopics[0].disabled).toBe(true);

      // the row states the two levels are in, which is what the styling keys on
      const rows = fixture.nativeElement.querySelectorAll('.topic-row');
      expect(rows[0].classList).toContain('is-selected');
      expect(rows[0].classList).not.toContain('is-implied');
      expect(rows[1].classList).toContain('is-implied');
    });

    it('shows how many sub-topics a branch holds', () => {
      seedStores();
      fixture.detectChanges();
      component.stepper.goTo(2);
      fixture.detectChanges();

      const count = fixture.nativeElement.querySelector('.topic-count');
      expect(count.textContent.trim()).toBe('1');
    });

    it('shows the dataset grid columns of the screenshot', () => {
      seedStores();

      fixture.detectChanges();

      const headers = Array.from(
        fixture.nativeElement.querySelectorAll('.ag-header-cell-text')
      ).map((cell: any) => cell.textContent.trim());
      expect(headers).toEqual([
        'ADMIN_SHARED.NAME',
        'ADMIN_SHARED.ID',
        'ADMIN_SHARED.DESCRIPTION',
        'ADMIN_CONFIG.FILTER_EDIT.COL_VISIBLE',
      ]);
    });

    it('feeds the grid with one row per available indicator', () => {
      seedStores();

      fixture.detectChanges();

      expect(component.preppedIndicatorData).toEqual([
        { id: 'i-1', name: 'Indicator One', description: 'desc', checked: false },
      ]);
      expect(fixture.nativeElement.innerHTML).toContain('Indicator One');
    });
  });

  describe('dataset grid columns', () => {
    // The checkbox cell is a plain DOM element built by the column's
    // cellRenderer (the pattern the admin grids use), so it is exercised
    // through that function rather than through the rendered grid.
    beforeEach(() => {
      fixture.detectChanges();
    });

    function checkboxOf(item: any): HTMLInputElement {
      const visibleColumn: any = component.indicatorDatasetColumns[3];
      return visibleColumn.cellRenderer({ data: item });
    }

    it('renders the checkbox in the state of its row', () => {
      expect(checkboxOf({ id: 'i-1', checked: false }).checked).toBe(false);
      expect(checkboxOf({ id: 'i-1', checked: true }).checked).toBe(true);
    });

    it('checking a row adds the indicator to the selection', () => {
      component.preppedIndicatorData = [
        { id: 'i-1', name: 'One', checked: false },
        { id: 'i-2', name: 'Two', checked: false },
      ];

      const checkbox = checkboxOf(component.preppedIndicatorData[1]);
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));

      expect(component.selectedIndicatorIds).toEqual(['i-2']);
      expect(component.preppedIndicatorData[1].checked).toBe(true);
    });

    it('unchecking a row removes it again', () => {
      component.preppedIndicatorData = [{ id: 'i-1', name: 'One', checked: true }];
      component.selectedIndicatorIds = ['i-1'];

      const checkbox = checkboxOf(component.preppedIndicatorData[0]);
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));

      expect(component.selectedIndicatorIds).toEqual([]);
    });

    it('sorts the visible column by the row state', () => {
      const visibleColumn: any = component.indicatorDatasetColumns[3];

      expect(visibleColumn.valueGetter({ data: { checked: true } })).toBe(true);
      expect(visibleColumn.valueGetter({ data: undefined })).toBe(false);
    });
  });

  describe('applyTopicSelection', () => {
    // This is the selection logic that used to write straight into the DOM
    // (editCheckbox-<id>.checked/.disabled, editSubTopic-<id>.style.display).
    // The tree UI was never migrated, so those writes hit nothing; the flags on
    // the nodes are now the single source of truth.
    it('selects the touched node and adds its id', () => {
      const { tree, find } = buildTree();

      const ids = component.applyTopicSelection(tree, [], 'childB', true);

      expect(ids).toEqual(['childB']);
      expect(find('childB').selected).toBe(true);
    });

    it('marks sub-topics selected and disabled, and drops their ids', () => {
      const { tree, find } = buildTree();

      // grandchild was stored explicitly; selecting its ancestor supersedes it
      const ids = component.applyTopicSelection(tree, ['grandchild'], 'childA', true);

      expect(ids).toEqual(['childA']);
      expect(find('childA').selected).toBe(true);
      expect(find('childA').disabled).toBe(false);
      expect(find('grandchild').selected).toBe(true);
      expect(find('grandchild').disabled).toBe(true);
    });

    it('expands the ancestors of the touched node', () => {
      const { tree, find } = buildTree();

      component.applyTopicSelection(tree, [], 'grandchild', true);

      expect(find('root').expanded).toBe(true);
      expect(find('childA').expanded).toBe(true);
      expect(find('childB').expanded).toBe(false);
    });

    it('deselecting removes the id and re-enables the sub-topics', () => {
      const { tree, find } = buildTree();
      let ids = component.applyTopicSelection(tree, [], 'childA', true);

      ids = component.applyTopicSelection(tree, ids, 'childA', false);

      expect(ids).toEqual([]);
      expect(find('childA').selected).toBe(false);
      expect(find('grandchild').selected).toBe(false);
      expect(find('grandchild').disabled).toBe(false);
    });

    it('does not add the same id twice', () => {
      const { tree } = buildTree();

      const ids = component.applyTopicSelection(tree, ['childB'], 'childB', true);

      expect(ids).toEqual(['childB']);
    });

    it('leaves the caller-provided list untouched', () => {
      const { tree } = buildTree();
      const original = ['childB'];

      component.applyTopicSelection(tree, original, 'childA', true);

      expect(original).toEqual(['childB']);
    });

    it('ignores an unknown id without touching the tree', () => {
      const { tree, find } = buildTree();

      const ids = component.applyTopicSelection(tree, [], 'nope', true);

      expect(ids).toEqual(['nope']);
      expect(find('root').expanded).toBe(false);
      expect(find('root').selected).toBe(false);
    });
  });

  describe('resetTreeSelection', () => {
    it('clears the flags across the whole tree, including deeper levels', () => {
      const { tree, find } = buildTree();
      component.applyTopicSelection(tree, [], 'grandchild', true);

      component.resetTreeSelection(tree);

      for (const id of ['root', 'childA', 'childB', 'grandchild']) {
        expect(find(id).selected).toBe(false);
        expect(find(id).disabled).toBe(false);
        expect(find(id).expanded).toBe(false);
      }
    });
  });

  describe('prepTopicsTree', () => {
    it('assigns levels and seeds the selection from the stored ids', () => {
      const { tree, find } = buildTree();

      component.prepTopicsTree(tree, 0, ['grandchild']);

      expect(find('root').level).toBe(0);
      expect(find('childA').level).toBe(1);
      expect(find('grandchild').level).toBe(2);
      expect(find('grandchild').selected).toBe(true);
      expect(find('root').selected).toBe(false);
    });
  });
});
