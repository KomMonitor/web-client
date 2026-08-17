import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminFilterEditModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AdminFilterEditModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
